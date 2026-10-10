
from pathlib import Path
import hashlib
import json
import platform
import re
import sys

import mlflow
import numpy as np
import pandas as pd
import scipy
from scipy.stats import chi2_contingency, mannwhitneyu

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "reproducable_blind.csv"
RESULTS_DIR = ROOT / "results"
OUTCOME = "Reproduced"


def benjamini_hochberg(p_values):
    """Return Benjamini-Hochberg adjusted p-values."""
    p = np.asarray(p_values, dtype=float)
    n = len(p)

    if n == 0:
        return []

    order = np.argsort(p)
    sorted_p = p[order]
    adjusted = sorted_p * n / np.arange(1, n + 1)
    adjusted = np.minimum.accumulate(adjusted[::-1])[::-1]
    adjusted = np.clip(adjusted, 0, 1)

    result = np.empty(n)
    result[order] = adjusted
    return result.tolist()


def load_dataset():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)

    if OUTCOME not in df.columns:
        raise ValueError(f"Required outcome column '{OUTCOME}' is missing.")

    if df[OUTCOME].isna().any():
        raise ValueError("The outcome column contains missing values.")

    df[OUTCOME] = df[OUTCOME].astype(str).str.strip()

    if set(df[OUTCOME].unique()) != {"Yes", "No"}:
        raise ValueError(
            "Expected Reproduced to contain exactly 'Yes' and 'No'. "
            f"Found: {sorted(df[OUTCOME].unique())}"
        )

    return df


def analyze_numeric(df, feature):
    yes = pd.to_numeric(
        df.loc[df[OUTCOME] == "Yes", feature], errors="coerce"
    ).dropna()
    no = pd.to_numeric(
        df.loc[df[OUTCOME] == "No", feature], errors="coerce"
    ).dropna()

    if len(yes) == 0 or len(no) == 0:
        return None

    statistic, p_value = mannwhitneyu(
        yes, no, alternative="two-sided"
    )

    return {
        "feature": feature,
        "feature_type": "numeric",
        "test": "Mann-Whitney U",
        "n_yes": int(len(yes)),
        "n_no": int(len(no)),
        "statistic": float(statistic),
        "p_value": float(p_value),
        "effect_description": (
            f"Median Yes={yes.median():.4g}; "
            f"Median No={no.median():.4g}"
        ),
    }


def analyze_categorical(df, feature):
    subset = df[[OUTCOME, feature]].dropna()

    if subset[feature].nunique() < 2:
        return None

    table = pd.crosstab(subset[feature], subset[OUTCOME])

    # Ensure both outcome columns are represented.
    table = table.reindex(columns=["No", "Yes"], fill_value=0)

    if table.shape[0] < 2 or table.shape[1] < 2:
        return None

    statistic, p_value, dof, expected = chi2_contingency(
        table, correction=True
    )

    return {
        "feature": feature,
        "feature_type": "categorical",
        "test": "Chi-squared",
        "n_yes": int((subset[OUTCOME] == "Yes").sum()),
        "n_no": int((subset[OUTCOME] == "No").sum()),
        "statistic": float(statistic),
        "p_value": float(p_value),
        "degrees_of_freedom": int(dof),
        "minimum_expected_count": float(expected.min()),
        "effect_description": (
            "Association test; inspect category counts and expected "
            "frequencies before interpreting."
        ),
    }


def main():
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    df = load_dataset()
    dataset_hash = hashlib.sha256(DATA_PATH.read_bytes()).hexdigest()

    numeric_features = [
        col for col in df.select_dtypes(include=np.number).columns
        if col != OUTCOME
    ]
    categorical_features = [
        col for col in df.select_dtypes(exclude=np.number).columns
        if col != OUTCOME
    ]

    results = []

    for feature in numeric_features:
        result = analyze_numeric(df, feature)
        if result:
            results.append(result)

    for feature in categorical_features:
        result = analyze_categorical(df, feature)
        if result:
            results.append(result)

    if not results:
        raise RuntimeError("No statistical tests could be completed.")

    results_df = pd.DataFrame(results)
    results_df["p_adjusted"] = benjamini_hochberg(
        results_df["p_value"].tolist()
    )
    results_df["significant_raw_0_05"] = (
        results_df["p_value"] < 0.05
    )
    results_df["significant_adjusted_0_05"] = (
        results_df["p_adjusted"] < 0.05
    )

    results_csv = RESULTS_DIR / "feature_tests.csv"
    results_df.to_csv(results_csv, index=False)

    outcome_counts = {
        str(key): int(value)
        for key, value in df[OUTCOME].value_counts().items()
    }

    summary = {
        "project": "CrisisGrid",
        "paper_id": "raff_neurips_2019",
        "analysis_type": "released_data_reanalysis",
        "status": "completed",
        "dataset": {
            "filename": DATA_PATH.name,
            "sha256": dataset_hash,
            "rows": int(len(df)),
            "columns": int(len(df.columns)),
            "missing_cells": int(df.isna().sum().sum()),
            "outcome_counts": outcome_counts,
        },
        "analysis": {
            "numeric_features_tested": int(
                (results_df["feature_type"] == "numeric").sum()
            ),
            "categorical_features_tested": int(
                (results_df["feature_type"] == "categorical").sum()
            ),
            "tests_completed": int(len(results_df)),
            "significant_raw_0_05": int(
                results_df["significant_raw_0_05"].sum()
            ),
            "significant_adjusted_0_05": int(
                results_df["significant_adjusted_0_05"].sum()
            ),
            "multiple_testing_correction": "Benjamini-Hochberg",
        },
        "environment": {
            "python": platform.python_version(),
            "pandas": pd.__version__,
            "numpy": np.__version__,
            "scipy": scipy.__version__,
        },
        "artifacts": ["summary.json", "feature_tests.csv"],
        "interpretation_note": (
            "Exploratory reanalysis of released study data; "
            "associations do not establish causation and this is "
            "not a recreation of all original manual attempts."
        ),
    }

    summary_path = RESULTS_DIR / "summary.json"
    summary_path.write_text(
        json.dumps(summary, indent=2), encoding="utf-8"
    )

    mlflow.set_tracking_uri(
        f"sqlite:///{(ROOT / 'mlflow.db').as_posix()}"
    )
    mlflow.set_experiment("CrisisGrid-NeurIPS-Reanalysis")

    with mlflow.start_run(run_name="statistical-reanalysis") as run:
        mlflow.set_tags({
            "project": "CrisisGrid",
            "paper_id": "raff_neurips_2019",
            "analysis_type": "released_data_reanalysis",
            "status": "completed",
            "dataset_sha256": dataset_hash,
        })

        mlflow.log_params({
            "dataset": DATA_PATH.name,
            "dataset_rows": len(df),
            "dataset_columns": len(df.columns),
            "outcome_column": OUTCOME,
            "numeric_features": len(numeric_features),
            "categorical_features": len(categorical_features),
            "multiple_testing_correction": "Benjamini-Hochberg",
        })

        mlflow.log_metrics({
            "tests_completed": len(results_df),
            "significant_raw_0_05": int(
                results_df["significant_raw_0_05"].sum()
            ),
            "significant_adjusted_0_05": int(
                results_df["significant_adjusted_0_05"].sum()
            ),
            "rows": len(df),
            "columns": len(df.columns),
        })

        # Log individual test metrics using safe feature names.
        for _, row in results_df.iterrows():
            safe_name = re.sub(
                r"[^A-Za-z0-9_.-]+", "_", str(row["feature"])
            )[:80]
            mlflow.log_metric(
                f"pvalue_{safe_name}", float(row["p_value"])
            )
            mlflow.log_metric(
                f"adjusted_pvalue_{safe_name}",
                float(row["p_adjusted"]),
            )

        mlflow.log_artifact(str(results_csv), artifact_path="results")
        mlflow.log_artifact(str(summary_path), artifact_path="results")

        run_id = run.info.run_id

    # Save the actual run ID in the handoff summary.
    summary["run"] = {
        "tracking_system": "mlflow",
        "run_id": run_id,
    }
    summary_path.write_text(
        json.dumps(summary, indent=2), encoding="utf-8"
    )

    print("\n=== CRISISGRID ANALYSIS COMPLETE ===")
    print(f"Dataset rows: {len(df)}")
    print(f"Tests completed: {len(results_df)}")
    print(
        "Significant after correction:",
        int(results_df["significant_adjusted_0_05"].sum()),
    )
    print(f"Results CSV: {results_csv}")
    print(f"Summary JSON: {summary_path}")
    print(f"MLflow run ID: {run_id}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ANALYSIS FAILED: {exc}", file=sys.stderr)
        raise
