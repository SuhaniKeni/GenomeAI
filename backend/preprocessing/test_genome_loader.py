from pathlib import Path

try:
    from .genome_loader import GenomeLoader
except ImportError:
    from genome_loader import GenomeLoader

PROJECT_ROOT = Path(__file__).resolve().parents[2]
GENOME = PROJECT_ROOT / (
    "datasets/raw/ncbi/"
    "ncbi_dataset/ncbi_dataset/data/"
    "GCF_000001405.40/"
    "GCF_000001405.40_GRCh38.p14_genomic.fna"
)

loader = GenomeLoader(GENOME)

print()

print("Total Chromosomes :", len(loader.chromosomes()))

print()

print(loader.chromosomes()[:10])

print()

print(
    loader.get_sequence(
        "NC_000017.11",
        43070900,
        43070920
    )
)