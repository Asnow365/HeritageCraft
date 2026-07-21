import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import styles from "./index.module.scss";
import { Image } from "antd";
import useDataProcess from "../../models/useDataProcess";

const chartColors = [
  "#2C4882", "#B43232", "#328250", "#A06428",
  "#503C82", "#1E788C", "#C07A3A", "#4A6B7A",
];

const ParallelPanel = () => {
  const { selectedImageId } = useSelector((state: RootState) => {
    return state.parameter;
  });

  const dataUtil = useDataProcess();
  const { perspectiveImages, lowers } = dataUtil.getPerspectiveImages(
    selectedImageId ?? 0
  );

  const images = useMemo(
    () => [...perspectiveImages].sort((a, b) => b.vlmFidelity - a.vlmFidelity).slice(0, 6),
    [perspectiveImages]
  );

  return (
    <div className={styles["parallel-panel"]}>
      <div className={styles["legend"]}>
        {images.map((item: any, index: number) => {
          const vlmScore = (item.vlmFidelity / 5).toFixed(2);
          const vlmPct = Math.round(item.vlmFidelity / 5 * 100);
          const isHigh = lowers.findIndex((l: any) => l === item.view_id) !== -1;
          return (
            <div className={styles["legend-item"]} key={index}>
              <Image
                src={item.image_abnormal}
                width={100}
                height={100}
                style={{
                  border: isHigh ? "2px solid red" : "2px solid #82AFD7",
                }}
              />
              <div className={styles["quality-bar-wrap"]}>
                <div
                  className={styles["quality-bar"]}
                  style={{
                    width: `${vlmPct}%`,
                    backgroundColor: chartColors[index],
                  }}
                />
              </div>
              <div className={styles["quality-label"]}>
                <span>{item.roundLabel}</span>
                <span>{vlmScore}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ParallelPanel;
