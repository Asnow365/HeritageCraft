import { useState, useMemo, useCallback } from "react";
import styles from "./index.module.scss";
import { useSelector, useDispatch } from "react-redux";
import { Dispatch, RootState } from "../../store";
import { Image, Button } from "antd";

const SAMPLE_IDS = ["000190", "000192", "000274", "000498", "000516", "000525"];

const ModelInput = () => {
  const dispatch = useDispatch<Dispatch>();
  const { selectedImageId } = useSelector((state: RootState) => state.parameter);
  const { trajectories } = useSelector((state: RootState) => state.a31);

  const [selectedSample, setSelectedSample] = useState<string>(
    selectedImageId ? String(selectedImageId).padStart(6, "0") : SAMPLE_IDS[0]
  );

  const currentPrompt = useMemo(() => {
    if (!trajectories) return "";
    const traj = trajectories.find(
      (t: any) => t.sample_id === selectedSample
    );
    return traj?.x?.prompt || "";
  }, [trajectories, selectedSample]);

  const handleGenerate = useCallback(() => {
    dispatch.parameter.updateState({ selectedImageId: selectedSample });
  }, [dispatch, selectedSample]);

  const handleSelectSample = useCallback((sid: string) => {
    setSelectedSample(sid);
    dispatch.parameter.updateState({ selectedImageId: sid });
  }, [dispatch]);

  const isSelected = selectedImageId === selectedSample;

  return (
    <div className={styles["model-input-panel"]}>
      <h2>Model Input</h2>

      {/* Default prompt display */}
      <div className={styles["prompt-box"]}>
        <div className={styles["prompt-label"]}>Default Prompt</div>
        <div className={styles["prompt-text"]}>
          {currentPrompt || "No prompt available"}
        </div>
      </div>

      {/* Sample selection grid */}
      <div className={styles["sample-grid"]}>
        {SAMPLE_IDS.map((sid) => (
          <div
            key={sid}
            className={`${styles["sample-card"]} ${
              selectedSample === sid ? styles["sample-selected"] : ""
            }`}
            onClick={() => handleSelectSample(sid)}
          >
            <Image
              src={`data/01_images/${sid}.jpg`}
              alt={sid}
              width="100%"
              height={80}
              style={{ objectFit: "cover", borderRadius: 4 }}
              preview={false}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualTgAAAABJRU5ErkJggg=="
            />
            <span className={styles["sample-id"]}>#{sid}</span>
          </div>
        ))}
      </div>

      <Button
        onClick={handleGenerate}
        className={styles["generate-btn"]}
        disabled={!selectedSample}
      >
        Generate
      </Button>
    </div>
  );
};

export default ModelInput;
