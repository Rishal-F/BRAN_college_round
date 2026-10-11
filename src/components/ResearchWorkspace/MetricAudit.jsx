import React, { useState } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  RotateCcw
} from 'lucide-react';
import { auditResults } from '../../services/api';
import MetricGauge from '../ui/MetricGauge';

export default function MetricAudit({
  auditResult,
  setAuditResult,
  onProceedToReport,
  addToast,
}) {
  const [reportedAccuracy, setReportedAccuracy] = useState('0.95');
  const [measuredAccuracy, setMeasuredAccuracy] = useState('0.89');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState(null);

  const presets = [
    {
      label: 'Sample Discrepancy (Δ 6.0%)',
      reported: '0.95',
      measured: '0.89',
      desc: 'Divergence exceeding ±2.0% tolerance',
    },
    {
      label: 'Within Tolerance (Δ 0.3%)',
      reported: '0.884',
      measured: '0.881',
      desc: 'High numerical parity within ±2.0% tolerance',
    },
    {
      label: 'ImageNet ResNet (Δ 4.6%)',
      reported: '0.768',
      measured: '0.722',
      desc: 'Unstated warmup slope divergence',
    },
    {
      label: 'Vision Transformer (Δ 1.2%)',
      reported: '0.842',
      measured: '0.830',
      desc: 'Acceptable replication under seed variance',
    },
  ];

  const handleApplyPreset = (preset) => {
    setReportedAccuracy(preset.reported);
    setMeasuredAccuracy(preset.measured);
    setAuditError(null);
    addToast({
      type: 'info',
      title: 'Preset Applied',
      message: `Set Reported: ${preset.reported}, Measured: ${preset.measured}`,
    });
  };

  const handleReset = () => {
    setReportedAccuracy('0.95');
    setMeasuredAccuracy('0.89');
    setAuditResult(null);
    setAuditError(null);
  };

  const handleRunAudit = async (e) => {
    if (e) e.preventDefault();
    setAuditError(null);

    const rNum = parseFloat(reportedAccuracy);
    const mNum = parseFloat(measuredAccuracy);

    if (isNaN(rNum) || isNaN(mNum)) {
      const err = 'Both reported and measured accuracy must be valid decimal numbers.';
      setAuditError(err);
      addToast({ type: 'error', title: 'Invalid Inputs', message: err });
      return;
    }

    if (rNum < 0 || rNum > 1 || mNum < 0 || mNum > 1) {
      const err = 'Accuracy values must be between 0.00 and 1.00 (e.g., 0.95 represents 95%).';
      setAuditError(err);
      addToast({ type: 'error', title: 'Out of Range', message: err });
      return;
    }

    setIsAuditing(true);

    try {
      const result = await auditResults(rNum, mNum);
      setAuditResult(result);

      if (result.within_tolerance) {
        addToast({
          type: 'success',
          title: 'Audit Complete: Within Tolerance',
          message: `Δ ${result.difference_percentage_points} pp gap. Metrics align within ±2% tolerance.`,
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Audit Complete: Discrepancy Detected',
          message: `Δ ${result.difference_percentage_points} pp divergence detected by FastAPI engine.`,
        });
      }
    } catch (err) {
      const errorMsg = err.message || 'Audit request failed. Please check backend connection.';
      setAuditError(errorMsg);
      addToast({
        type: 'error',
        title: 'Audit Engine Error',
        message: errorMsg,
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const currentReported = parseFloat(reportedAccuracy) || 0;
  const currentMeasured = parseFloat(measuredAccuracy) || 0;

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-line">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-status-tealSoft text-status-teal border border-status-teal/30 uppercase">
              Operational Feature
            </span>
            <span className="text-xs font-mono text-ink-muted">FastAPI Endpoint: POST /audit</span>
          </div>
          <h3 className="text-2xl font-display font-semibold text-ink-primary mt-1 flex items-center gap-2">
            <Scale className="w-6 h-6 text-steel" />
            <span>Interactive Metric Audit Center</span>
          </h3>
          <p className="text-xs text-ink-secondary mt-1">
            Compare published paper accuracy against observed experimental measurements using automated tolerance checks.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3.5 py-1.5 rounded-full text-xs font-mono text-ink-muted hover:text-ink-primary border border-border-line hover:bg-canvas flex items-center gap-1.5 transition-colors"
          title="Reset values"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Preset scientific benchmarks */}
      <div>
        <div className="text-xs font-mono text-ink-muted uppercase mb-2.5 flex items-center gap-1.5 font-semibold">
          <Zap className="w-3.5 h-3.5 text-steel" />
          <span>Quick Benchmark Presets</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(preset)}
              className="p-3.5 rounded-2xl bg-white border border-border-line hover:border-steel/50 hover:bg-canvas-light text-left transition-all group focus:outline-none focus:ring-1 focus:ring-steel shadow-xs"
            >
              <div className="text-xs font-semibold text-ink-primary group-hover:text-deepBlue transition-colors">
                {preset.label}
              </div>
              <div className="text-[11px] font-mono text-ink-muted mt-1 flex justify-between">
                <span>Rep: {preset.reported}</span>
                <span>Meas: {preset.measured}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Dual Metric Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Reported Accuracy Input Card */}
        <div className="bg-white rounded-3xl p-6 border border-border-line shadow-card-subtle">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-steel" />
              <label htmlFor="reported-input" className="text-sm font-semibold text-ink-primary">
                Reported Accuracy (Paper Claim)
              </label>
            </div>
            <span className="text-xs font-mono text-steel font-bold">
              {(currentReported * 100).toFixed(1)}%
            </span>
          </div>

          <p className="text-xs text-ink-secondary mb-4 leading-relaxed">
            The top-line validation or test metric reported by authors in the published paper.
          </p>

          <div className="space-y-4">
            <div className="relative">
              <input
                id="reported-input"
                type="number"
                step="0.001"
                min="0"
                max="1"
                value={reportedAccuracy}
                onChange={(e) => {
                  setReportedAccuracy(e.target.value);
                  setAuditError(null);
                }}
                className="w-full px-4 py-3 rounded-2xl bg-canvas border border-border-line text-ink-primary font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-steel focus:border-transparent transition-all"
                placeholder="e.g. 0.95"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-ink-muted">
                [0.0 - 1.0]
              </span>
            </div>

            {/* Slider */}
            <div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.005"
                value={isNaN(currentReported) ? 0 : currentReported}
                onChange={(e) => {
                  setReportedAccuracy(e.target.value);
                  setAuditError(null);
                }}
                className="w-full h-1.5 bg-canvas-dark rounded-lg appearance-none cursor-pointer accent-steel"
              />
              <div className="flex justify-between text-[10px] font-mono text-ink-muted mt-1">
                <span>0.00 (0%)</span>
                <span>0.50 (50%)</span>
                <span>1.00 (100%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Measured Accuracy Input Card */}
        <div className="bg-white rounded-3xl p-6 border border-border-line shadow-card-subtle">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-deepBlue" />
              <label htmlFor="measured-input" className="text-sm font-semibold text-ink-primary">
                Measured Accuracy (Experiment Run)
              </label>
            </div>
            <span className="text-xs font-mono text-deepBlue font-bold">
              {(currentMeasured * 100).toFixed(1)}%
            </span>
          </div>

          <p className="text-xs text-ink-secondary mb-4 leading-relaxed">
            The actual observed metric obtained during replication or validation benchmark.
          </p>

          <div className="space-y-4">
            <div className="relative">
              <input
                id="measured-input"
                type="number"
                step="0.001"
                min="0"
                max="1"
                value={measuredAccuracy}
                onChange={(e) => {
                  setMeasuredAccuracy(e.target.value);
                  setAuditError(null);
                }}
                className="w-full px-4 py-3 rounded-2xl bg-canvas border border-border-line text-ink-primary font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-steel focus:border-transparent transition-all"
                placeholder="e.g. 0.89"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-ink-muted">
                [0.0 - 1.0]
              </span>
            </div>

            {/* Slider */}
            <div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.005"
                value={isNaN(currentMeasured) ? 0 : currentMeasured}
                onChange={(e) => {
                  setMeasuredAccuracy(e.target.value);
                  setAuditError(null);
                }}
                className="w-full h-1.5 bg-canvas-dark rounded-lg appearance-none cursor-pointer accent-deepBlue"
              />
              <div className="flex justify-between text-[10px] font-mono text-ink-muted mt-1">
                <span>0.00 (0%)</span>
                <span>0.50 (50%)</span>
                <span>1.00 (100%)</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Audit Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-border-line shadow-card-subtle">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-surface-paleBlue text-deepBlue border border-border-line">
            <ShieldCheck className="w-5 h-5 text-steel" />
          </div>
          <div>
            <div className="text-xs font-mono text-ink-muted uppercase font-semibold">FastAPI Tolerance Rule</div>
            <div className="text-xs text-ink-primary font-medium">
              Threshold: |Reported - Measured| ≤ 0.02 (2.0 percentage points)
            </div>
          </div>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={isAuditing}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold text-sm text-white shadow-cta-glow transition-all flex items-center justify-center gap-2.5 ${
            isAuditing
              ? 'bg-deepBlue/60 cursor-not-allowed'
              : 'bg-deepBlue hover:bg-ink-primary active:scale-95'
          }`}
        >
          {isAuditing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verifying with POST /audit...</span>
            </>
          ) : (
            <>
              <Scale className="w-4 h-4" />
              <span>Compare Metrics (POST /audit)</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {auditError && (
        <div className="p-4 rounded-2xl bg-status-redSoft border border-status-red/30 flex items-start gap-3 text-xs text-ink-primary">
          <AlertTriangle className="w-5 h-5 text-status-red shrink-0" />
          <div>
            <div className="font-semibold text-status-red">Audit Validation Issue</div>
            <div className="text-ink-secondary mt-0.5">{auditError}</div>
          </div>
        </div>
      )}

      {/* Dynamic Visual Gauge Comparison */}
      <MetricGauge
        reported={currentReported}
        measured={currentMeasured}
        difference={auditResult?.difference_percentage_points}
        withinTolerance={auditResult?.within_tolerance}
        isAuthoritative={!!auditResult}
        toleranceThreshold={0.02}
      />

      {/* Authoritative Response Details Card */}
      {auditResult && (
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-card-subtle relative overflow-hidden ${
            auditResult.within_tolerance
              ? 'bg-white border-status-teal/40'
              : 'bg-white border-status-red/40'
          }`}
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-border-line">
            <div className="flex items-center gap-3">
              {auditResult.within_tolerance ? (
                <div className="p-3 rounded-2xl bg-status-tealSoft border border-status-teal/30 text-status-teal">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-status-redSoft border border-status-red/30 text-status-red">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      auditResult.within_tolerance
                        ? 'bg-status-tealSoft text-status-teal border border-status-teal/30'
                        : 'bg-status-redSoft text-status-red border border-status-red/30'
                    }`}
                  >
                    Status: {auditResult.status}
                  </span>
                  <span className="text-xs font-mono text-ink-muted">
                    FastAPI Engine Response
                  </span>
                </div>
                <h4 className="text-xl font-semibold text-ink-primary mt-1">
                  {auditResult.within_tolerance
                    ? 'Replication Matches Within Statistical Tolerance'
                    : 'Statistical Discrepancy Detected in Metric Audit'}
                </h4>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-mono text-ink-muted">DELTA DISCREPANCY</div>
              <div
                className={`text-3xl font-mono font-bold ${
                  auditResult.within_tolerance ? 'text-status-teal' : 'text-status-red'
                }`}
              >
                {auditResult.difference_percentage_points}
                <span className="text-sm font-normal text-ink-muted ml-1">pp</span>
              </div>
            </div>
          </div>

          {/* Authoritative Message */}
          <div className="p-4 rounded-2xl bg-canvas border border-border-line mb-6">
            <div className="text-[11px] font-mono text-steel uppercase font-semibold mb-1">
              FastAPI Audit Backend Explanation:
            </div>
            <p className="text-sm text-ink-primary font-mono leading-relaxed">
              "{auditResult.message}"
            </p>
          </div>

          {/* Critical Scientific Disclaimer */}
          <div className="p-4 rounded-2xl bg-surface-paleBlue border border-border-line flex items-start gap-3 text-xs text-ink-secondary mb-6">
            <Info className="w-4 h-4 text-steel shrink-0 mt-0.5" />
            <div>
              <strong className="text-deepBlue font-mono">Scientific Reproducibility Guardrail:</strong>{' '}
              An accuracy match within tolerance demonstrates numerical parity for the tested split, but does not guarantee complete reproducibility across unseen data distributions, alternative seeds, or varying hardware setups.
            </div>
          </div>

          {/* Action to view complete report */}
          <div className="flex justify-end">
            <button
              onClick={onProceedToReport}
              className="px-6 py-2.5 rounded-full text-xs font-semibold bg-white text-ink-primary hover:bg-canvas border border-border-line shadow-xs transition-all flex items-center gap-2"
            >
              <span>View Full Findings Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
