# A31 Frontend: 3D Generation Failure Learning Visualization

🌐 **在线演示**：[https://asnow365.github.io/HeritageCraft/](https://asnow365.github.io/HeritageCraft/)

前端可视化面板，用于展示 [A31]("https://github.com/") 项目的 3D 生成管线运行结果。

## 功能模块

- **Image Browser** — 样本散点图浏览器，展示各样本的生成结果分布
- **3D Viewer** — 基于 Three.js 的 GLB 模型查看器，支持 OrbitControls 交互
- **Text Exploration** — 关键词词云 + 树图，展示标签和评估维度分布
- **Parallel Coordinates** — 平行坐标图，展示多维度质量指标
- **Attention View** — Sankey 图，展示关键词与生成结果的关联权重
- **Reasons** — 分页展示每个样本的检查评估理由

## 系统要求

- Node.js >= 16.x
- npm >= 7.x
- 支持 WebGL 的现代浏览器

## 安装与运行

```bash
npm install
npm run dev
```

应用运行在 `http://localhost:6006`。

## 数据源

前端通过 Vite dev server 代理加载 A31 pipeline 产出的 artifacts 文件：
- `trajectories.jsonl` — 生成轨迹
- `failures.jsonl` — 失败签名
- `prototypes.jsonl` — 原型记忆
- `summary.json` — 运行统计

## 项目结构

```
src/
├── App.tsx                    # 应用入口
├── modules/                   # 可视化模块
│   ├── ImageBrowser/         # 散点图浏览器
│   ├── LocalExploration/     # 3D 查看器
│   ├── TextExploration/      # 词云 + 树图
│   ├── ParallelPanel/        # 平行坐标
│   ├── AttentionView/        # Sankey 注意力图
│   ├── Reasons/              # 评估理由
│   └── ParameterConfigration/# 参数配置
├── types/                     # TypeScript 类型定义
├── services/                  # 数据加载服务
├── models/                    # Redux 状态管理
└── assets/                    # 静态资源
```
