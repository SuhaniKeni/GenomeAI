import torch
from torch.utils.data import Dataset


class DNADataset(Dataset):

    def __init__(self, sequences, labels, tokenizer, max_length=256):

        self.labels = labels

        self.encodings = tokenizer(
            list(map(str, sequences)),
            truncation=True,
            padding="max_length",
            max_length=max_length,
        )

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):

        item = {
            key: torch.tensor(value[idx], dtype=torch.long)
            for key, value in self.encodings.items()
        }

        item["labels"] = torch.tensor(
            self.labels[idx],
            dtype=torch.long
        )

        return item