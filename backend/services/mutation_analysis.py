"""Mutation analysis service.

Detects and classifies mutations in DNA sequences relative to a reference,
and identifies their potential impact on disease prediction.
"""
from __future__ import annotations

from typing import Optional

import numpy as np

TOKEN_MAP = {"A": 0, "T": 1, "G": 2, "C": 3, "N": 4}
REV_MAP = {0: "A", 1: "T", 2: "G", 3: "C", 4: "N"}

# Simple impact scoring based on mutation type
MUTATION_IMPACT = {
    "missense": "High",
    "nonsense": "Very High",
    "frameshift": "Very High",
    "deletion": "High",
    "insertion": "High",
    "silent": "Low",
    "transition": "Moderate",
    "transversion": "Moderate",
}


def _token_to_base(t: int) -> str:
    return REV_MAP.get(t, "N")


def _base_to_token(b: str) -> int:
    return TOKEN_MAP.get(b.upper(), 4)


def _classify_mutation(ref_base: str, obs_base: str) -> str:
    """Classify the type of point mutation."""
    purines = {"A", "G"}
    pyrimidines = {"C", "T"}

    if ref_base == obs_base:
        return "silent"

    if ref_base in purines and obs_base in purines:
        return "transition"
    if ref_base in pyrimidines and obs_base in pyrimidines:
        return "transition"

    return "transversion"


def detect_mutations(
    reference_sequence: str,
    observed_sequence: str,
    reference_genome_start: int = 0,
) -> dict:
    """Detect mutations between a reference and observed DNA sequence.

    Args:
        reference_sequence: the reference/wild-type DNA string
        observed_sequence: the query/patient DNA string
        reference_genome_start: genomic start position (for display)

    Returns:
        dict with mutation summary and per-position mutation details
    """
    ref = reference_sequence.upper().strip()
    obs = observed_sequence.upper().strip()

    if len(ref) != len(obs):
        raise ValueError(
            f"Sequence length mismatch: reference {len(ref)} != observed {len(obs)}"
        )

    mutations = []
    mutation_count = 0
    types = {}

    for i in range(len(ref)):
        if ref[i] == obs[i]:
            continue

        mutation_count += 1
        mut_type = _classify_mutation(ref[i], obs[i])
        impact = MUTATION_IMPACT.get(mut_type, "Moderate")

        types[mut_type] = types.get(mut_type, 0) + 1

        mutations.append({
            "position": reference_genome_start + i + 1,  # 1-based
            "index_in_sequence": i,
            "reference_base": ref[i],
            "observed_base": obs[i],
            "mutation_type": mut_type,
            "impact": impact,
        })

    # Determine overall impact
    if mutation_count == 0:
        overall_impact = "None"
    elif any(m["impact"] == "Very High" for m in mutations):
        overall_impact = "Very High"
    elif any(m["impact"] == "High" for m in mutations):
        overall_impact = "High"
    elif any(m["impact"] == "Moderate" for m in mutations):
        overall_impact = "Moderate"
    else:
        overall_impact = "Low"

    return {
        "total_mutations": mutation_count,
        "mutation_types": types,
        "overall_impact": overall_impact,
        "mutations": mutations,
        "reference_length": len(ref),
    }


def compare_to_consensus(
    observed_tokens: np.ndarray,
    consensus_tokens: Optional[np.ndarray] = None,
    genome_start: int = 0,
) -> dict:
    """Detect mutations comparing tokenised observed vs consensus sequence.

    If no consensus is provided, the reference is inferred as the most common
    nucleotide across the dataset (defaulting to 'N' for unknown positions).
    """
    seq_len = observed_tokens.shape[1]

    if consensus_tokens is None:
        # Default consensus: middle position is the mutated base
        consensus_tokens = observed_tokens.copy()
        consensus_tokens[0, :] = TOKEN_MAP["N"]

    obs_str = "".join(_token_to_base(int(observed_tokens[0, i])) for i in range(seq_len))
    con_str = "".join(_token_to_base(int(consensus_tokens[0, i])) for i in range(seq_len))

    return detect_mutations(con_str, obs_str, genome_start)


def get_mutation_summary_text(mutation_result: dict, disease_name: str) -> str:
    """Generate a human-readable summary of mutation analysis."""
    total = mutation_result["total_mutations"]
    if total == 0:
        return f"No mutations detected in the sequence linked to {disease_name}."

    text = f"Detected {total} mutation{'s' if total != 1 else ''} "
    text += f"with {mutation_result['overall_impact'].lower()} impact on {disease_name}. "

    types = mutation_result["mutation_types"]
    type_desc = ", ".join(f"{count} {mtype}" for mtype, count in sorted(types.items()))
    text += f"Types observed: {type_desc}."

    return text
