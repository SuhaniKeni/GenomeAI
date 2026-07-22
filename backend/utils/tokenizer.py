import numpy as np

TOKEN_MAP = {
    "A": 0,
    "T": 1,
    "G": 2,
    "C": 3,
    "N": 4,
}

EXPECTED_LENGTH = 201
ALLOWED_BASES = ", ".join(TOKEN_MAP.keys())


def _clean_sequence(sequence: str) -> str:
    if sequence is None:
        raise ValueError("DNA sequence is required.")

    return str(sequence).strip().upper()


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


def prepare_model_input(sequence: str) -> np.ndarray:
    cleaned_sequence = _clean_sequence(sequence)

    if len(cleaned_sequence) != EXPECTED_LENGTH:
        raise ValueError(
            f"Sequence must contain exactly {EXPECTED_LENGTH} nucleotides. "
            f"Received {len(cleaned_sequence)}."
        )

    tokens = tokenize_sequence(cleaned_sequence, strict=True)

    return np.expand_dims(tokens, axis=0)
