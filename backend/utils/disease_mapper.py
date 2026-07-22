LABELS = {
    0: "Breast Cancer",
    1: "Lung Cancer",
    2: "Alzheimer's Disease",
    3: "Parkinson's Disease",
    4: "Leukemia",
    5: "Type 2 Diabetes",
    6: "Ovarian Cancer",
    7: "Colorectal Cancer",
}


def get_disease(label: int):
    return LABELS.get(label, "Unknown Disease")