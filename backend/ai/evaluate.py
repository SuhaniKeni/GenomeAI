from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)


def evaluate_model(model, X_test, y_test):

    predictions = model.predict(X_test, verbose=0)
    predicted = predictions.argmax(axis=1)
    actual = y_test.argmax(axis=1)

    print("\n" + "=" * 60)
    print("MODEL EVALUATION")
    print("=" * 60)

    print(f"Accuracy : {accuracy_score(actual, predicted):.4f}")
    print(f"Precision: {precision_score(actual, predicted, average='weighted', zero_division=0):.4f}")
    print(f"Recall   : {recall_score(actual, predicted, average='weighted', zero_division=0):.4f}")
    print(f"F1 Score : {f1_score(actual, predicted, average='weighted', zero_division=0):.4f}")

    print("\nClassification Report")
    print(classification_report(actual, predicted, zero_division=0))

    print("\nConfusion Matrix")
    print(confusion_matrix(actual, predicted))