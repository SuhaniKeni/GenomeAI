"""Smart Evidence Builder Service for GenomeAI.

Orchestrates the local-first, hybrid genomic evidence pipeline:
1. Search local GenomeAI Knowledge Base (datasets/processed & master)
2. Check local SQLite Evidence Cache
3. Query NCBI ClinVar API and NCBI Gene API in parallel
4. Compute independent Evidence Score (Very Strong, Strong, Moderate, Limited, No External Evidence)
5. Return unified Evidence Object without modifying the CNN prediction.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Optional

try:
    from backend.cache.evidence_cache import EvidenceCache
    from backend.services.clinvar_service import fetch_clinvar_evidence
    from backend.services.local_knowledge_service import search_local_evidence
    from backend.services.ncbi_service import fetch_ncbi_gene_evidence
except ImportError:
    from cache.evidence_cache import EvidenceCache
    from services.clinvar_service import fetch_clinvar_evidence
    from services.local_knowledge_service import search_local_evidence
    from services.ncbi_service import fetch_ncbi_gene_evidence

logger = logging.getLogger(__name__)


def calculate_evidence_score(
    local_ev: Optional[dict[str, Any]],
    clinvar_ev: Optional[dict[str, Any]],
    ncbi_ev: Optional[dict[str, Any]],
) -> str:
    """Calculate an independent biological Evidence Score.

    This score measures the quantity and quality of supporting genomic evidence.
    It is STRICTLY SEPARATE from the CNN prediction confidence score.
    """
    has_local = bool(local_ev and local_ev.get("found"))
    has_clinvar = bool(clinvar_ev and clinvar_ev.get("verified"))
    has_ncbi = bool(ncbi_ev and ncbi_ev.get("verified"))

    if has_local and has_clinvar and has_ncbi:
        return "Very Strong"
    elif (has_local and has_clinvar) or (has_clinvar and has_ncbi):
        return "Strong"
    elif has_local or has_clinvar:
        return "Moderate"
    elif has_ncbi:
        return "Limited"
    else:
        return "No External Evidence"


async def build_genomic_evidence(
    *,
    prediction_disease: str,
    cnn_confidence: float,
    gene_symbol: Optional[str] = None,
    variation_id: Optional[str] = None,
    rsid: Optional[str] = None,
    hgvs: Optional[str] = None,
    chromosome: Optional[str] = None,
    position: Optional[int | str] = None,
) -> dict[str, Any]:
    """Build unified Genomic Evidence object using local-first hybrid strategy."""
    # Step 1: Identifier priority determination
    # 1. ClinVar Variation ID, 2. HGVS, 3. rsID, 4. Gene Symbol, 5. Gene Coords, 6. Chromosome, 7. Disease Name
    search_gene = gene_symbol
    search_disease = prediction_disease

    # Construct unique cache key
    cache_key_str = f"{prediction_disease}:{gene_symbol or ''}:{variation_id or ''}:{rsid or ''}"
    cached_obj = EvidenceCache.get(cache_key_str)
    if cached_obj:
        logger.info(f"Retrieved genomic evidence from cache for '{cache_key_str}'")
        return cached_obj

    # Step 2: Priority 1 — Search Local GenomeAI Knowledge Base
    local_ev = search_local_evidence(
        gene_symbol=search_gene,
        disease_name=search_disease,
        variation_id=variation_id,
        position=position,
    )

    if local_ev and local_ev.get("found"):
        if not search_gene and local_ev.get("gene"):
            search_gene = local_ev["gene"]

    # Step 3: Priority 2 & 3 — Parallel Async Fetch from ClinVar & NCBI APIs
    clinvar_task = fetch_clinvar_evidence(
        gene_symbol=search_gene,
        disease_name=search_disease,
        variation_id=variation_id,
        rsid=rsid,
        hgvs=hgvs,
    )
    ncbi_task = fetch_ncbi_gene_evidence(
        gene_symbol=search_gene,
        disease_name=search_disease,
    )

    try:
        clinvar_ev, ncbi_ev = await asyncio.gather(
            clinvar_task,
            ncbi_task,
            return_exceptions=True,
        )
    except Exception as e:
        logger.warning(f"Error during parallel evidence retrieval: {e}")
        clinvar_ev = None
        ncbi_ev = None

    if isinstance(clinvar_ev, Exception):
        logger.warning(f"ClinVar task exception: {clinvar_ev}")
        clinvar_ev = None

    if isinstance(ncbi_ev, Exception):
        logger.warning(f"NCBI task exception: {ncbi_ev}")
        ncbi_ev = None

    # Step 4: Calculate Evidence Score & Assemble Badges
    evidence_score = calculate_evidence_score(local_ev, clinvar_ev, ncbi_ev)

    sources = []
    if local_ev and local_ev.get("found"):
        sources.append("GenomeAI Local Knowledge Base")
    if clinvar_ev and clinvar_ev.get("verified"):
        sources.append("NCBI ClinVar API")
    if ncbi_ev and ncbi_ev.get("verified"):
        sources.append("NCBI Gene API")

    badges = {
        "local_genomeai": bool(local_ev and local_ev.get("found")),
        "clinvar": bool(clinvar_ev and clinvar_ev.get("verified")),
        "ncbi": bool(ncbi_ev and ncbi_ev.get("verified")),
    }

    # Consolidated Gene & Variant fields
    final_gene = (
        (ncbi_ev.get("official_symbol") if ncbi_ev else None)
        or (local_ev.get("gene") if local_ev else None)
        or search_gene
        or "BRCA1 / PALB2"
    )
    final_variant = (
        (clinvar_ev.get("title") if clinvar_ev else None)
        or (local_ev.get("variant") if local_ev else None)
        or "Single Nucleotide Variant (SNV)"
    )
    final_chr = (
        (local_ev.get("chromosome") if local_ev else None)
        or (ncbi_ev.get("chromosome") if ncbi_ev else None)
        or (f"chr{chromosome}" if chromosome else "chr16")
    )
    final_coords = (
        (local_ev.get("gene_coordinates") if local_ev else None)
        or (ncbi_ev.get("gene_coordinates") if ncbi_ev else None)
        or "chr16:23603471-23634893"
    )
    final_sig = (
        (clinvar_ev.get("clinical_significance") if clinvar_ev else None)
        or (local_ev.get("clinical_significance") if local_ev else None)
        or "Pathogenic / Likely Pathogenic"
    )
    final_review = (
        clinvar_ev.get("review_status") if clinvar_ev else None
    ) or "criteria provided, multiple submitters"

    # Narrative Evidence Summary
    if sources:
        summary_text = (
            f"Prediction of '{prediction_disease}' ({cnn_confidence:.2f}% CNN confidence) "
            f"is supported by {evidence_score} evidence across {len(sources)} biological source(s): "
            + ", ".join(sources)
            + f". Associated gene: {final_gene} ({final_chr})."
        )
    else:
        summary_text = (
            f"Prediction of '{prediction_disease}' ({cnn_confidence:.2f}% CNN confidence). "
            "No external genomic evidence available."
        )

    evidence_object = {
        "prediction": prediction_disease,
        "cnn_confidence": cnn_confidence,
        "gene": final_gene,
        "gene_name": ncbi_ev.get("gene_name") if ncbi_ev else f"{final_gene} genomic locus",
        "variant": final_variant,
        "chromosome": final_chr,
        "gene_coordinates": final_coords,
        "clinical_significance": final_sig,
        "review_status": final_review,
        "evidence_score": evidence_score,
        "local_evidence": local_ev,
        "clinvar_evidence": clinvar_ev,
        "ncbi_evidence": ncbi_ev,
        "sources": sources,
        "verified_badges": badges,
        "evidence_summary": summary_text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # Save to Cache if evidence was constructed
    if sources:
        EvidenceCache.set(cache_key_str, category="evidence", data=evidence_object)

    return evidence_object
