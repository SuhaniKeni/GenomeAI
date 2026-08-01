from pathlib import Path

from backend.preprocessing.genome_loader import GenomeLoader

PROJECT_ROOT = Path(__file__).resolve().parent.parent
GENOME = PROJECT_ROOT / (
    "datasets/raw/ncbi/"
    "ncbi_dataset/ncbi_dataset/data/"
    "GCF_000001405.40/"
    "GCF_000001405.40_GRCh38.p14_genomic.fna"
)


def test_genome_loader_initialization():
    loader = GenomeLoader(GENOME)
    assert loader is not None
