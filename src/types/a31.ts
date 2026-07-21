export interface TrajectoryInput {
  prompt: string;
  image_path: string | null;
  method: string;
  input_mode: string;
  vlm_prompt?: Record<string, any> | null;
  tags: string[];
  round_index: number;
}

export interface TrajectoryOutput {
  asset_id: string;
  status: string;
  prompt_used: string;
  negative_constraints: string[];
  metadata: Record<string, any>;
  asset_path?: string | null;
}

export interface TrajectoryActions {
  patched_prompt: string;
  negative_constraints: string[];
  retrieved_prototypes: string[];
}

export interface Trajectory {
  sample_id: string;
  task: string;
  x: TrajectoryInput;
  y: TrajectoryOutput;
  q: Record<string, any>;
  e: Record<string, any>;
  a: TrajectoryActions;
  y_prime: { passed: boolean } | null;
}

export interface FailureSignature {
  sample_id: string;
  task: string;
  context: string[];
  failure_types: string[];
  visual_evidence: Record<string, any>;
  mesh_evidence: Record<string, any>;
  semantic_evidence: Record<string, any>;
  action: string[];
  delta: { passed: boolean };
}

export interface Prototype {
  prototype_id: string;
  failure_type: string;
  trigger: string[];
  action: string[];
  score: number;
  count: number;
  examples: string[];
}

export interface RunSummary {
  run_dir: string;
  num_samples: number;
  num_failures: number;
  prevention_applied: number;
  failure_counts: Record<string, number>;
  method_counts: Record<string, number>;
  failures_by_method: Record<string, number>;
  prevention_by_method: Record<string, number>;
  memory_size: number;
}
