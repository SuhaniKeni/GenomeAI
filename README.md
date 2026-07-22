# GenomeAI

FastAPI backend for DNA sequence disease prediction using trained CNN/LSTM/Transformer model artifacts.

## Run locally

```powershell
.\venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

The prediction endpoint expects a DNA sequence with exactly 201 nucleotides containing only `A`, `C`, `G`, and `T`.
