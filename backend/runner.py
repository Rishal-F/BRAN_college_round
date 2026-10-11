
"""CrisisGrid experiment runner with MLflow tracking."""

import hashlib
from pathlib import Path

import mlflow
import numpy as np
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

ROOT = Path(__file__).resolve().parents[1]
TRACKING_DB = ROOT / "mlflow.db"


def execute_experiment(config: dict) -> dict:
    """Run a real experiment and return its measured accuracy and MLflow ID."""

    if not isinstance(config, dict):
        raise ValueError("config must be a dictionary")

    dataset = config.get("dataset", "iris")
    model_name = config.get("model", "random_forest")
    test_size = config.get("test_size", 0.2)
    random_seed = config.get("random_seed", 42)
    hp = config.get("hyperparameters", {})

    if dataset != "iris":
        raise ValueError("Supported dataset: iris")

    if model_name not in {"random_forest", "svm"}:
        raise ValueError("Supported models: random_forest, svm")

    if not isinstance(hp, dict):
        raise ValueError("hyperparameters must be a dictionary")

    if isinstance(test_size, bool) or not isinstance(test_size, (int, float)):
        raise ValueError("test_size must be a number between 0 and 1")

    if not 0 < test_size < 1:
        raise ValueError("test_size must be between 0 and 1")

    if isinstance(random_seed, bool) or not isinstance(random_seed, int):
        raise ValueError("random_seed must be an integer")

    if model_name == "random_forest":
        unknown = set(hp) - {"n_estimators", "max_depth"}
        if unknown:
            raise ValueError(f"Unsupported hyperparameters: {sorted(unknown)}")

        n_estimators = hp.get("n_estimators", 100)
        max_depth = hp.get("max_depth", 5)

        if (isinstance(n_estimators, bool)
                or not isinstance(n_estimators, int)
                or n_estimators < 1):
            raise ValueError("n_estimators must be a positive integer")

        if max_depth is not None and (
                isinstance(max_depth, bool)
                or not isinstance(max_depth, int)
                or max_depth < 1):
            raise ValueError("max_depth must be a positive integer or null")

        model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=random_seed,
        )
        model_parameters = {
            "n_estimators": n_estimators,
            "max_depth": max_depth,
        }

    else:
        unknown = set(hp) - {"C", "kernel"}
        if unknown:
            raise ValueError(f"Unsupported hyperparameters: {sorted(unknown)}")

        C = hp.get("C", 1.0)
        kernel = hp.get("kernel", "rbf")

        if isinstance(C, bool) or not isinstance(C, (int, float)) or C <= 0:
            raise ValueError("C must be a positive number")

        if kernel not in {"linear", "poly", "rbf", "sigmoid"}:
            raise ValueError("Unsupported SVM kernel")

        model = make_pipeline(
            StandardScaler(),
            SVC(C=float(C), kernel=kernel),
        )
        model_parameters = {"C": float(C), "kernel": kernel}

    iris = load_iris()
    X, y = iris.data, iris.target

    dataset_hash = hashlib.sha256(
        np.asarray(X).tobytes() + np.asarray(y).tobytes()
    ).hexdigest()

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=float(test_size),
        random_state=random_seed,
        stratify=y,
    )

    mlflow.set_tracking_uri(f"sqlite:///{TRACKING_DB.as_posix()}")
    mlflow.set_experiment("CrisisGrid-Experiments")

    with mlflow.start_run() as run:
        mlflow.log_params({
            "dataset": dataset,
            "model": model_name,
            "test_size": float(test_size),
            "random_seed": random_seed,
            **{
                f"hp_{key}": value
                for key, value in model_parameters.items()
                if value is not None
            },
        })

        model.fit(X_train, y_train)
        predictions = model.predict(X_test)
        accuracy = float(accuracy_score(y_test, predictions))

        mlflow.log_metric("accuracy", accuracy)
        mlflow.set_tags({
            "dataset_source": "scikit-learn built-in Iris dataset",
            "dataset_sha256": dataset_hash,
            "experiment_type": "integration test, not paper reproduction",
        })

        return {
            "status": "success",
            "dataset": dataset,
            "dataset_source": "scikit-learn built-in Iris dataset",
            "dataset_sha256": dataset_hash,
            "model": model_name,
            "metric_name": "accuracy",
            "measured_accuracy": accuracy,
            "test_samples": int(len(y_test)),
            "parameters": {
                **model_parameters,
                "test_size": float(test_size),
                "random_seed": random_seed,
            },
            "mlflow_run_id": run.info.run_id,
            "note": (
                "Technical integration test only; not a reproduction "
                "of the selected research paper."
            ),
        }
