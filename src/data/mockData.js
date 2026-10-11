/**
 * CrisisGrid - Demonstration & Sample Data Reference
 * 
 * IMPORTANT: This data is provided solely for UI preview, design verification,
 * and testing layout components before Member 1 (Extractor) and Member 2 (Runner)
 * complete their backend integration.
 * 
 * Never presented as genuine backend extraction.
 */

export const SAMPLE_PAPER_EXTRACTION = {
  isDemonstrationData: true,
  paper_id: "demo-paper-2024-repro-01",
  title: "Exploring Reproducibility in Deep Residual Networks under Sparse Regularization",
  authors: ["A. Vance", "E. Chen", "K. Takahashi", "M. Rostova"],
  year: 2024,
  venue: "NeurIPS 2024 (Under Review Archive)",
  doi: "10.48550/arXiv.2403.99214",
  
  methodology: {
    model_architecture: "ResNet-50 (Modified Pre-activation)",
    objective_function: "Cross-Entropy Loss with L1-L2 Sparse Weight Decay",
    optimizer: "SGD with Nesterov Momentum (0.9)",
    learning_rate: 0.1,
    lr_schedule: "Cosine Annealing (warmup 5 epochs, T_max 90)",
    batch_size: 256,
    weight_decay: 0.0001,
    random_seeds: [42, 1337, 2024],
    precision: "Mixed Precision (FP16 / AMP)",
  },

  dataset: {
    name: "ImageNet-1K (ILSVRC2012)",
    preprocessing: [
      "RandomResizedCrop(224, scale=(0.08, 1.0))",
      "RandomHorizontalFlip(p=0.5)",
      "AutoAugment(policy=ImageNet)",
      "Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])"
    ],
    train_samples: 1281167,
    val_samples: 50000,
    classes: 1000,
  },

  reported_metrics: [
    { name: "Top-1 Accuracy", reported_value: 0.768, unit: "ratio", page: "Page 6, Table 2" },
    { name: "Top-5 Accuracy", reported_value: 0.932, unit: "ratio", page: "Page 6, Table 2" },
    { name: "Convergence Epoch", reported_value: 84, unit: "epochs", page: "Page 7, Fig 4" }
  ],

  confirmed_details: [
    { field: "Model Topology", value: "ResNet-50 standard bottleneck layers", page: "p. 3 §2.1" },
    { field: "Optimizer", value: "SGD (Momentum=0.9, weight_decay=1e-4)", page: "p. 4 §3.2" },
    { field: "Augmentation Policy", value: "Standard PyTorch AutoAugment", page: "p. 4 §3.3" },
    { field: "Hardware Specified", value: "8x NVIDIA A100 (80GB SXM4)", page: "p. 5 §4.1" },
  ],

  missing_or_ambiguous_details: [
    { field: "Gradient Clipping Threshold", detail: "Not stated in text or supplementary material", severity: "medium" },
    { field: "Data Loader Workers & Pin Memory", detail: "Omitted; may affect data starvation during distributed step", severity: "low" },
    { field: "Exact PyTorch / CUDA Version", detail: "CUDA 11.8 assumed, exact build hash missing", severity: "medium" },
    { field: "Warmup Learning Rate Start", detail: "Initial lr for warmup linear slope not specified (assumed 1e-4)", severity: "high" }
  ],

  evidence_snippets: [
    {
      page: 4,
      section: "Section 3.2 Training Regimen",
      text: "We train ResNet-50 using SGD with momentum 0.9 and initial learning rate 0.1 decayed via cosine schedule over 90 epochs. Batch size is fixed to 256 distributed evenly across 8 GPUs."
    },
    {
      page: 6,
      section: "Section 4.3 Benchmark Validation",
      text: "Our modified architecture achieves 76.80% Top-1 validation accuracy on ImageNet-1K with sparse regularization, outperforming the baseline by 0.65%."
    }
  ]
};

export const SAMPLE_EXPERIMENT_CONFIG = {
  pipeline_stages: [
    {
      id: "dataset",
      name: "Dataset & Ingestion",
      summary: "ImageNet-1K / Synthetic Validation Subset",
      details: "Downloads or mounts standardized dataset shards with checksum verification."
    },
    {
      id: "preprocessing",
      name: "Preprocessing Pipeline",
      summary: "Standard ResizedCrop & Normalization",
      details: "Applies deterministic transforms matching Section 3.3 specifications."
    },
    {
      id: "model",
      name: "Model Architecture",
      summary: "ResNet-50 TorchVision / Custom Layer Def",
      details: "Instantiates exact parameter count (25.56M parameters) with fixed initialization seed."
    },
    {
      id: "evaluation",
      name: "Evaluation Protocol",
      summary: "Single-Crop Top-1 / Top-5 Accuracy",
      details: "Runs synchronous validation loop across all 50,000 evaluation samples."
    },
    {
      id: "mlflow",
      name: "MLflow Telemetry",
      summary: "Artifacts, Parameters & Metric Logging",
      details: "Tracks live loss curves, learning rate dynamics, and validation metric deltas."
    }
  ]
};
