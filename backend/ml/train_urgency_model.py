"""Train the urgency/health models from the supplied dataset.

The shared preparation script builds the canonical asset-level feature table
from dataset/canonical_reference and trains both saved artifacts.
"""
from backend.scripts.use_provided_dataset import main  # noqa: F401

if __name__ == '__main__':
    # Importing the script performs the deterministic preparation/training.
    pass
