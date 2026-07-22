import torch
from tqdm import tqdm


def train_one_epoch(
    model,
    dataloader,
    optimizer,
    scheduler,
    device,
):

    model.train()

    running_loss = 0
    correct = 0
    total = 0

    for batch in tqdm(
    dataloader,
    desc="Training",
    leave=True,
    dynamic_ncols=True,
    ):

        input_ids = batch["input_ids"].to(device)
        attention_mask = batch["attention_mask"].to(device)
        labels = batch["labels"].to(device)

        optimizer.zero_grad()

        outputs = model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            labels=labels,
        )

        loss = outputs.loss
        logits = outputs.logits

        loss.backward()

        optimizer.step()
        scheduler.step()

        running_loss += loss.item()

        predictions = torch.argmax(logits, dim=1)

        correct += (predictions == labels).sum().item()

        total += labels.size(0)

    epoch_loss = running_loss / len(dataloader)
    epoch_accuracy = correct / total

    return epoch_loss, epoch_accuracy

def validate_one_epoch(
    model,
    dataloader,
    device,
):

    model.eval()

    running_loss = 0
    correct = 0
    total = 0

    with torch.no_grad():

        for batch in tqdm(
        dataloader,
        desc="Validation",
        leave=False,
        dynamic_ncols=True,
        ):

            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels,
            )

            loss = outputs.loss
            logits = outputs.logits

            running_loss += loss.item()

            predictions = torch.argmax(logits, dim=1)

            correct += (predictions == labels).sum().item()

            total += labels.size(0)

    epoch_loss = running_loss / len(dataloader)
    epoch_accuracy = correct / total

    return epoch_loss, epoch_accuracy