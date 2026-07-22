from sklearn.utils.class_weight import compute_class_weight
import numpy as np


def get_class_weights(y_train):
    """Return balanced class weights keyed by integer label."""

    classes = np.unique(y_train)
    labels, counts = np.unique(y_train, return_counts=True)

    weights = compute_class_weight(
        class_weight="balanced",
        classes=classes,
        y=y_train
    )

    class_weights = {
        int(c): float(w)
        for c, w in zip(classes, weights)
    }

    print("\nClass Distribution")
    print("=" * 40)

    for label, count in zip(labels, counts):
        print(f"Class {int(label)}: {int(count)} samples")

    print("\nClass Weights")
    print("=" * 40)

    for cls, weight in class_weights.items():
        print(f"Class {cls}: {weight:.4f}")

    return class_weights
