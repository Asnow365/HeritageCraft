import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import styles from "./index.module.scss";
import * as d3 from "d3";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch, RootState } from "../../store";
import { Spin } from "antd";
import SatelliteChart from "./SatelliteChart";
import { Image } from "antd";
import useDataProcess from "../../models/useDataProcess";

const DefaultWidth = 1200;
const DefaultHeight = 1200;
const DEFAULT = d3.zoomIdentity.translate(0, 0).scale(1);

const ImageBrowser = () => {
  const $container = useRef<any>(null);
  const { updateState } = useDispatch<Dispatch>().parameter;
  const { isShowOverlay, selectedImageId } = useSelector((state: RootState) => {
    return state.parameter;
  });
  const dataUtil = useDataProcess();
  const image_candidates = useMemo(
    () => dataUtil.getImageCandidates(),
    [dataUtil]
  );

  const [transform, setTransform] = useState<any>(DEFAULT);
  const [width, setWidth] = useState<number>(DefaultWidth);
  const [height, setHeight] = useState<number>(DefaultHeight);
  const [showImageTooltip, setShowImageTooltip] = useState<boolean>(false);
  const [imageTooltipTopPosition, setImageTooltipTopPosition] =
    useState<number>(0);
  const [imageTooltipLeftPosition, setImageTooltipLeftPosition] =
    useState<number>(0);
  const [currentImage, setCurrentImage] = useState<any>(); // hover

  const onMouseOver = useCallback((node: any) => {
    setShowImageTooltip(true);
    setImageTooltipLeftPosition(node.x);
    setImageTooltipTopPosition(node.y);
    setCurrentImage(node);
  }, []);
  const onMouseOut = useCallback(() => {
    setShowImageTooltip(false);
    // setCurrentImage(null);
  }, []);

  const onClick = useCallback((node: any) => {
    console.log("onclick", node.id);

    updateState({ selectedImageId: node.id });
  }, []);

  const range = useMemo(() => {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    image_candidates.forEach((node) => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
    });

    return {
      x: [minX, maxX],
      y: [minY, maxY],
    };
  }, [image_candidates]);

  const xScale = useMemo(() => {
    return transform.rescaleX(
      d3.scaleLinear().domain(range.x).range([0, width]).nice()
    );
  }, [range.x, transform]);

  const yScale = useMemo(() => {
    return transform.rescaleY(
      d3.scaleLinear().domain(range.y).range([0, height]).nice()
    );
  }, [range.y, transform]);

  const zoom = d3
    .zoom()
    .scaleExtent([0.1, 20])
    .translateExtent([
      [-width, -height],
      [width * 2, height * 2],
    ])
    .on("zoom", (e) => {
      setTransform(e.transform);
    });
  // .on("start", (e) => {
  //   // 设置缩放中心为鼠标位置
  //   const [ x, y] = d3.pointer(e, $container.current);
  //   zoom.translateTo(d3.select($container.current), x, y);
  // })
  useEffect(() => {
    //@ts-ignore
    let svg = d3.select($container.current);
    //@ts-ignore
    svg.call(zoom).transition().duration();
  }, [zoom]);

  // Zoom to selected node on Generate
  useEffect(() => {
    if (!selectedImageId || !$container.current || image_candidates.length === 0) return;

    const node = image_candidates.find((n: any) => String(n.id) === String(selectedImageId));
    if (!node) return;

    const baseX = d3.scaleLinear().domain(range.x).range([0, width]).nice();
    const baseY = d3.scaleLinear().domain(range.y).range([0, height]).nice();
    const px = baseX(node.x);
    const py = baseY(node.y);

    // Scale so satellite chart (~200*0.4=80px base) fills ~65% of canvas
    const score = node.ThreeD_suitable_score || 0.5;
    const targetSize = Math.min(width, height) * 0.65;
    const k = Math.min(15, Math.max(1, targetSize / (200 * 0.4 * score)));

    const tx = width / 2 - px * k;
    const ty = height / 2 - py * k;

    const newTransform = d3.zoomIdentity.translate(tx, ty).scale(k);
    //@ts-ignore
    d3.select($container.current).transition().duration(200).call(zoom.transform, newTransform);
  }, [selectedImageId]);

  useEffect(() => {
    const dom = document.querySelector("#image-browser");
    dom?.clientWidth && setWidth(dom?.clientWidth);
    dom?.clientHeight && setHeight(dom?.clientHeight);
    // console.log(dom?.clientWidth);
  }, []);

  return (
    <div className={styles["image-browser-panel"]} id="image-browser">
      {/* loading */}
      <div
        className={styles["image-browser-overlay"]}
        style={{ display: isShowOverlay ? "block" : "none" }}
      >
        <Spin
          tip="loading..."
          size="large"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            color: "rgb(119, 119, 119)",
          }}
        />
      </div>
      {/* tooltip */}
      <div
        className={styles["image-detail-info"]}
        style={{
          top: yScale(imageTooltipTopPosition) + 20 + "px",
          left: xScale(imageTooltipLeftPosition) + 20 + "px",
          display: showImageTooltip ? "block" : "none",
        }}
      >
        {currentImage && (
          <div className={styles["details-item"]}>
            <Image width={200} src={currentImage.image} />
            <div className={styles["details-item-prompt"]}>
              <div className={styles["details-item-prompt-title"]}>Prompt</div>
              <div className={styles["details-item-prompt-data"]}>
                {currentImage.prompt}
              </div>
            </div>
            <div className={styles["details-item-prompt"]}>
              <div className={styles["details-item-prompt-title"]}>
                3DF Score
              </div>
              <div className={styles["details-item-prompt-data"]}>
                {currentImage.ThreeD_suitable_score}
              </div>
            </div>
          </div>
        )}
      </div>
      <svg
        width={width}
        height={height}
        style={{
          maxWidth: "100%",
          height: "auto",
          overflow: "hidden",
          opacity: isShowOverlay ? "0" : "100%",
          outline: "none",
        }}
        ref={$container}
      >
        {image_candidates.slice(0, 100).map((node, index) => {
          return (
            <SatelliteChart
              key={index}
              node={node}
              x={xScale(node.x)}
              y={yScale(node.y)}
              transform={transform}
              onMouseOver={onMouseOver}
              onMouseOut={onMouseOut}
              onClick={onClick}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default ImageBrowser;
