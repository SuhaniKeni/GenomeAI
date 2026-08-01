import os
from pathlib import Path

from pyfaidx import Fasta

PROJECT_ROOT = Path(__file__).resolve().parents[1]
GENOME_FILE = PROJECT_ROOT / (
    "datasets/raw/ncbi/"
    "ncbi_dataset/ncbi_dataset/data/"
    "GCF_000001405.40/"
    "GCF_000001405.40_GRCh38.p14_genomic.fna"
)

print("=" * 60)
print("BUILDING HUMAN GENOME INDEX")
print("=" * 60)

if not os.path.exists(GENOME_FILE):
    print("\nGenome file not found!")
    print(GENOME_FILE)
    exit()

print("\nLoading genome...")
genome = Fasta(GENOME_FILE)

print("\nGenome loaded successfully!")

print("\nChromosomes found:")
for chromosome in genome.keys():
    print(chromosome)

print("\nGenome indexing complete!")
