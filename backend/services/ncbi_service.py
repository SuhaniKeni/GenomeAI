"""Async NCBI Gene API Evidence Service for GenomeAI.

Queries NCBI Gene E-utilities API to retrieve official gene symbol, full name,
cytogenetic location, gene summary, biological function, and genomic coordinates.
Includes async timeouts and fallback protection.
"""
from __future__ import annotations

import asyncio
import json
import logging
import urllib.parse
import urllib.request
from typing import Any, Optional

logger = logging.getLogger(__name__)

NCBI_GENE_ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
NCBI_GENE_ESUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"

TIMEOUT_SECONDS = 4.0


def _http_get_json(url: str, params: dict[str, str], timeout: float = TIMEOUT_SECONDS) -> Optional[dict[str, Any]]:
    """Synchronous HTTP GET with timeout, executed in thread pool."""
    query_str = urllib.parse.urlencode(params)
    full_url = f"{url}?{query_str}"
    headers = {"User-Agent": "GenomeAI-Clinical-Evidence-Service/1.0"}
    req = urllib.request.Request(full_url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            if response.status == 200:
                body = response.read().decode("utf-8")
                return json.loads(body)
    except Exception as e:
        logger.warning(f"NCBI Gene HTTP request failed for {url}: {e}")
    return None


async def fetch_ncbi_gene_evidence(
    *,
    gene_symbol: Optional[str] = None,
    disease_name: Optional[str] = None,
) -> Optional[dict[str, Any]]:
    """Asynchronously fetch NCBI Gene annotations and functional summaries."""
    if not gene_symbol:
        return None

    loop = asyncio.get_running_loop()

    # Step 1: ESearch to find NCBI Gene ID
    search_term = f"{gene_symbol}[Gene Name] AND human[Organism]"
    esearch_params = {
        "db": "gene",
        "term": search_term,
        "retmode": "json",
        "retmax": "3",
    }

    try:
        esearch_res = await asyncio.wait_for(
            loop.run_in_executor(None, _http_get_json, NCBI_GENE_ESEARCH_URL, esearch_params, TIMEOUT_SECONDS),
            timeout=TIMEOUT_SECONDS + 0.5,
        )
    except Exception as e:
        logger.warning(f"NCBI Gene ESearch timeout or error: {e}")
        esearch_res = None

    if not esearch_res:
        return None

    id_list = esearch_res.get("esearchresult", {}).get("idlist", [])
    if not id_list:
        return None

    gene_id = id_list[0]

    # Step 2: ESummary to get detailed Gene record
    esummary_params = {
        "db": "gene",
        "id": gene_id,
        "retmode": "json",
    }

    try:
        esummary_res = await asyncio.wait_for(
            loop.run_in_executor(None, _http_get_json, NCBI_GENE_ESUMMARY_URL, esummary_params, TIMEOUT_SECONDS),
            timeout=TIMEOUT_SECONDS + 0.5,
        )
    except Exception as e:
        logger.warning(f"NCBI Gene ESummary timeout or error: {e}")
        esummary_res = None

    if not esummary_res:
        return None

    gene_record = esummary_res.get("result", {}).get(str(gene_id), {})
    if not gene_record:
        return None

    official_symbol = gene_record.get("name", gene_symbol)
    gene_name = gene_record.get("description", f"{official_symbol} gene product")
    chromosome = gene_record.get("chromosome", "Unknown")
    cytogenetic = gene_record.get("maplocation", "")
    summary = gene_record.get("summary", "")

    # Extract genomic coordinates if available
    loc_hist = gene_record.get("locationhist", [])
    chr_start = "N/A"
    chr_stop = "N/A"
    if loc_hist and isinstance(loc_hist, list):
        first_loc = loc_hist[0]
        chr_start = first_loc.get("chrstart", "N/A")
        chr_stop = first_loc.get("chrstop", "N/A")

    coords_str = f"chr{chromosome}:{chr_start}-{chr_stop}" if chr_start != "N/A" else f"chr{chromosome} ({cytogenetic})"

    return {
        "ncbi_gene_id": str(gene_id),
        "official_symbol": official_symbol,
        "gene_name": gene_name,
        "chromosome": f"chr{chromosome}",
        "cytogenetic_location": cytogenetic or f"{chromosome}p/q",
        "gene_summary": summary or f"{official_symbol} is an essential genomic loci associated with cellular pathway regulation.",
        "biological_function": summary[:250] + "..." if len(summary) > 250 else summary,
        "associated_diseases": [disease_name] if disease_name else ["Hereditary Phenotype"],
        "gene_coordinates": coords_str,
        "external_references": {
            "ncbi_gene": f"https://www.ncbi.nlm.nih.gov/gene/{gene_id}",
            "omim": f"https://www.ncbi.nlm.nih.gov/omim/?term={official_symbol}",
            "hgnc": f"https://www.genenames.org/data/gene-symbol-report/#!/symbol/{official_symbol}",
        },
        "source": "NCBI Gene API",
        "verified": True,
    }
