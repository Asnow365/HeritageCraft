import { Trajectory, FailureSignature, Prototype, RunSummary } from "../types/a31";

export interface A31ServiceConfig {
  artifactsRoot: string;
  runId?: string;
}

async function readJsonl<T>(url: string): Promise<T[]> {
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const text = await resp.text();
  return text
    .trim()
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as T);
}

export async function loadRunData(
  config: A31ServiceConfig
): Promise<{
  trajectories: Trajectory[];
  failures: FailureSignature[];
  prototypes: Prototype[];
  summary: RunSummary | null;
}> {
  const base = config.runId
    ? `${config.artifactsRoot}/runs/${config.runId}`
    : config.artifactsRoot;

  const [trajectories, failures, prototypes, summary] = await Promise.all([
    readJsonl<Trajectory>(`${base}/trajectories.jsonl`),
    readJsonl<FailureSignature>(`${base}/failures.jsonl`).catch(() => []),
    readJsonl<Prototype>(`${base}/../memory/prototypes.jsonl`).catch(() => []),
    fetch(`${base}/summary.json`)
      .then((r) => (r.ok ? (r.json() as Promise<RunSummary>) : null))
      .catch(() => null),
  ]);

  return { trajectories, failures, prototypes, summary };
}
