import { Suspense, useMemo, useState, useEffect, Component, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import styles from "./index.module.scss";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import useDataProcess from "../../models/useDataProcess";
import { Trajectory } from "../../types/a31";

class CanvasErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className={styles["model-error"]}>3D 渲染出错</div>;
    }
    return this.props.children;
  }
}

function Model({ url }: { url: string }) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      setError(true);
      return;
    }
    setError(false);
    setLoading(true);
    setModel(null);

    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const scene = gltf.scene;
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        scene.position.sub(center);
        const maxSize = Math.max(size.x, size.y, size.z);
        if (maxSize > 0) {
          const scale = 3 / maxSize;
          scene.scale.set(scale, scale, scale);
        }

        setModel(scene);
        setLoading(false);
      },
      undefined,
      () => {
        setError(true);
        setLoading(false);
      }
    );
  }, [url]);

  if (loading) return null;
  if (error) return <div className={styles["model-error"]}>模型加载失败</div>;
  if (!model) return null;
  return <primitive object={model} />;
}

const LocalExploration = () => {
  const dataUtil = useDataProcess();
  const { trajectories } = useSelector((state: RootState) => state.a31);
  const { selectedImageId } = useSelector((state: RootState) => state.parameter);
  const hasData = trajectories && trajectories.length > 0;

  // All rounds of the current sample, sorted by vlmFidelity
  const rounds = useMemo(() => {
    if (!selectedImageId) return [];
    const { perspectiveImages } = dataUtil.getPerspectiveImages(selectedImageId);
    return [...perspectiveImages].sort((a, b) => b.vlmFidelity - a.vlmFidelity);
  }, [selectedImageId, dataUtil]);

  const [roundIndex, setRoundIndex] = useState(0);

  // Reset to 0 when sample changes
  useEffect(() => {
    setRoundIndex(0);
  }, [selectedImageId]);

  const goPrev = useCallback(() => {
    setRoundIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setRoundIndex((i) => Math.min(rounds.length - 1, i + 1));
  }, [rounds.length]);

  const selectedModel = useMemo(() => {
    if (!selectedImageId || !hasData || rounds.length === 0) return null;
    const sampleId = String(selectedImageId).padStart(6, "0");

    const best = rounds[roundIndex];
    const roundLabel = best?.roundLabel || "r19";
    const url = dataUtil.getMesh(sampleId, roundLabel);
    if (!url) return null;

    const traj = trajectories.find((t: Trajectory) => t.sample_id === sampleId);
    const vlmScore = best ? (best.vlmFidelity / 5).toFixed(2) : "?";

    return {
      sampleId,
      url,
      score: vlmScore,
      roundLabel,
      prompt: traj?.x?.prompt || "",
    };
  }, [selectedImageId, hasData, rounds, roundIndex, dataUtil, trajectories]);

  return (
    <div className={styles["local-exploration-panel"]}>
      <div className={styles["panel-header"]}>
        <h2>3D Models</h2>
        <div className={styles["nav-buttons"]}>
          <button
            className={styles["nav-btn"]}
            onClick={goPrev}
            disabled={roundIndex <= 0}
          >
            &#8249;
          </button>
          <span className={styles["nav-counter"]}>
            {rounds.length > 0 ? `${roundIndex + 1}/${rounds.length}` : "-"}
          </span>
          <button
            className={styles["nav-btn"]}
            onClick={goNext}
            disabled={roundIndex >= rounds.length - 1}
          >
            &#8250;
          </button>
        </div>
      </div>
      <div className={styles["model-grid"]}>
        {selectedModel ? (
          <div key={`${selectedModel.sampleId}-${selectedModel.roundLabel}`} className={styles["model-card"]}>
            <div className={styles["model-canvas"]}>
              <CanvasErrorBoundary>
                <Canvas camera={{ position: [2, 2, 2], fov: 45 }} onCreated={({ scene }) => { scene.background = new THREE.Color('#f5f5f5'); }}>
                  <Suspense fallback={null}>
                    <Model url={selectedModel.url} />
                    <OrbitControls enablePan={false} />
                    <ambientLight intensity={1.2} />
                    <directionalLight position={[5, 5, 5]} intensity={2.5} />
                    <directionalLight position={[-3, 2, -3]} intensity={1.0} />
                    <directionalLight position={[0, -5, 0]} intensity={0.8} />
                    <hemisphereLight args={["#ffffff", "#444444", 0.6]} />
                  </Suspense>
                </Canvas>
              </CanvasErrorBoundary>
            </div>
            <div className={styles["model-info"]}>
              <span className={styles["model-rank"]}>#{selectedModel.sampleId}</span>
              <span className={styles["model-score"]}>
                Score: {selectedModel.score}
              </span>
            </div>
            <div className={styles["model-prompt"]} title={selectedModel.prompt}>
              {selectedModel.prompt}
            </div>
          </div>
        ) : (
          <div className={styles["empty-hint"]}>
            {selectedImageId
              ? "未找到该样本的 3D 模型文件"
              : "点击散点图中的样本以查看 3D 模型"}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalExploration;
