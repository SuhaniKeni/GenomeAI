"""Test script to check prediction endpoint."""
import sys
import traceback

# Test 1: Direct function call
sys.path.insert(0, r'C:\Users\Suhani\Desktop\GenomeAI')

try:
    from backend.utils.tokenizer import prepare_model_input, EXPECTED_LENGTH
    print(f"Expected length: {EXPECTED_LENGTH}")
    
    # Generate a valid 201-base sequence
    seq = "ATGCGATCGTAGCTAGCTAGCATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATC"
    print(f"Sequence length: {len(seq)}")
    
    tokens = prepare_model_input(seq)
    print(f"Tokens shape: {tokens.shape}")
    
    from backend.predictor.cnn_predictor import predict
    result = predict(tokens)
    print(f"Prediction result: {result}")
    
except Exception as e:
    traceback.print_exc()
    print(f"\n\nERROR: {e}")
