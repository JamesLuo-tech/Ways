<!-- Last verified: 2026-04-23 | Source: wiki/86-first-version-feedback-todo.md -->

# 三个 Agent 分工文档

> 目的：把 `第一版修改意见 TODO` 拆成 3 个可并行执行的任务包，方便直接交给 3 个 agent。

## 总原则

- 3 个 agent 之间尽量不改同一批文件
- Agent 1 先定产品与数据契约，Agent 2 / 3 再分别做页面与链路
- 任何“待确认”项都先收口，再进入实现
- 输出结果优先是文档 / 规格 / 页面结构，而不是直接改代码

## Agent 1：产品定义与数据契约

### 任务范围

- 负责收口首页主交互、`Explore` 弹窗是否保留、`Profile` 定位等产品决策
- 负责定义用户主页、旅行档案、Spot 内容流、EXIF 导入的对象关系
- 负责定义热度口径、自动归档规则、权限与隐私边界
- 负责产出可供后续开发使用的数据模型与接口草案

### 对应 TODO

- `P0：先确认的产品决策`
- `数据与实现支撑`
- `Plan / 规划` 中的 `AI 路线规划助手`
- `Plan / 规划` 中的 `增加行程变更时的替代点位推荐`

### 交付物

- 一份产品决策收口文档
- 一份数据模型草案
- 一份接口 / 对象关系说明
- 一份后续开发可直接引用的术语表
- 已交付：`wiki/88-agent1-product-data-contract.md`

### 约束

- 不直接做页面重构
- 不直接改现有地图实现
- 不修改与页面视觉强相关的组件，避免和其他 agent 冲突

## Agent 2：Explore 内容流改版

### 任务范围

- 负责 `Explore` 页从“单地点详情”改为“内容流 + 博主主页跳转”
- 负责 Spot 弹窗重做为更像内容卡片的展示方式
- 负责设计“从内容进入博主主页”“从内容快速收藏”“长按节点快速规划”等交互
- 负责热门路线图层 / 筛选的前端表现方案

### 对应 TODO

- `Explore / 首页探索`
- `Plan / 规划` 中的 `为 Wishlist 增加“从内容到路线”的转化入口`

### 交付物

- `Explore` 页改版方案
- Spot 弹窗内容结构方案
- 博主主页跳转与收藏闭环说明
- 热门路线展示策略草案
- 已交付：`wiki/89-agent2-explore-content-flow.md`

### 约束

- 不修改 `Profile` 的信息架构
- 不修改 `Tracker` 的导入链路
- 不直接定义最终数据模型，优先引用 Agent 1 的契约

## Agent 3：Profile / Tracker / Wishlist 沉淀链路

### 任务范围

- 负责把 `我的` 页增强为旅行档案库
- 负责把照片 EXIF 导入和轨迹回收变成资产沉淀流程
- 负责 Wishlist 的自动归类与收藏后整理体验
- 负责对接旅行档案封面、路线签名、个人资料编辑入口

### 对应 TODO

- `Profile / 我的`
- `Tracker / 记录`
- `Plan / 规划` 中的 `强化 Wishlist 的“自动归类”`

### 交付物

- `Profile` 改版方案
- 旅行档案 feed / 详情页结构
- EXIF 导入到旅行档案的流程说明
- Wishlist 自动归类规则草案
- 已交付：`wiki/89-agent3-profile-tracker-wishlist.md`

### 约束

- 不改 `Explore` 主交互
- 不和 Agent 2 争抢 Spot 内容流的定义权
- 以 Agent 1 的数据契约为准

## 推荐执行顺序

1. 先跑 Agent 1，先把产品边界定下来
2. Agent 2 与 Agent 3 可以并行，但都要基于 Agent 1 的产物
3. 如果时间紧，优先让 Agent 2 先出 Explore 改版方案，因为它影响用户第一感知

## 可直接复制给 agent 的简述

- Agent 1：负责产品定义与数据契约收口，不做页面实现。
- Agent 2：负责 Explore 内容流改版、Spot 弹窗、博主主页跳转与热门路线展示。
- Agent 3：负责 Profile/Tracker/Wishlist 的资产沉淀链路，包括旅行档案与 EXIF 导入。
