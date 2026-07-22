class MutationEngine:

    @staticmethod
    def apply_mutation(sequence, reference, alternate):

        if sequence is None:
            return None

        sequence = sequence.upper()

        middle = len(sequence) // 2

        seq = list(sequence)

        # Verify reference base
        if seq[middle] != reference.upper():
            return None

        # Apply mutation
        seq[middle] = alternate.upper()

        return "".join(seq)