try:
    from .mutation_engine import MutationEngine
except ImportError:
    from mutation_engine import MutationEngine

sequence = "AAAAAAAAAACAAAAAAAAAA"

reference = "C"
alternate = "T"

mutated = MutationEngine.apply_mutation(
    sequence,
    reference,
    alternate
)

print("Reference :", sequence)
print("Mutated   :", mutated)