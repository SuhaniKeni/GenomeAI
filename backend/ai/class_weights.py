import numpy as np


def get_class_weights(y_train, beta: float = 0.999, max_weight: float = 10.0):
    """Return Effective Number of Samples (ENS) smoothed class weights.

    Formula:
      effective_num = (1.0 - beta^n) / (1.0 - beta)
      weight = 1.0 / effective_num
      normalized by mean weight and clipped to max_weight
    """
    classes = np.unique(y_train)
    labels, counts = np.unique(y_train, return_counts=True)
    count_dict = dict(zip(labels, counts))

    weights = {}
    for cls in classes:
        n = count_dict[cls]
        effective_num = (1.0 - np.power(beta, n)) / (1.0 - beta)
        weights[int(cls)] = 1.0 / effective_num

    # Normalize weights so mean = 1.0
    mean_w = np.mean(list(weights.values()))
    class_weights = {cls: float(np.clip(w / mean_w, 0.2, max_weight)) for cls, w in weights.items()}

    print("\nClass Distribution & Effective Number of Samples (ENS) Weights")
    print("=" * 60)
    for cls in sorted(class_weights.keys()):
        cnt = count_dict.get(cls, 0)
        wt = class_weights[cls]
        print(f"Class {cls:2d}: {cnt:5d} samples -> Weight: {wt:.4f}")
    print("=" * 60)

    return class_weights
