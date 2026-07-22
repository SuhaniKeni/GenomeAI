"""
Genome Loader
Loads the Human Reference Genome (GRCh38)
"""

from pyfaidx import Fasta
import os


class GenomeLoader:

    def __init__(self, genome_path):

        if not os.path.exists(genome_path):
            raise FileNotFoundError(
                f"Genome not found:\n{genome_path}"
            )

        print("Loading Human Reference Genome...")

        self.genome = Fasta(
            genome_path,
            sequence_always_upper=True
        )

        print("Genome Loaded Successfully")

    def chromosomes(self):
        return list(self.genome.keys())

    def chromosome_exists(self, chromosome):
        return chromosome in self.genome

    def get_sequence(self, chromosome, start, end):
        return self.genome[chromosome][start:end].seq

    def chromosome_length(self, chromosome):
        return len(self.genome[chromosome])