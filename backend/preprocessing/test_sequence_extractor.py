from pathlib import Path

try:
    from .sequence_extractor import SequenceExtractor
except ImportError:
    from sequence_extractor import SequenceExtractor

PROJECT_ROOT = Path(__file__).resolve().parents[2]
GENOME = PROJECT_ROOT / (
    "datasets/raw/ncbi/"
    "ncbi_dataset/ncbi_dataset/data/"
    "GCF_000001405.40/"
    "GCF_000001405.40_GRCh38.p14_genomic.fna"
)

extractor = SequenceExtractor(GENOME)

sequence = extractor.extract(
    chromosome="17",
    position=43070922
)

print()

print(sequence)

print()

print(len(sequence))