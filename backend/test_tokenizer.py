import pytest

try:
    from backend.utils.tokenizer import prepare_model_input, tokenize_sequence
except ImportError:
    from utils.tokenizer import prepare_model_input, tokenize_sequence


def test_tokenize_sequence_uses_training_mapping():
    tokens = tokenize_sequence("ATGCN")

    assert tokens.tolist() == [0, 1, 2, 3, 4]


def test_prepare_model_input_returns_batch_shape():
    sequence = "ATGC" * 50 + "N"

    tokens = prepare_model_input(sequence)

    assert tokens.shape == (1, 201)


def test_tokenize_sequence_rejects_invalid_characters():
    with pytest.raises(ValueError, match="Invalid nucleotide"):
        tokenize_sequence("ATXB")


def test_prepare_model_input_rejects_wrong_length():
    with pytest.raises(ValueError, match="exactly 201"):
        prepare_model_input("ATGCN")


def test_tokenize_sequence_accepts_nucleotide_n():
    tokens = tokenize_sequence("ATGCN")

    assert tokens.tolist() == [0, 1, 2, 3, 4]
