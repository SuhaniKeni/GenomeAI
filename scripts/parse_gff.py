from pathlib import Path

import pandas as pd
from tqdm import tqdm

PROJECT_ROOT = Path(__file__).resolve().parents[1]

print("=" * 60)
print("PARSING NCBI GFF ANNOTATION")
print("=" * 60)

gff_file = PROJECT_ROOT / "datasets" / "raw" / "ncbi" / "annotations" / "GCF_000001405.40_GRCh38.p14_genomic.gff" / "GCF_000001405.40_GRCh38.p14_genomic.gff"

genes = []

with open(gff_file, "r", encoding="utf-8") as file:
    for line in tqdm(file):

        if line.startswith("#"):
            continue

        parts = line.strip().split("\t")

        if len(parts) != 9:
            continue

        seqid = parts[0]
        feature = parts[2]
        start = int(parts[3])
        end = int(parts[4])
        strand = parts[6]
        attributes = parts[8]

        if feature != "gene":
            continue

        gene_name = ""
        gene_id = ""

        for item in attributes.split(";"):

            if item.startswith("Name="):
                gene_name = item.replace("Name=", "")

            elif item.startswith("gene="):
                gene_name = item.replace("gene=", "")

            elif item.startswith("ID="):
                gene_id = item.replace("ID=", "")

        genes.append({
            "GeneID": gene_id,
            "GeneSymbol": gene_name,
            "Chromosome": seqid,
            "Start": start,
            "End": end,
            "Strand": strand
        })

gene_df = pd.DataFrame(genes)

gene_df.drop_duplicates(inplace=True)

output = PROJECT_ROOT / "datasets" / "processed" / "gene_coordinates.csv"

gene_df.to_csv(output, index=False)

print("\nFinished!")
print(f"Total genes: {len(gene_df)}")
print(f"Saved to: {output}")

print("\nFirst 10 genes:")
print(gene_df.head(10))