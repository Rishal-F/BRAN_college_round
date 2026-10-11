
import pytest
from audit import compare_results


def test_matching_results():
    result = compare_results(0.95, 0.94)
    assert result["status"] == "metric_within_tolerance"
    assert result["difference_percentage_points"] == 1.0


def test_different_results():
    result = compare_results(0.95, 0.89)
    assert result["status"] == "metric_discrepancy"
    assert result["difference_percentage_points"] == 6.0


def test_missing_results():
    result = compare_results(None, 0.89)
    assert result["status"] == "insufficient_evidence"


def test_invalid_accuracy():
    with pytest.raises(ValueError):
        compare_results(95, 0.89)
