import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

MODEL_NAME = "InstaDeepAI/nucleotide-transformer-v2-50m-multi-species"

print("Loading tokenizer...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)

print("Loading model...")

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME, num_labels=8, trust_remote_code=True
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model.to(device)

print("\nDevice :", device)
print("Transformer loaded successfully!")
