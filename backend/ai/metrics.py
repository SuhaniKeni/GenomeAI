import matplotlib.pyplot as plt
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
REPORTS_DIR = BASE_DIR / "reports"

REPORTS_DIR.mkdir(exist_ok=True)


def save_training_plots(history, model_name):

    # Accuracy Graph
    plt.figure(figsize=(8,5))
    plt.plot(history.history["accuracy"], label="Training Accuracy")
    plt.plot(history.history["val_accuracy"], label="Validation Accuracy")
    plt.title(f"{model_name} Accuracy")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.legend()
    plt.grid(True)

    plt.savefig(REPORTS_DIR / f"{model_name.lower()}_accuracy.png")
    plt.close()


    # Loss Graph
    plt.figure(figsize=(8,5))
    plt.plot(history.history["loss"], label="Training Loss")
    plt.plot(history.history["val_loss"], label="Validation Loss")
    plt.title(f"{model_name} Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.legend()
    plt.grid(True)

    plt.savefig(REPORTS_DIR / f"{model_name.lower()}_loss.png")
    plt.close()


    print(f"\nGraphs saved in {REPORTS_DIR}")