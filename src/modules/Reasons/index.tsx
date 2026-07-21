import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch, RootState } from "../../store";
import styles from "./index.module.scss";
// import { getReasons } from "../../utils";
import { Pagination } from "antd";
import useDataProcess from "../../models/useDataProcess";

const Reasons = () => {
  const [index, setIndex] = useState<number>(1);
  const { selectedImageId } = useSelector((state: RootState) => {
    return state.parameter;
  });
  const dataUtil = useDataProcess();
  const reasons = dataUtil.getReasons(selectedImageId) ?? [];

  return (
    <div className={styles["local-exploration-panel"]}>
      <h2>Reasons</h2>
      <div className={styles["result-details"]}>{reasons?.[index - 1]}</div>
      <Pagination
        current={index}
        total={reasons.length}
        pageSize={1}
        onChange={(page: number) => {
          setIndex(page);
        }}
      />
    </div>
  );
};

export default Reasons;
