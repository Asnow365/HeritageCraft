import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import styles from "./index.module.scss";
import * as d3 from "d3";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch, RootState } from "../../store";
import { Spin, message } from "antd";
import React from "react";
import useDataProcess from "../../models/useDataProcess";

const radiusFactor = 1;
const width = 200;
const height = width;
const innerRadius = 30 * radiusFactor;
const margin = 15;
const outerRadius = (width / 2 - margin) * radiusFactor;
const imgWidth = innerRadius * 0.8;
const pImgWidth = imgWidth * 1.5;
const color = d3.scaleSequential()
  .domain([0, 4]) // index: 0~4 共5个圈
  .interpolator(t => d3.interpolateBlues(t * 0.8));
interface SatelliteChartProps {
  node: any;
  x: number;
  y: number;
  transform: any;
  onMouseOver: (node: any) => void;
  onMouseOut: (node: any) => void;
  onClick: (node: any) => void;
}

const SatelliteChart = (props: SatelliteChartProps) => {
  const { node, x, y, transform, onMouseOver, onMouseOut, onClick } = props;
  // 根据 transform.k 和 node.ThreeD_suitable_score 计算卫星图的缩放比例
  const scale = transform.k * node.ThreeD_suitable_score  * 0.4;
  const { hoverWord, selectedImageId } = useSelector((state: RootState) => {
    return state.parameter;
  });
  const dataUtil = useDataProcess();
  const { perspectiveImages, maxRadius, minRadius } = useMemo(
    () => dataUtil.getPerspectiveImages(node.id),
    [node, dataUtil]
  );
  const isUnsuitable = useMemo(
    () => node.ThreeD_suitable_score  < 0.6,
    [node]
  );

  const angleScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, 360])
        .range([0, 2 * Math.PI]),
    []
  );

  const radiusScale = useMemo(() => {
    return d3
      .scaleRadial()
      .domain([maxRadius, minRadius])
      .range([innerRadius, outerRadius]);
  }, []);

  return (
    <g
      style={{
        // width: width,
        // height: width,
        maxWidth: "100%",
        font: "10px sans-serif",
      }}
      transform={`translate(${x}, ${y}) scale(${
        transform.k * 0.4 * node.ThreeD_suitable_score
      })`}
    >
      {/* circular coordinate */}
      <g className="circular-coor" textAnchor="middle">
        {radiusScale
          .ticks(5)
          .reverse()
          .map((r: any, index: number) => {
            return (
              <React.Fragment key={index}>
                <circle
                  stroke={color(index)}
                  //strokeOpacity={0.8} // 降低不透明度（0.6 = 60%）
                  strokeWidth={1}
                  r={radiusScale(r)}
                  fill={isUnsuitable && index == 0 ? "grey" : "none"}
                  opacity={isUnsuitable && index == 0 ? 0.2 : 1}
                ></circle>
                <text
                  dy="0.3em"
                  fill="#555"
                  opacity={isUnsuitable ? 0.5 : 1}
                  stroke="#FFF"
                  strokeWidth={1.5}
                  fontSize={6}
                  fontWeight="bold"
                  paintOrder="stroke"
                  transform={`translate(${d3.pointRadial(
                    angleScale(150),
                    -radiusScale(r)
                  )})`}
                >
                  {r.toFixed(2)}
                </text>
              </React.Fragment>
            );
          })}
      </g>
      {/* angular coordinate */}
      <g className="angluar-coor">
        {[0, 90, 180, 270].map((a: any, index: number) => {
          return (
            <React.Fragment key={index}>
              <path
                stroke="#D8D8D8"
                d={`
                  M${d3.pointRadial(angleScale(a), innerRadius)}
                  L${d3.pointRadial(angleScale(a), outerRadius)}
                `}
              ></path>
              <text
                fontSize={8}
                fill="#555"
                transform={`translate(${d3.pointRadial(
                  angleScale(a),
                  outerRadius + (
                    a === 270 ? 25 :  // 270度外扩25
                    a === 180 ? 12 :  // 180度外扩15
                    8                // 其他角度外扩8
                  )
                )})`}
              >{`${a}°`}</text>
            </React.Fragment>
          );
        })}
      </g>
      {/* center image */}
      <g
        className="center-image"
        style={{ cursor: "pointer" }}
        onMouseOver={() => onMouseOver(node)}
        onMouseOut={onMouseOut}
        onClick={() => {
          if (isUnsuitable) {
            message.info("Not Recommended To Generate 3D Model!");
          }
          onClick(node);
        }}
      >
        <defs>
          <mask id="circle-mask">
            <circle r={imgWidth} fill="white" />
          </mask>
        </defs>
        <image
          href={node.image}
          x={-imgWidth}
          y={-imgWidth}
          width={imgWidth * 2}
          height={imgWidth * 2}
          mask="url(#circle-mask)"
        ></image>
        <circle
          r={imgWidth}
          fill={
            isUnsuitable
              ? "grey"
              : "none"
          }
          opacity={isUnsuitable ? 0.2 : 0}
          style={{
            display:
              (hoverWord && node.prompt.search(hoverWord) !== -1) ||
              (selectedImageId && selectedImageId === node.id) ||
              isUnsuitable
                ? "block"
                : "none",
          }}
        />
      </g>
      {/* perspective images */}
      <g className="perspective">
        {perspectiveImages?.map((item: any, index: number) => {
          return (
            <g
              key={index}
              transform={`translate(${d3.pointRadial(
                angleScale(item.angle ?? 0),
                radiusScale(item.value ?? 0)
              )})`}
            >
              <defs>
                <mask id="circle-mask2">
                  <circle r={pImgWidth * 0.8} fill="white" />
                </mask>
              </defs>

              <image
                opacity={isUnsuitable ? 0.5 : 1}
                href={item.image}
                x={-pImgWidth}
                y={-pImgWidth}
                width={pImgWidth * 2}
                height={pImgWidth * 2}
                mask="url(#circle-mask2)"
              ></image>
            </g>
          );
        })}
      </g>
      </g>
  );
};

export default SatelliteChart;
