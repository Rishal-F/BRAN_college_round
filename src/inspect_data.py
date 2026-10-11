
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "reproducable_blind.csv"


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found at {DATA_PATH}. "
            "Download the original CSV into the data folder."
        )

    df = pd.read_csv(DATA_PATH)

    print("\n=== DATASET OVERVIEW ===")
    print(f"File: {DATA_PATH.name}")
    print(f"Rows: {len(df)}")
    print(f"Columns: {len(df.columns)}")

    print("\n=== COLUMN NAMES AND TYPES ===")
    print(df.dtypes.to_string())

    print("\n=== MISSING VALUES ===")
    print(df.isna().sum().to_string())

    print("\n=== SAMPLE ROWS ===")
    print(df.head(5).to_string())

    print("\n=== UNIQUE VALUES PER COLUMN ===")
    for column in df.columns:
        print(f"{column}: {df[column].nunique(dropna=True)}")


if __name__ == "__main__":
    main()
