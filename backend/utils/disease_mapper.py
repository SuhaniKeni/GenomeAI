LABELS = {
    0: "Healthy",
    1: "Hereditary Breast & Ovarian Cancer",
    2: "Breast Cancer",
    3: "Lung Cancer",
    4: "Alzheimer's Disease",
    5: "Parkinson's Disease",
    6: "Leukemia",
    7: "Type 2 Diabetes",
    8: "Ovarian Cancer",
    9: "Colorectal Cancer",
}


def get_disease(label: int):
    return LABELS.get(label, "Healthy")
