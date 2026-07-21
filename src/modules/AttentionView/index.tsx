import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import styles from "./index.module.scss";
import * as d3 from "d3";

const DefaultWidth = 400;
const height = 500;
const imgWidth = 50;
const textWidth = 60;
const nodeWidth = 8;

const RULE_SHORT = [
  "CompID","Spatial","RoofSup","ColGrnd","BasePlat","Persp",
  "TimbrRf","CoreComp","AntiMod","VolStab","BridgeW","StoryCt",
  "StreetI","Courtyd","Height","Landmk","SctrInf","AntiUrb","BridgeS"
];

const AttentionView = () => {
  const $container = useRef<any>(null);
  const [width, setWidth] = useState<number>(DefaultWidth);
  const [hoverItem, setHoverItem] = useState<any>();
  const [threshold, setThreshold] = useState<number>(0.5);
  const [vlmSankeyData, setVlmSankeyData] = useState<{
    texts: string[]; imgs: string[]; data: [string,string,number][]; ranges: number[];
  }>({ texts: [], imgs: [], data: [], ranges: [] });
  const { selectedImageId } = useSelector((state: RootState) => {
    return state.parameter;
  });

  // Load real VLM fidelity data
  useEffect(() => {
    if (!selectedImageId) {
      setVlmSankeyData({ texts: [], imgs: [], data: [], ranges: [] });
      return;
    }
    const sid = String(selectedImageId).padStart(6, "0");
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/${sid}_fidelity_scores.json`).then(r => r.json()),
    ]).then(([fidelityJson]: any) => {
      // Get all rounds, sort by overall_fidelity descending, take top 6
      const rounds = Object.entries(fidelityJson) as [string, any][];
      const top6 = rounds
        .sort((a, b) => b[1].overall_fidelity - a[1].overall_fidelity)
        .slice(0, 6);

      const imgs: string[] = [];
      const data: [string, string, number][] = [];

      top6.forEach(([roundLabel, roundData]) => {
        imgs.push(roundLabel);
        roundData.fidelity_scores.forEach((score: number, ruleIdx: number) => {
          if (score > 0) {
            data.push([RULE_SHORT[ruleIdx], roundLabel, score]);
          }
        });
      });

      const ranges = data.map(d => d[2]);
      setVlmSankeyData({
        texts: [...RULE_SHORT],
        imgs,
        data,
        ranges: ranges.length > 0 ? ranges : [0, 5],
      });
    }).catch(() => {
      setVlmSankeyData({ texts: [], imgs: [], data: [], ranges: [] });
    });
  }, [selectedImageId]);

  const { texts, imgs, ranges = [], data } = vlmSankeyData;

  useEffect(() => {
    if (ranges && ranges.length > 0) {
      const min = Math.min(...ranges);
      const max = Math.max(...ranges);
      setThreshold((min + max) / 1.6);
    }
  }, [selectedImageId]);

  // Filter data based on threshold
  const filteredData = useMemo(() => 
    data ? data.filter((item: any) => item[2] >= threshold) : [],
    [data, threshold]
  );

  // Calculate node positions and heights for proper sankey layout
  const sankeyLayout = useMemo(() => {
    if (!filteredData || !texts || !imgs) return null;

    // Calculate total weights for each node
    const textTotals: { [key: string]: number } = {};
    const imgTotals: { [key: string]: number } = {};

    texts.forEach((text: string) => {
      textTotals[text] = 0;
    });
    imgs.forEach((img: string) => {
      imgTotals[img] = 0;
    });

    filteredData.forEach((item: any) => {
      textTotals[item[0]] += item[2];
      imgTotals[item[1]] += item[2];
    });

    // Fixed space allocation
    const availableHeight = height - 60; // Leave margin top and bottom
    const nodeSpacing = 15; // Fixed spacing between nodes
    
    // Calculate weights for proportional space allocation
    const maxTextTotal = Math.max(...Object.values(textTotals), 0.001);
    const maxImgTotal = Math.max(...Object.values(imgTotals), 0.001);
    
    // Calculate proportional heights but ensure minimum size
    const minNodeHeight = 200;
    const textHeights: { [key: string]: number } = {};
    const imgHeights: { [key: string]: number } = {};
    
    // Calculate total space needed for proportional allocation
    let totalTextSpace = 0;
    let totalImgSpace = 0;
    
    texts.forEach((text: string) => {
      const proportionalHeight = Math.max(minNodeHeight, (textTotals[text] / maxTextTotal) * 80 + minNodeHeight);
      textHeights[text] = proportionalHeight;
      totalTextSpace += proportionalHeight;
    });
    
    imgs.forEach((img: string) => {
      const proportionalHeight = Math.max(minNodeHeight, (imgTotals[img] / maxImgTotal) * 80 + minNodeHeight);
      imgHeights[img] = proportionalHeight;
      totalImgSpace += proportionalHeight;
    });
    
    // Scale down if total space exceeds available space
    const textAvailableSpace = availableHeight - (texts.length - 1) * nodeSpacing;
    const imgAvailableSpace = availableHeight - (imgs.length - 1) * nodeSpacing;
    
    const textScale = totalTextSpace > textAvailableSpace ? textAvailableSpace / totalTextSpace : 1;
    const imgScale = totalImgSpace > imgAvailableSpace ? imgAvailableSpace / totalImgSpace : 1;
    
    // Apply scaling
    texts.forEach((text: string) => {
      textHeights[text] *= textScale;
    });
    imgs.forEach((img: string) => {
      imgHeights[img] *= imgScale;
    });

    // Calculate positions for text nodes with intelligent space allocation
    const textPositions: { [key: string]: { y: number, height: number, segments: any[] } } = {};
    const imgPositions: { [key: string]: { y: number, height: number, segments: any[] } } = {};

    // Position text nodes with proportional space distribution
    let currentY = 50;
    texts.forEach((text: string) => {
      textPositions[text] = {
        y: currentY,
        height: textHeights[text],
        segments: []
      };
      currentY += textHeights[text] + nodeSpacing;
    });

    // Position image nodes with proportional space distribution
    currentY = 50;
    imgs.forEach((img: string) => {
      imgPositions[img] = {
        y: currentY,
        height: imgHeights[img],
        segments: []
      };
      currentY += imgHeights[img] + nodeSpacing;
    });

    // Calculate segments within each node (proportional to weight within fixed height)
    texts.forEach((text: string) => {
      let segmentY = 0;
      const connections = filteredData.filter((item: any) => item[0] === text);
      const totalWeight = textTotals[text];
      
      connections.forEach((connection: any) => {
        // Each segment takes proportional space within the fixed node height
        const segmentHeight = totalWeight > 0 ? (connection[2] / totalWeight) * textPositions[text].height : 0;
        textPositions[text].segments.push({
          target: connection[1],
          weight: connection[2],
          y: segmentY,
          height: segmentHeight,
          connection: connection
        });
        segmentY += segmentHeight;
      });
    });

    imgs.forEach((img: string) => {
      let segmentY = 0;
      const connections = filteredData.filter((item: any) => item[1] === img);
      const totalWeight = imgTotals[img];
      
      connections.forEach((connection: any) => {
        // Each segment takes proportional space within the fixed node height
        const segmentHeight = totalWeight > 0 ? (connection[2] / totalWeight) * imgPositions[img].height : 0;
        imgPositions[img].segments.push({
          source: connection[0],
          weight: connection[2],
          y: segmentY,
          height: segmentHeight,
          connection: connection
        });
        segmentY += segmentHeight;
      });
    });

    return { textPositions, imgPositions };
  }, [filteredData, texts, imgs]);

  // Enhanced color schemes
  const connectionColorScale = d3.scaleSequential()
    .domain(ranges.length > 0 ? [Math.min(...ranges), Math.max(...ranges)] : [0, 1])
    .interpolator(d3.interpolateViridis);

  const keywordColorScale = useMemo(() => {
    const keywordMaxWeights: { [key: string]: number } = {};
    filteredData.forEach((item: any) => {
      const [text, , weight] = item;
      keywordMaxWeights[text] = Math.max(keywordMaxWeights[text] || 0, weight);
    });
    
    return (text: string) => connectionColorScale(keywordMaxWeights[text] || 0);
  }, [filteredData, connectionColorScale]);

  // Create sankey path between segments
  const createSankeyPath = useCallback((x1: number, y1: number, height1: number, x2: number, y2: number, height2: number) => {
    const controlOffset = Math.min(120, (x2 - x1) * 0.7);
    
    return `M ${x1} ${y1}
            L ${x1} ${y1 + height1}
            C ${x1 + controlOffset} ${y1 + height1}, 
              ${x2 - controlOffset} ${y2 + height2}, 
              ${x2} ${y2 + height2}
            L ${x2} ${y2}
            C ${x2 - controlOffset} ${y2}, 
              ${x1 + controlOffset} ${y1}, 
              ${x1} ${y1}
            Z`;
  }, []);

  const onHover = useCallback((item: any) => {
    setHoverItem(item);
  }, []);

  const onHoverOut = useCallback(() => {
    setHoverItem(undefined);
  }, []);

  useEffect(() => {
    const dom = document.querySelector("#attention-view");
    dom?.clientWidth && setWidth(dom?.clientWidth);
  }, []);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setThreshold(Number(event.target.value));
  };

  // 专业响应式布局 - 使用百分比而不是硬编码像素
  const legendWidth = width * 0.10; // 15%的宽度作为图例区
  const contentWidth = width * 0.90; // 85%的内容区
  
  // 图例内部布局比例
  const legendPadding = legendWidth * 0.05;
  const gradientWidth = legendWidth * 0.25;
  const legendCenterX = contentWidth + legendWidth * 0.5;

  return (
    <div className={styles["attention-panel"]}>
      <h2>Keyword Contribution</h2>

      {/* Enhanced Legend with Gradient */}
      <div className={styles["legend-wrap"]} style={{ position: "relative" }}>
        <div
          className={styles["legend"]}
          style={{
            // background: `linear-gradient(to right, 
            //   ${d3.interpolateViridis(0)}, 
            //   ${d3.interpolateViridis(0.25)}, 
            //   ${d3.interpolateViridis(0.5)}, 
            //   ${d3.interpolateViridis(0.75)}, 
            //   ${d3.interpolateViridis(1)})`,
            height: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}
        ></div>

        <input
          type="range"
          min={ranges.length > 0 ? Math.min(...ranges).toFixed(2) : 0}
          max={ranges.length > 0 ? Math.max(...ranges).toFixed(2) : 1}
          step="0.01"
          value={threshold}
          onChange={handleSliderChange}
          style={{
            width: "100%",
            position: "absolute",
            top: "0",
            left: "0",
            height: "20px",
            zIndex: 2,
            pointerEvents: "all",
            opacity: 0.8
          }}
        />

        {ranges.length > 0 && (
          <div className={styles["legend-label"]} style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
            <span style={{ fontSize: "12px", color: "#666" }}>{Math.min(...ranges).toFixed(2)}</span>
            <span style={{ fontSize: "12px", color: "#666" }}>Attention Weight</span>
            <span style={{ fontSize: "12px", color: "#666" }}>{Math.max(...ranges).toFixed(2)}</span>
          </div>
        )}
      </div>
      
      <div className={styles["result-details"]} id="attention-view">
        {sankeyLayout && (
          <svg
            width={width}
            height={height}
            style={{
              maxWidth: "100%",
              overflow: "hidden",
            }}
            ref={$container}
          >
            {/* Define gradients for connections */}
            <defs>
              {filteredData.map((item: any, index: number) => (
                <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={connectionColorScale(item[2]) as string} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={connectionColorScale(item[2]) as string} stopOpacity="0.8" />
                </linearGradient>
              ))}
            </defs>

            {/* Text nodes (left side) */}
            <g>
              {texts.map((text: string) => {
                const nodeInfo = sankeyLayout.textPositions[text];
                if (!nodeInfo) return null;
                
                return (
                  <g key={text}>
                    {/* Node rectangle */}
                    <rect
                      x={textWidth}
                      y={nodeInfo.y}
                      width={nodeWidth}
                      height={nodeInfo.height}
                      fill={keywordColorScale(text) as string}
                      rx={4}
                      opacity={hoverItem === text ? 1 : 0.8}
                      onMouseOver={() => onHover(text)}
                      onMouseLeave={() => onHoverOut()}
                      style={{ 
                        cursor: "pointer",
                        filter: hoverItem === text ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" : "none",
                        transition: "all 0.3s ease"
                      }}
                    />
                    {/* Text label - split into round + constraint */}
                    <text
                      x={textWidth - 6}
                      y={nodeInfo.y + nodeInfo.height / 2 - 6}
                      dy="0.35em"
                      fontSize="11px"
                      fontWeight="700"
                      fill="#333"
                      textAnchor="end"
                      onMouseOver={() => onHover(text)}
                      onMouseLeave={() => onHoverOut()}
                      style={{ cursor: "pointer" }}
                    >
                      {text.split(":")[0] || text}
                    </text>
                    <text
                      x={textWidth - 6}
                      y={nodeInfo.y + nodeInfo.height / 2 + 8}
                      dy="0.35em"
                      fontSize="9px"
                      fontWeight="400"
                      fill="#666"
                      textAnchor="end"
                      onMouseOver={() => onHover(text)}
                      onMouseLeave={() => onHoverOut()}
                      style={{ cursor: "pointer" }}
                    >
                      {(text.split(":").slice(1).join(":") || "").length > 30
                        ? text.split(":").slice(1).join(":").substring(0, 27) + "..."
                        : text.split(":").slice(1).join(":") || ""}
                    </text>
                  </g>
                );
              })}
            </g>
            
            {/* Round nodes (right side) */}
            <g>
              {imgs.map((img: string) => {
                const nodeInfo = sankeyLayout.imgPositions[img];
                if (!nodeInfo) return null;

                // Determine color based on risk score (from data connections)
                const connectedData = data.filter((d: any) => d[1] === img);
                const avgRisk = connectedData.length > 0
                  ? connectedData.reduce((s: number, d: any) => s + d[2], 0) / connectedData.length
                  : 3;
                const nodeColor = avgRisk <= 2 ? "#52c41a" : avgRisk <= 3 ? "#faad14" : "#ff4d4f";

                return (
                  <g key={img}>
                    {/* Node rectangle */}
                    <rect
                      x={contentWidth - 40}
                      y={nodeInfo.y}
                      width={45}
                      height={nodeInfo.height}
                      fill={nodeColor}
                      rx={4}
                      opacity={hoverItem === img ? 1 : 0.7}
                      onMouseOver={() => onHover(img)}
                      onMouseLeave={() => onHoverOut()}
                      style={{
                        cursor: "pointer",
                        filter: hoverItem === img ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" : "none",
                        transition: "all 0.3s ease"
                      }}
                    />
                    {/* Round label */}
                    <text
                      x={contentWidth - 10}
                      y={nodeInfo.y + nodeInfo.height / 2}
                      dy="0.35em"
                      fontSize="11px"
                      fontWeight="700"
                      fill="#fff"
                      textAnchor="end"
                      onMouseOver={() => onHover(img)}
                      onMouseLeave={() => onHoverOut()}
                      style={{
                        cursor: "pointer",
                        opacity: hoverItem === img ? 1 : 0.9
                      }}
                    >
                      {img}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Sankey flow connections */}
            <g>
              {texts.map((text: string) => {
                const textNode = sankeyLayout.textPositions[text];
                if (!textNode) return null;

                return textNode.segments.map((segment: any, segIndex: number) => {
                  const imgNode = sankeyLayout.imgPositions[segment.target];
                  if (!imgNode) return null;

                  // Find corresponding segment in target node
                  const targetSegment = imgNode.segments.find((s: any) => s.source === text);
                  if (!targetSegment) return null;

                  const x1 = textWidth + nodeWidth;
                  const y1 = textNode.y + segment.y;
                  const height1 = segment.height;
                  
                  const x2 = contentWidth - 40;
                  const y2 = imgNode.y + targetSegment.y;
                  const height2 = targetSegment.height;

                  const connectionIndex = filteredData.findIndex((item: any) => 
                    item[0] === text && item[1] === segment.target
                  );

                  return (
                    <path
                      key={`${text}-${segment.target}-${segIndex}`}
                      d={createSankeyPath(x1, y1, height1, x2, y2, height2)}
                      fill={`url(#gradient-${connectionIndex})`}
                      opacity={
                        (text === hoverItem ||
                        segment.target === hoverItem ||
                        !hoverItem
                          ? 0.7
                          : 0.2)
                      }
                      onMouseOver={() => onHover(text)}
                      onMouseLeave={() => onHoverOut()}
                      style={{
                        cursor: "pointer",
                        transition: "opacity 0.3s ease",
                        filter: (text === hoverItem || segment.target === hoverItem) ? 
                          "drop-shadow(0 2px 6px rgba(0,0,0,0.2))" : "none"
                      }}
                    />
                  );
                });
              })}
            </g>

            {/* Professional Responsive Color Legend */}
            {ranges.length > 0 && (
              <g>
                {/* Legend container - responsive positioning */}
                <rect
                  x={contentWidth + legendPadding}
                  y={height * 0.1}
                  width={legendWidth - 2 * legendPadding}
                  height={440}
                  rx={legendWidth * 0.05}
                  stroke="rgba(0, 0, 0, 0.08)"
                  strokeWidth={1}
                  fill="#f8f9fa"
                />
                
                {/* Legend title - auto-centered */}
                <text
                  x={legendCenterX}
                  y={height * 0.15}
                  fontSize={Math.max(8, legendWidth * 0.12)}
                  fontWeight="600"
                  fill="#2c3e50"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  Weight
                </text>
                
                {/* Vertical gradient bar - centered */}
                <defs>
                  <linearGradient id="vertical-legend-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor={d3.interpolateViridis(0)} />
                    <stop offset="25%" stopColor={d3.interpolateViridis(0.25)} />
                    <stop offset="50%" stopColor={d3.interpolateViridis(0.5)} />
                    <stop offset="75%" stopColor={d3.interpolateViridis(0.75)} />
                    <stop offset="100%" stopColor={d3.interpolateViridis(1)} />
                  </linearGradient>
                </defs>
                
                <rect
                  x={legendCenterX - gradientWidth * 0.5}
                  y={110}
                  width={gradientWidth}
                  height={340}
                  fill="url(#vertical-legend-gradient)"
                  rx={gradientWidth * 0.2}
                  stroke="rgba(0, 0, 0, 0.1)"
                  strokeWidth={0.5}
                />
                
                {/* High value label - above gradient bar */}
                <text
                  x={legendCenterX}
                  y={height * 0.18}
                  fontSize={Math.max(9, legendWidth * 0.12)}
                  fill="#2c3e50"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontWeight="500"
                >
                  {Math.max(...ranges).toFixed(2)}
                </text>
                
                {/* Low value label - below gradient bar */}
                <text
                  x={legendCenterX}
                  y={height * 0.93}
                  fontSize={Math.max(9, legendWidth * 0.12)}
                  fill="#2c3e50"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontWeight="500"
                >
                  {Math.min(...ranges).toFixed(2)}
                </text>

                {/* Arrow pointing to connections - responsive */}
                <path
                  d={`M ${contentWidth + legendPadding} ${height * 0.5} L ${contentWidth} ${height * 0.5 - legendWidth * 0.05} L ${contentWidth} ${height * 0.5 + legendWidth * 0.05} Z`}
                  fill="rgba(52, 73, 94, 0.6)"
                />
              </g>
            )}
          </svg>
        )}
      </div>
    </div>
  );
};

export default AttentionView;
