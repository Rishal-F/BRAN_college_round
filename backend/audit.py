
def compare_results(reported, measured, tolerance=0.02):
    """
    Compare the accuracy reported in a research paper
    with the accuracy measured in an experiment.
    """

    if reported is None or measured is None:
        return {
            "status": "insufficient_evidence",
            "difference_percentage_points": None,
            "message": "Reported or measured accuracy is missing."
        }

    if not (0 <= reported <= 1 and 0 <= measured <= 1):
        raise ValueError("Accuracy values must be between 0 and 1.")

    difference = abs(reported - measured)

    return {
        "status": (
            "metric_within_tolerance"
            if difference <= tolerance
            else "metric_discrepancy"
        ),
        "reported_accuracy": reported,
        "measured_accuracy": measured,
        "difference_percentage_points": round(difference * 100, 2),
        "within_tolerance": difference <= tolerance,
        "message": (
            "Metric comparison completed. Matching accuracy "
            "alone does not prove full reproducibility."
        )
    }
