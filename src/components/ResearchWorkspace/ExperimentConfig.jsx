import React, { useState } from 'react';
import {
  Sliders,
  Database,
  Binary,
  Cpu,
  CheckCircle2,
  Activity,
  Play,
  ArrowRight,
  Lock
} from 'lucide-react';
import { runExperiment } from '../../services/api';

export default function ExperimentConfig({
  experimentResult,
  setExperimentResult,
  onProceedToAudit,
  addToast,
}) {
  const [selectedNode, setSelectedNode] = useState('model');
  const [isAttemptingRun, setIsAttemptingRun] = useState(false);
  const [runStatusMessage, setRunStatusMessage] = useState(null);

  const pipelineNodes = [
    {
      id: 'dataset',
      name: 'Dataset & Ingestion',
      icon: Database,
      tag: 'Shard Verification',
      summary: 'Standardized ImageNet-1K / Synthetic Validation Shards',
      params: [
        { key: 'Dataset Source', value: 'ILSVRC2012 / HuggingFace Hub Mirror' },
        { key: 'Validation Subset', value: '50,000 images (deterministic split)' },
        { key: 'Checksum Integrity', value: 'SHA256: 8f2b3e...91c' },
        { key: 'Batch Shuffling', value: 'Disabled on Eval (Seed: 42)' },
      ],
    },
    {
      id: 'preprocessing',
      name: 'Preprocessing Pipeline',
      icon: Binary,
      tag: 'Standard Transforms',
      summary: 'Deterministic Tensor Normalization & Resizing',
      params: [
        { key: 'Resize Dimensions', value: '256x256 -> CenterCrop 224x224' },
        { key: 'Mean Normalization', value: '[0.485, 0.456, 0.406]' },
        { key: 'Std Normalization', value: '[0.229, 0.224, 0.225]' },
        { key: 'Interpolation Mode', value: 'Bilinear (TorchVision default)' },
      ],
    },
    {
      id: 'model',
      name: 'Model Topology',
      icon: Cpu,
      tag: '25.56M Parameters',
      summary: 'ResNet-50 Standard Bottleneck Architecture',
      params: [
        { key: 'Model Definition', value: 'torchvision.models.resnet50(pretrained=False)' },
        { key: 'Weight Initialization', value: 'Kaiming Normal (Fan_out mode)' },
        { key: 'Weight Decay L2', value: '1e-4' },
        { key: 'Precision Runtime', value: 'FP16 Automatic Mixed Precision (AMP)' },
      ],
    },
    {
      id: 'eval',
      name: 'Evaluation Protocol',
      icon: CheckCircle2,
      tag: 'Single-Crop Top-1',
      summary: 'Synchronous Loss & Accuracy Accumulation Loop',
      params: [
        { key: 'Metric Tracked', value: 'Top-1 Accuracy & Cross-Entropy Loss' },
        { key: 'Batch Size', value: '256 (64 per GPU x 4)' },
        { key: 'Tolerance Threshold', value: '0.02 (2.0 percentage points)' },
        { key: 'Worker Processes', value: '4 workers with pin_memory=True' },
      ],
    },
    {
      id: 'mlflow',
      name: 'MLflow Telemetry',
      icon: Activity,
      tag: 'Artifact Storage',
      summary: 'Centralized Experiment Logging & Run Artifacts',
      params: [
        { key: 'Experiment Name', value: 'crisisgrid_resnet50_repro' },
        { key: 'Tracking URI', value: 'http://127.0.0.1:5000 (MLflow Server)' },
        { key: 'Logged Artifacts', value: 'Loss curves, confusion matrix, checkpoint' },
        { key: 'Integration Status', value: 'Member 2 Runner Hook Pending' },
      ],
    },
  ];

  const currentNode = pipelineNodes.find((n) => n.id === selectedNode) || pipelineNodes[0];
  const Icon = currentNode.icon;

  const handleTestRunEndpoint = async () => {
    setIsAttemptingRun(true);
    setRunStatusMessage(null);

    try {
      const res = await runExperiment({
        dataset: 'iris',
        model: 'random_forest',
        hyperparameters: { n_estimators: 100, max_depth: 5 },
        test_size: 0.2,
        random_seed: 42,
      });

      if (res && res.status === 'success') {
        if (setExperimentResult) {
          setExperimentResult(res);
        }
        setRunStatusMessage({
          type: 'success',
          title: 'Experiment Completed (Member 2 Runner Live)',
          message: `Measured Accuracy: ${(res.measured_accuracy * 100).toFixed(1)}% | Dataset: ${res.dataset} (${res.test_samples} test samples) | MLflow Run ID: ${res.mlflow_run_id}`,
          data: res,
        });
        addToast({
          type: 'success',
          title: 'Experiment Executed & Tracked',
          message: `Accuracy: ${(res.measured_accuracy * 100).toFixed(1)}% logged to MLflow (${res.mlflow_run_id.slice(0, 8)}...)`,
        });
      } else {
        setRunStatusMessage({
          type: 'warning',
          title: 'Experiment Status',
          message: res.message || 'Experiment returned non-standard outcome.',
        });
      }
    } catch (err) {
      setRunStatusMessage({
        type: 'error',
        title: 'Endpoint Error: POST /run',
        message: err.message || 'POST /run failed.',
      });
      addToast({
        type: 'error',
        title: 'Run Failed',
        message: err.message || 'Backend error executing experiment.',
      });
    } finally {
      setIsAttemptingRun(false);
    }
  };


  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-line">
        <div>
          <h3 className="text-xl font-display font-semibold text-ink-primary flex items-center gap-2">
            <Sliders className="w-5 h-5 text-steel" />
            <span>Interactive Experiment Configuration DAG</span>
          </h3>
          <p className="text-xs text-ink-secondary mt-1">
            Standardized execution pipeline: Dataset → Preprocessing → Architecture → Evaluation → MLflow
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-status-amber px-2.5 py-1 rounded-full bg-status-amberSoft border border-status-amber/30 font-medium">
            Runner: HTTP 501 Staged
          </span>
        </div>
      </div>

      {/* 5 Horizontal DAG Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
        {pipelineNodes.map((node, idx) => {
          const isSelected = selectedNode === node.id;
          const NodeIcon = node.icon;

          return (
            <button
              key={node.id}
              onClick={() => setSelectedNode(node.id)}
              className={`p-3.5 rounded-2xl text-left transition-all border flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-steel/40 ${
                isSelected
                  ? 'bg-white border-steel shadow-sm ring-1 ring-steel/20 scale-[1.01]'
                  : 'bg-canvas border-border-line hover:border-steel/30 hover:bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-mono font-semibold ${isSelected ? 'text-steel' : 'text-ink-muted'}`}>
                    STEP 0{idx + 1}
                  </span>
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-surface-paleBlue text-deepBlue' : 'bg-white text-ink-secondary border border-border-line'}`}>
                    <NodeIcon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className={`text-xs font-semibold leading-tight ${isSelected ? 'text-ink-primary' : 'text-ink-secondary'}`}>
                  {node.name}
                </div>
              </div>

              <div className="mt-2 text-[10px] font-mono text-ink-muted truncate">
                {node.tag}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Node Details Card */}
      <div className="bg-white rounded-3xl p-6 border border-border-line shadow-card-subtle">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-line">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-surface-paleBlue border border-border-line text-deepBlue">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-ink-primary">
                {currentNode.name}
              </h4>
              <p className="text-xs text-ink-secondary">
                {currentNode.summary}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-deepBlue px-2.5 py-1 rounded-full bg-surface-paleBlue border border-border-line">
            {currentNode.tag}
          </span>
        </div>

        {/* Key-Value Parameters Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentNode.params.map((param, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-canvas border border-border-line flex flex-col justify-between"
            >
              <div className="text-[11px] font-mono text-ink-muted">{param.key}</div>
              <div className="text-xs font-mono font-semibold text-ink-primary mt-1">
                {param.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Member 2 Experiment Runner Status Card */}
      <div className={`p-6 rounded-3xl border ${
        experimentResult
          ? 'bg-status-tealSoft/50 border-status-teal/40'
          : 'bg-surface-paleBlue/50 border-border-line'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl border shrink-0 shadow-xs ${
            experimentResult
              ? 'bg-white border-status-teal/30 text-status-teal'
              : 'bg-white border-border-line text-deepBlue'
          }`}>
            <Play className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full border font-semibold uppercase ${
                experimentResult
                  ? 'bg-status-tealSoft text-status-teal border-status-teal/30'
                  : 'bg-white text-deepBlue border-border-line'
              }`}>
                {experimentResult ? 'EXECUTION RUNNER COMPLETE (MEMBER 2)' : 'EXECUTION RUNNER LIVE (MEMBER 2)'}
              </span>
              <span className="text-xs font-mono text-ink-muted">
                FastAPI: POST /run (Live & MLflow Tracked)
              </span>
            </div>

            <h4 className="text-base font-semibold text-ink-primary mt-2">
              {experimentResult
                ? `Measured Accuracy: ${(experimentResult.measured_accuracy * 100).toFixed(1)}%`
                : 'Execute Supported Benchmark Experiment'}
            </h4>

            <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
              {experimentResult ? (
                <>
                  MLflow Run ID: <code className="text-deepBlue font-mono font-bold">{experimentResult.mlflow_run_id}</code>
                  <br />
                  <span className="text-ink-muted text-[11px] mt-1 inline-block">
                    {experimentResult.note || 'Technical integration test only; paper reproduction requires paper-specific dataset and pipeline.'}
                  </span>
                </>
              ) : (
                'Member 2\'s experiment execution runner is fully integrated. Trigger the reproducibility runner to train a RandomForest benchmark on the Iris dataset and record live MLflow metrics.'
              )}
            </p>

            {runStatusMessage && (
              <div className={`mt-3 p-3.5 rounded-2xl border text-xs font-mono ${
                runStatusMessage.type === 'success'
                  ? 'bg-white border-status-teal/30 text-status-teal'
                  : 'bg-white border-status-amber/30 text-status-amber'
              }`}>
                <strong>{runStatusMessage.title}:</strong> {runStatusMessage.message}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={handleTestRunEndpoint}
                disabled={isAttemptingRun}
                className="px-5 py-2 rounded-full text-xs font-mono font-semibold border border-border-line bg-white hover:bg-canvas text-ink-primary transition-colors flex items-center gap-2 shadow-xs"
              >
                {isAttemptingRun ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-deepBlue/30 border-t-deepBlue rounded-full animate-spin" />
                    <span>Executing POST /run (MLflow)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-status-teal" />
                    <span>{experimentResult ? 'Re-run Experiment (POST /run)' : 'Run Supported Experiment (POST /run)'}</span>
                  </>
                )}
              </button>

              <button
                onClick={onProceedToAudit}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-deepBlue hover:bg-ink-primary text-white shadow-cta-glow transition-all flex items-center gap-2"
              >
                <span>Proceed to Metric Audit (/audit)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
