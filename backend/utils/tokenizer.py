import re
import numpy as np

TOKEN_MAP = {
    "A": 0,
    "T": 1,
    "G": 2,
    "C": 3,
    "N": 4,
}

EXPECTED_LENGTH = 201
MIN_LENGTH = 201
ALLOWED_BASES = ", ".join(TOKEN_MAP.keys())


def _clean_sequence(sequence: str) -> str:
    if sequence is None:
        raise ValueError("DNA sequence is required.")

    text = str(sequence)
    # Remove FASTA header if present
    text = re.sub(r"^>.*$", "", text, flags=re.MULTILINE)
    # Remove all whitespace characters (spaces, tabs, newlines)
    cleaned = re.sub(r"\s+", "", text).upper()
    return cleaned


def validate_dna_sequence(sequence: str, *, min_length: int = MIN_LENGTH) -> str:
    cleaned = _clean_sequence(sequence)

    if len(cleaned) < min_length:
        raise ValueError("DNA sequence must contain at least 201 nucleotides.")

    for position, nucleotide in enumerate(cleaned, start=1):
        if nucleotide not in TOKEN_MAP:
            raise ValueError(
                f"Invalid nucleotide '{nucleotide}' at position {position}. "
                f"Allowed nucleotides are A, T, C, G, and N."
            )

    return cleaned


def tokenize_sequence(sequence: str, *, strict: bool = True) -> np.ndarray:
    """Convert a DNA sequence into integer tokens.

    The shared mapping matches training exactly:
    A=0, T=1, G=2, C=3, N=4.
    """

    cleaned_sequence = _clean_sequence(sequence)
    tokens = []

    for position, nucleotide in enumerate(cleaned_sequence, start=1):
        if nucleotide in TOKEN_MAP:
            tokens.append(TOKEN_MAP[nucleotide])
            continue

        if strict:
            raise ValueError(
                f"Invalid nucleotide '{nucleotide}' at position {position}. "
                f"Allowed nucleotides are {ALLOWED_BASES}."
            )

        tokens.append(TOKEN_MAP["N"])

    return np.array(tokens, dtype=np.int32)


def generate_windows(sequence: str, window_size: int = 201, stride: int = 25) -> list[dict]:
    """Generate 201 bp sliding windows with stride 25 across sequence."""
    cleaned = validate_dna_sequence(sequence, min_length=window_size)
    seq_len = len(cleaned)

    if seq_len == window_size:
        return [{
            "index": 1,
            "start": 0,
            "end": window_size,
            "start_1based": 1,
            "end_1based": window_size,
            "sequence": cleaned,
        }]

    windows = []
    start = 0
    win_idx = 1

    while start + window_size <= seq_len:
        end = start + window_size
        windows.append({
            "index": win_idx,
            "start": start,
            "end": end,
            "start_1based": start + 1,
            "end_1based": end,
            "sequence": cleaned[start:end],
        })
        start += stride
        win_idx += 1

    # Ensure tail segment of sequence is covered by a final window if needed
    if windows and windows[-1]["end"] < seq_len:
        start = seq_len - window_size
        end = seq_len
        windows.append({
            "index": win_idx,
            "start": start,
            "end": end,
            "start_1based": start + 1,
            "end_1based": end,
            "sequence": cleaned[start:end],
        })

    return windows


def prepare_multi_window_input(sequence: str, window_size: int = 201, stride: int = 25) -> tuple[np.ndarray, list[dict]]:
    """Tokenize sliding windows for multi-window batch inference."""
    windows = generate_windows(sequence, window_size=window_size, stride=stride)
    tokens_list = [tokenize_sequence(w["sequence"], strict=True) for w in windows]
    tokens_batch = np.vstack(tokens_list)
    return tokens_batch, windows


def prepare_model_input(sequence: str) -> np.ndarray:
    cleaned_sequence = _clean_sequence(sequence)

    if len(cleaned_sequence) < MIN_LENGTH:
        raise ValueError("DNA sequence must contain at least 201 nucleotides.")

    if len(cleaned_sequence) != EXPECTED_LENGTH:
        # Fallback for single window extraction or exact match requirement
        tokens = tokenize_sequence(cleaned_sequence[:EXPECTED_LENGTH], strict=True)
        return np.expand_dims(tokens, axis=0)

    tokens = tokenize_sequence(cleaned_sequence, strict=True)

    return np.expand_dims(tokens, axis=0)

