"""NCBI Remote BLAST Sequence Similarity Analysis Service for GenomeAI.

Provides modular, independent sequence alignment against NCBI nucleotide databases
using Biopython (Bio.Blast.NCBIWWW and Bio.Blast.NCBIXML).
Executes asynchronously with timeout protection, strict sequence validation,
and graceful fallback handling.
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
import time
from io import StringIO
from typing import Any, Optional

try:
    from Bio.Blast import NCBIWWW, NCBIXML
except Exception as e:
    NCBIWWW = None
    NCBIXML = None
    logging.getLogger(__name__).warning(f"Biopython Bio.Blast import unavailable: {e}")

logger = logging.getLogger(__name__)

# Configurable settings
BLAST_PROGRAM = os.getenv("BLAST_PROGRAM", "blastn")
BLAST_DATABASE = os.getenv("BLAST_DATABASE", "nt")
BLAST_TIMEOUT = float(os.getenv("BLAST_TIMEOUT", "15.0"))
BLAST_MAX_RESULTS = int(os.getenv("BLAST_MAX_RESULTS", "5"))
BLAST_EVALUE_THRESHOLD = float(os.getenv("BLAST_EVALUE_THRESHOLD", "10.0"))
BLAST_ENABLED = os.getenv("BLAST_ENABLED", "true").lower() in ("true", "1", "yes")

ALLOWED_NUCLEOTIDES = set("ATGCN")
MAX_SEQUENCE_LENGTH = 5000


def validate_blast_sequence(sequence: str) -> str:
    """Validate and normalize DNA sequence input for BLAST analysis."""
    if not sequence or not isinstance(sequence, str):
        raise ValueError("DNA sequence input must be a non-empty string.")

    # Strip FASTA header lines if present
    cleaned = re.sub(r"^>.*$", "", sequence, flags=re.MULTILINE)
    # Remove all whitespace
    cleaned = re.sub(r"\s+", "", cleaned).upper()

    if not cleaned:
        raise ValueError("DNA sequence cannot be empty.")

    if len(cleaned) > MAX_SEQUENCE_LENGTH:
        raise ValueError(
            f"DNA sequence exceeds maximum allowed length of {MAX_SEQUENCE_LENGTH} bp. "
            f"Received {len(cleaned)} bp."
        )

    for pos, char in enumerate(cleaned, start=1):
        if char not in ALLOWED_NUCLEOTIDES:
            raise ValueError(
                f"Invalid nucleotide '{char}' at position {pos}. "
                "Allowed nucleotides are A, T, G, C, and N."
            )

    return cleaned


def _format_evalue(evalue: float | int) -> str:
    """Format E-value cleanly (e.g. '0.0' or '1e-45')."""
    if evalue == 0 or evalue == 0.0:
        return "0.0"
    if evalue < 1e-4:
        return f"{evalue:.1e}"
    return f"{evalue:.4f}"


def _extract_gene_symbol(title: str) -> str:
    """Attempt to extract gene symbol from BLAST hit title."""
    # Match patterns like (BRCA1), gene symbol in parens, or uppercase gene acronyms
    paren_match = re.search(r"\(([A-Za-z0-9\-_]{2,15})\)", title)
    if paren_match:
        cand = paren_match.group(1)
        if cand.isupper() or any(c.isdigit() for c in cand):
            return cand

    # Match patterns like 'gene BRCA1' or 'BRCA1 DNA'
    gene_match = re.search(r"\b([A-Z][A-Z0-9\-]{2,10})\b", title)
    if gene_match:
        return gene_match.group(1)

    return "Genomic Hit"


def _extract_organism(title: str) -> str:
    """Extract organism name from BLAST hit title."""
    bracket_match = re.search(r"\[(.*?)\]", title)
    if bracket_match:
        return bracket_match.group(1)
    if "Homo sapiens" in title:
        return "Homo sapiens"
    return "Homo sapiens"


def run_blast(
    sequence: str,
    program: str = BLAST_PROGRAM,
    database: str = BLAST_DATABASE,
    expect: float = BLAST_EVALUE_THRESHOLD,
    hitlist_size: int = BLAST_MAX_RESULTS,
) -> str:
    """Perform synchronous NCBI Remote BLAST query via qblast (runs in thread pool)."""
    cleaned_seq = validate_blast_sequence(sequence)
    logger.info(f"Submitting NCBI Remote BLAST search: {len(cleaned_seq)} bp, program={program}, db={database}")

    result_handle = NCBIWWW.qblast(
        program=program,
        database=database,
        sequence=cleaned_seq,
        expect=expect,
        hitlist_size=hitlist_size,
    )
    xml_data = result_handle.read()
    result_handle.close()
    return xml_data


def _parse_with_element_tree(xml_output: str, query_len: int) -> dict[str, Any]:
    """Fallback XML parser using standard xml.etree.ElementTree."""
    import xml.etree.ElementTree as ET
    root = ET.fromstring(xml_output)
    hit = root.find(".//Hit")
    if hit is None:
        return {
            "status": "completed",
            "query_length": query_len,
            "top_hit": None,
            "message": "No matching sequence alignments found in NCBI database.",
        }

    hit_id = hit.findtext("Hit_id", "")
    hit_def = hit.findtext("Hit_def", "")
    accession = hit.findtext("Hit_accession", "")
    if not accession and "|" in hit_id:
        parts = hit_id.split("|")
        for i, p in enumerate(parts):
            if p in ("ref", "gb", "emb", "dbj") and i + 1 < len(parts):
                accession = parts[i + 1].split(".")[0]
                break

    hsp = hit.find(".//Hsp")
    if hsp is None:
        return {
            "status": "completed",
            "query_length": query_len,
            "top_hit": None,
            "message": "Alignment contains no High-scoring Segment Pairs (HSPs).",
        }

    align_len = int(hsp.findtext("Hsp_align-len", "0"))
    identities = int(hsp.findtext("Hsp_identity", "0"))
    bit_score = float(hsp.findtext("Hsp_bit-score", "0.0"))
    evalue_raw = hsp.findtext("Hsp_evalue", "0.0")

    try:
        evalue_float = float(evalue_raw)
    except ValueError:
        evalue_float = 0.0

    identity_pct = round((identities / align_len) * 100.0, 2) if align_len > 0 else 0.0
    coverage_pct = min(round((align_len / query_len) * 100.0, 2), 100.0) if query_len > 0 else 0.0

    gene_symbol = _extract_gene_symbol(hit_def)
    organism = _extract_organism(hit_def)
    ncbi_url = f"https://www.ncbi.nlm.nih.gov/nuccore/{accession}" if accession else "https://www.ncbi.nlm.nih.gov/"

    top_hit = {
        "gene": gene_symbol,
        "accession": accession or "N/A",
        "organism": organism,
        "identity": identity_pct,
        "coverage": coverage_pct,
        "alignment_length": align_len,
        "bit_score": round(bit_score, 1),
        "evalue": _format_evalue(evalue_float),
        "description": hit_def[:120] if hit_def else "NCBI Blast Hit",
        "ncbi_url": ncbi_url,
    }

    return {
        "status": "completed",
        "query_length": query_len,
        "top_hit": top_hit,
    }


def parse_results(xml_output: str, query_len: int) -> dict[str, Any]:
    """Parse NCBI BLAST XML output string and extract structured top hit."""
    if not xml_output or not xml_output.strip():
        raise ValueError("BLAST XML output is empty.")

    try:
        blast_records = list(NCBIXML.parse(StringIO(xml_output)))
        if not blast_records:
            return _parse_with_element_tree(xml_output, query_len)

        record = blast_records[0]
        if not record.alignments:
            return {
                "status": "completed",
                "query_length": query_len,
                "top_hit": None,
                "message": "No matching sequence alignments found in NCBI database.",
            }

        alignment = record.alignments[0]
        title = alignment.title
        accession = alignment.accession or "N/A"
        if accession == "N/A" and "|" in title:
            parts = title.split("|")
            for i, p in enumerate(parts):
                if p in ("ref", "gb", "emb", "dbj") and i + 1 < len(parts):
                    accession = parts[i + 1].split(".")[0]
                    break

        hsp = alignment.hsps[0] if alignment.hsps else None
        if not hsp:
            return {
                "status": "completed",
                "query_length": query_len,
                "top_hit": None,
                "message": "Alignment contains no High-scoring Segment Pairs (HSPs).",
            }

        align_len = hsp.align_length
        identities = hsp.identities
        identity_pct = round((identities / align_len) * 100.0, 2) if align_len > 0 else 0.0
        coverage_pct = min(round((align_len / query_len) * 100.0, 2), 100.0) if query_len > 0 else 0.0

        gene_symbol = _extract_gene_symbol(title)
        organism = _extract_organism(title)
        ncbi_url = f"https://www.ncbi.nlm.nih.gov/nuccore/{accession}" if accession != "N/A" else "https://www.ncbi.nlm.nih.gov/"

        top_hit = {
            "gene": gene_symbol,
            "accession": accession,
            "organism": organism,
            "identity": identity_pct,
            "coverage": coverage_pct,
            "alignment_length": align_len,
            "bit_score": round(float(hsp.bits), 1),
            "evalue": _format_evalue(hsp.expect),
            "description": alignment.hit_def or title[:120],
            "ncbi_url": ncbi_url,
        }

        return {
            "status": "completed",
            "query_length": query_len,
            "top_hit": top_hit,
        }
    except Exception as exc:
        logger.info(f"Biopython parse fallback to ElementTree due to: {exc}")
        try:
            return _parse_with_element_tree(xml_output, query_len)
        except Exception as et_exc:
            raise ValueError(f"Failed to parse BLAST XML output: {et_exc}") from et_exc


def format_response(
    result_data: dict[str, Any],
    execution_time_ms: float = 0.0,
) -> dict[str, Any]:
    """Format BLAST dictionary response into standardized JSON structure."""
    res = {
        "status": result_data.get("status", "completed"),
        "query_length": result_data.get("query_length", 0),
        "execution_time_ms": round(execution_time_ms, 2),
        "top_hit": result_data.get("top_hit"),
    }
    if "error" in result_data:
        res["error"] = result_data["error"]
    if "message" in result_data and not result_data.get("top_hit"):
        res["message"] = result_data["message"]
    return res


async def execute_blast_search(
    sequence: str,
    timeout: float = BLAST_TIMEOUT,
) -> dict[str, Any]:
    """Asynchronously execute NCBI Remote BLAST search with timeout and graceful error fallbacks."""
    start_time = time.perf_counter()

    if not BLAST_ENABLED:
        return {
            "status": "disabled",
            "message": "NCBI Remote BLAST service is currently disabled in configuration.",
            "query_length": len(sequence) if isinstance(sequence, str) else 0,
            "execution_time_ms": 0.0,
            "top_hit": None,
        }

    try:
        cleaned_seq = validate_blast_sequence(sequence)
    except ValueError as val_err:
        logger.warning(f"BLAST input validation failed: {val_err}")
        return {
            "status": "failed",
            "error": str(val_err),
            "query_length": len(sequence) if isinstance(sequence, str) else 0,
            "execution_time_ms": 0.0,
            "top_hit": None,
        }

    query_len = len(cleaned_seq)
    loop = asyncio.get_running_loop()

    try:
        xml_output = await asyncio.wait_for(
            loop.run_in_executor(None, run_blast, cleaned_seq),
            timeout=timeout,
        )
        parsed = parse_results(xml_output, query_len=query_len)
        exec_ms = (time.perf_counter() - start_time) * 1000.0
        acc = parsed.get("top_hit", {}).get("accession") if parsed.get("top_hit") else "None"
        logger.info(f"BLAST search completed successfully in {exec_ms:.1f}ms. Top accession: {acc}")
        return format_response(parsed, execution_time_ms=exec_ms)

    except asyncio.TimeoutError:
        exec_ms = (time.perf_counter() - start_time) * 1000.0
        logger.warning(f"NCBI Remote BLAST search timed out after {timeout}s.")
        return {
            "status": "failed",
            "error": f"NCBI BLAST request timed out after {timeout} seconds.",
            "query_length": query_len,
            "execution_time_ms": round(exec_ms, 2),
            "top_hit": None,
        }
    except Exception as exc:
        exec_ms = (time.perf_counter() - start_time) * 1000.0
        logger.warning(f"NCBI Remote BLAST search failed: {exc}")
        return {
            "status": "failed",
            "error": f"NCBI BLAST service error: {exc}",
            "query_length": query_len,
            "execution_time_ms": round(exec_ms, 2),
            "top_hit": None,
        }
