import { useDispatch, useSelector } from "react-redux";
import { Dispatch, RootState } from "../store";
import { useCallback } from "react";
import { INDICATES } from "../assets/mock/constant";

const BASE_URL = "";

// VLM t-SNE coordinates computed from fidelity scores
const VLM_COORDS: Record<string, { x: number; y: number }> = {
  "000190": { x: 756, y: 50 },
  "000192": { x: 1150, y: 235 },
  "000274": { x: 50, y: 1042 },
  "000498": { x: 666, y: 1150 },
  "000516": { x: 821, y: 739 },
  "000525": { x: 1140, y: 998 },
};

// VLM overall_fidelity per round for each sample
const VLM_FIDELITY: Record<string, Record<string, number>> = {
  "000190": { r01: 4, r03: 4, r05: 4, r07: 4, r09: 2.6, r11: 3, r13: 2.7, r15: 4 },
  "000192": { r01: 3, r03: 4, r05: 3.5, r07: 3, r09: 3.4, r11: 3.8, r13: 3.5, r15: 3.5 },
  "000274": { r01: 2, r03: 2, r05: 2, r07: 2, r09: 2, r11: 2, r13: 2, r15: 2.3 },
  "000516": { r01: 2, r03: 3, r05: 3.4, r07: 3, r09: 3, r11: 3, r13: 3, r15: 3 },
  "000525": { r01: 2.5, r03: 3, r05: 2, r07: 3, r09: 2.8, r11: 2 },
};

function hashToRange(str: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const normalized = (hash & 0x7fffffff) / 0x7fffffff;
  return min + normalized * (max - min);
}

const useDataProcess = () => {
  const { trajectories, failures, prototypes } = useSelector(
    (state: RootState) => state.a31
  );

  const getImageCandidates = useCallback(() => {
    if (!trajectories || trajectories.length === 0) return [];

    const latestBySample = new Map<
      string,
      (typeof trajectories)[0]
    >();
    for (const t of trajectories) {
      const existing = latestBySample.get(t.sample_id);
      if (!existing || t.x.round_index > existing.x.round_index) {
        latestBySample.set(t.sample_id, t);
      }
    }

    const sampleFailures = new Map<string, string[]>();
    for (const f of failures) {
      const key = f.sample_id;
      if (!sampleFailures.has(key)) {
        sampleFailures.set(key, []);
      }
      sampleFailures.get(key)!.push(...f.failure_types);
    }

    return Array.from(latestBySample.entries()).map(
      ([sampleId, traj], idx) => {
        const fs = sampleFailures.get(sampleId) || [];
        const riskScore =
          typeof traj.q?.risk_score === "number" ? traj.q.risk_score : 0.5;
        const suitabilityScore = Math.max(0, Math.min(1, 1 - riskScore / 5));

        const vlmPos = VLM_COORDS[sampleId];
        const xCoord = vlmPos?.x ?? hashToRange(sampleId + "_scatter_x", 0, 1200);
        const yCoord = vlmPos?.y ?? hashToRange(sampleId + "_scatter_y", 0, 1200);

        let imageUrl = "";
        if (traj.x?.image_path) {
          const imgPath = traj.x.image_path.replace(/\\/g, "/");
          const parts = imgPath.split("/");
          const filename = parts[parts.length - 1] || `${sampleId}.jpg`;
          imageUrl = `data/01_images/${filename}`;
        }
        if (!imageUrl) {
          imageUrl = `data/01_images/${sampleId}.jpg`;
        }

        return {
          id: sampleId,
          source: traj.x?.method || "unknown",
          prompt: traj.x?.prompt || "",
          x: xCoord,
          y: yCoord,
          image: imageUrl,
          external_link: null,
          ThreeD_suitable_score: suitabilityScore,
          failure_types: fs,
          status: traj.y?.status || "unknown",
          passed: traj.y_prime?.passed ?? false,
        };
      }
    );
  }, [trajectories, failures]);

  const getPerspectiveImages = useCallback(
    (id: string | number) => {
      if (!id || !trajectories) {
        return { perspectiveImages: [], maxRadius: 0, minRadius: 0, lowers: [] };
      }

      const sampleTrajs = trajectories.filter(
        (t) => t.sample_id === String(id)
      );
      if (sampleTrajs.length === 0) {
        return { perspectiveImages: [], maxRadius: 0, minRadius: 0, lowers: [] };
      }

      const last = sampleTrajs[sampleTrajs.length - 1];
      const baseImagePath = last.x?.image_path || "";
      const filename = baseImagePath
        ? baseImagePath.split("/").pop()
        : `${id}.jpg`;

      const sampleId = String(id).padStart(6, "0");

      // Check if real render images exist for this sample
      // Use round previews from experiment-start (r01~r19) at different angles
      const roundLabels = ["r01", "r03", "r05", "r07", "r09", "r11", "r17", "r18"];
      const angles = [0, 45, 90, 135, 180, 225, 270, 315];
      const renderBase = `data/renders/${sampleId}`;

      const perspectiveImages = angles.map((angle, idx) => {
        // Try real render first, fall back to synthetic
        const roundFile = `${renderBase}/${sampleId}_${roundLabels[idx]}_preview.jpg`;
        const roundLabel = roundLabels[idx];
        // Quality approximates round index / 19
        const roundNum = parseInt(roundLabel.replace("r", ""));
        const quality = Math.round((roundNum / 19) * 100) / 100;
        const vlmFidelity = VLM_FIDELITY[sampleId]?.[roundLabel] ?? quality * 5;

        return {
          view_id: `view_${idx}`,
          angle,
          value: quality * 5, // map quality 0-1 to radial distance 0-5
          image: roundFile,
          image_abnormal: roundFile,
          quality,
          vlmFidelity,
          roundLabel,
        };
      });

      const maxRadius = Math.max(...perspectiveImages.map((p) => p.value));
      const minRadius = Math.min(...perspectiveImages.map((p) => p.value));
      const lowers = perspectiveImages
        .filter((p) => p.quality >= 0.6)
        .map((p) => p.view_id);

      return { perspectiveImages, maxRadius, minRadius, lowers };
    },
    [trajectories]
  );

  const getKeyWordData = useCallback(() => {
    if (!trajectories || trajectories.length === 0) {
      return INDICATES.children.map(() => []);
    }

    const tagFrequency = new Map<string, number>();
    for (const t of trajectories) {
      for (const tag of t.x?.tags || []) {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      }
    }

    const sortedTags = Array.from(tagFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([text, value]) => ({ text, value }));

    if (sortedTags.length === 0) {
      return INDICATES.children.map(() => []);
    }

    const dimCount = INDICATES.children.length;
    const result: { text: string; value: number }[][] = [];
    for (let d = 0; d < dimCount; d++) {
      const slice: { text: string; value: number }[] = [];
      for (let i = d; i < sortedTags.length; i += dimCount) {
        slice.push(sortedTags[i]);
      }
      slice.sort((a, b) => a.value - b.value);
      result.push(slice);
    }

    return result;
  }, [trajectories]);

  const getParallelData = useCallback(
    (id?: string | number, roundLabels?: string[]) => {
      if (!id || !trajectories) return [];
      const sampleTrajs = trajectories.filter(
        (t) => t.sample_id === String(id)
      );
      const roundSet = roundLabels
        ? new Set(roundLabels.map((r) => parseInt(r.replace("r", ""))))
        : null;

      return sampleTrajs
        .filter((t) => !roundSet || roundSet.has(t.x?.round_index ?? -1))
        .map((t) => {
        const risk = typeof t.q?.risk_score === "number" ? t.q.risk_score : 0.5;
        const passedVal = t.y_prime?.passed ? 1 : 0;
        const mockVal = t.q?.mock_validity ? 1 : 0;

        return [
          Number(risk.toPrecision(2)),
          Number(passedVal.toPrecision(2)),
          Number(mockVal.toPrecision(2)),
          Number((1 - risk / 5).toPrecision(2)),
          Number((t.x?.tags?.length || 0) > 2 ? 0.8 : 0.3),
          Number(t.y?.status === "success" ? 0.9 : 0.2),
          Number(t.x?.round_index > 0 ? 0.7 : 0.3),
          Number(t.x?.method === "image_to_3d" ? 0.8 : 0.4),
        ];
      });
    },
    [trajectories]
  );

  const getMesh = useCallback(
    (id?: string | number, roundLabel?: string) => {
      if (!id || !trajectories) return undefined;
      const sampleId = String(id).padStart(6, "0");
      const round = roundLabel || "r19";
      return `${import.meta.env.BASE_URL}data/models/${sampleId}/${sampleId}_${round}.glb`;
    },
    [trajectories]
  );

  const getTopModels = useCallback(() => {
    if (!trajectories || trajectories.length === 0) return [];

    // Group by sample_id, get latest trajectory for each
    const latestBySample = new Map<string, (typeof trajectories)[0]>();
    for (const t of trajectories) {
      const existing = latestBySample.get(t.sample_id);
      if (!existing || t.x.round_index > existing.x.round_index) {
        latestBySample.set(t.sample_id, t);
      }
    }

    // Compute VLM score (higher is better)
    const scored = Array.from(latestBySample.entries()).map(
      ([sampleId, traj]) => {
        const riskScore =
          typeof traj.q?.risk_score === "number" ? traj.q.risk_score : 0.5;
        const score = Math.max(0, Math.min(1, 1 - riskScore / 5));
        return {
          sampleId,
          score: Number(score.toFixed(3)),
          prompt: traj.x?.prompt || "",
        };
      }
    );

    // Sort by score descending, take top 2
    return scored.sort((a, b) => b.score - a.score).slice(0, 2);
  }, [trajectories]);

  const getReasons = useCallback(
    (id?: string | number): any => {
      if (!id || !trajectories) return [];

      const sampleTrajs = trajectories.filter(
        (t) => t.sample_id === String(id)
      );
      const sampleFailures = failures.filter(
        (f) => f.sample_id === String(id)
      );

      return sampleTrajs.map((t, idx) => {
        const match = sampleFailures.find((f) =>
          f.failure_types?.length > 0
        );
        const types = match?.failure_types || [];
        const actions = t.a?.negative_constraints || [];
        const passed = t.y_prime?.passed ?? false;

        const lines: string[] = [];
        lines.push(`Round ${t.x.round_index}: ${t.x.method}`);
        lines.push(`Status: ${t.y.status}`);
        lines.push(`Prompt: ${t.x.prompt}`);
        if (t.a?.patched_prompt && t.a.patched_prompt !== t.x.prompt) {
          lines.push(`Patched: ${t.a.patched_prompt}`);
        }
        if (types.length > 0) {
          lines.push(`Failures: ${types.join(", ")}`);
        }
        if (actions.length > 0) {
          lines.push(`Constraints: ${actions.join("; ")}`);
        }
        if (t.q && Object.keys(t.q).length > 0) {
          lines.push(
            `Quality: ${JSON.stringify(t.q)}`
          );
        }
        lines.push(`Passed: ${passed ? "Yes" : "No"}`);

        return lines.join("\n");
      });
    },
    [trajectories, failures]
  );

  const getAttentionData = useCallback(
    (id?: string | number) => {
      // Data is now loaded directly in AttentionView component
      return { texts: [], imgs: [], ranges: [], data: [] };
    },
    []
  );

  return {
    getAttentionData,
    getReasons,
    getMesh,
    getTopModels,
    getParallelData,
    getKeyWordData,
    getImageCandidates,
    getPerspectiveImages,
  };
};

export default useDataProcess;
