import styles from "./index.module.scss";
import { useMemo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const TextExploration = () => {
  const { selectedImageId } = useSelector((state: RootState) => {
    return state.parameter;
  });
  const [promptLines, setPromptLines] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedImageId) {
      setPromptLines([]);
      return;
    }
    const sid = String(selectedImageId).padStart(6, "0");
    fetch(`${import.meta.env.BASE_URL}data/01_img-prompts/prompt_${sid}.txt`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.text();
      })
      .then((text) => {
        setPromptLines(text.split("\n").filter((l) => l.trim().length > 0));
      })
      .catch(() => {
        setPromptLines([]);
      });
  }, [selectedImageId]);

  return (
    <div className={styles["panel"]}>
      <h2>Text Exploration</h2>

      {!selectedImageId ? (
        <div className={styles["empty-hint"]}>
          Click an image in the browser to view its prompt and generation rounds
        </div>
      ) : promptLines.length === 0 ? (
        <div className={styles["empty-hint"]}>
          No prompt data found for this sample
        </div>
      ) : (
        <div className={styles["content"]}>
          <div className={styles["header"]}>
            Scene Prompts ({promptLines.length} rules)
          </div>
          <div className={styles["rule-list"]}>
            {promptLines.map((line, idx) => {
              // Split on first colon or period for a cleaner label
              const label = `R${String(idx + 1).padStart(2, "0")}`;
              return (
                <div key={idx} className={styles["rule-item"]}>
                  <span className={styles["rule-number"]}>{label}</span>
                  <span className={styles["rule-text"]}>{line}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextExploration;
