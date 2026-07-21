import styles from "./index.module.scss";
import ParameterConfigration from "./ParameterConfigration";
import LocalExploration from "./LocalExploration";
import TextExploration from "./TextExploration";
import ImageBrowser from "./ImageBrowser";
import ParallelPanel from "./ParallelPanel";
import Reasons from "./Reasons";
import AttentionView from "./AttentionView";

const MainInterface = () => {
  return (
    <div className={styles["page"]}>
      <div className={styles["left-side"]}>
        <section className={styles["model-input"]}>
          <ParameterConfigration />
        </section>
        <section className={styles["text-exp"]}>
          <TextExploration />
        </section>
      </div>

      <div className={styles["center"]}>
        <section className={styles["center-section"]}>
          <div className={styles["header"]}>
            <h2>Image Browser</h2>
          </div>

          <div className={styles["wrapper"]}>
            <ImageBrowser />
            <div className={styles["bottom-panel"]}>
              <ParallelPanel />
            </div>
          </div>
        </section>
      </div>

      <div className={styles["right-side"]}>
        <section className={styles["local-exp"]}>
          <LocalExploration />
        </section>
        <section className={styles["local-exp"]}>
          <AttentionView />
        </section>
        <section className={styles["local-exp"]}>
          <Reasons />
        </section>
      </div>
    </div>
  );
};
export default MainInterface;
