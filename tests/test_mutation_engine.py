from backend.preprocessing.mutation_engine import MutationEngine


def test_apply_mutation():
    sequence = "AAAAAAAAAACAAAAAAAAAA"
    reference = "C"
    alternate = "T"

    mutated = MutationEngine.apply_mutation(sequence, reference, alternate)

    assert mutated == "AAAAAAAAAATAAAAAAAAAA"
