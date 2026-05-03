<!-- Last verified: 2026-04-23 | Source: wiki/86-first-version-feedback-todo.md + wiki/87-three-agent-work-plan.md -->

# Agent 3 — Profile / Tracker / Wishlist 沉淀链路

> 目的：承接第一版修改意见中归属 Agent 3 的任务，把 `我的`、`记录`、`规划` 三条链路统一到“旅行档案沉淀”方向，避免 Profile 只停留在展示页、Tracker 只停留在工具页、Wishlist 收藏后吃灰。

## 任务边界

### 本轮负责

- `Profile / 我的`：以 `TravelArchive` 为第一对象，现阶段由 `FootprintJourney` 摘要层承接旅行档案卡
- `Tracker / 记录`：照片 EXIF 导入、轨迹回收、标签点评要能持续刷新旅行档案摘要
- `Plan / 规划`：强化 Wishlist 的自动归类与收藏后整理体验

### 本轮不负责

- 不改 `Explore` 主交互，不重做 Spot 内容流
- 不定义最终后端 schema，沿用 Agent 1 的 `TravelArchive / MediaAsset / SpotContent` 契约
- 不做 AI 路线规划助手和替代点位推荐，这两项仍属于 Agent 1 后续产品定义

## Profile 改版方案

Profile 的主对象从“个人主页信息”收敛为“旅行档案库”：

| 层级 | 当前实现 | 中期目标 |
|------|----------|----------|
| 顶部统计 | 个人资料头 + Journey / Distance / Spot / Photo | 用户旅行资产总览 |
| 档案列表 | `FootprintJourney` 档案墙 / 时间轴 | `TravelArchive` feed |
| 档案封面 | 路线缩略线 + 指标 + 标签 | 帖子式封面 + Route Signature |
| 档案详情 | 当前未拆分二级页 | 停留节点、照片内容、路线签名、分享入口 |
| 海报 | 应用内预览 + 系统分享文案 | 可导出图片的动态海报 |

当前 `FootprintJourney` 继续作为 `TravelArchive` 的前端摘要层，不新增独立 mock 数据。

当前实现允许“视觉上更像内容主页”，但仍然不引入关注、评论、粉丝数等社交结构。

## 旅行档案 Feed / 详情结构

### Feed 卡片

Feed 卡片至少展示：

- 标题：默认由记录日期生成，例如 `4月23日的足迹`
- 地区：当前先显示 session 质心经纬度，后续替换为逆地理编码结果
- 时间范围：`startedAt` / `endedAt`
- Route Signature：由 `TrackSession.routePreview` 自绘生成
- 统计：距离、时长、地点簇、照片数
- 亮点标签：由当前 session 下所有 `PhotoCluster.tags` 去重汇总

### 详情页草案

详情页后续按三段组织：

1. `Archive Header`：封面、标题、地区、时间、路线签名
2. `Archive Stops`：按照片簇或路线停留点生成的停留节点
3. `Content Drafts`：由 EXIF 图片生成的 `SpotContent draft`，用户确认后再发布或隐藏

## EXIF 导入到旅行档案流程

当前端侧流程：

1. 用户在 `Tracker` 页导入照片
2. `buildPhotoInputs()` 只保留带 EXIF 经纬度的图片
3. `clusterPhotos()` 按 180m 阈值生成 `PhotoCluster`
4. `buildTrackSession()` 或 session snapshot 汇总轨迹、照片簇、标签、路线缩略线和质心
5. `Profile` 直接从 `trackerStore.sessions` 派生 `FootprintJourney`

必须保持的同步规则：

- 导入新照片后，当前 session 的 `clusterCount / photoCount / tags / centroid` 要同步刷新
- 用户修改 cluster 标签后，当前 session 的 `tags` 要同步刷新
- 后续引入 `MediaAsset` 时，默认仍只在端侧解析 EXIF，不自动上传精确坐标

### Profile 照片导入入口

`Profile` 现在也暴露 `导入照片` 入口，调用 `trackerStore.importPhotosAsArchive()`，允许用户不先开启轨迹记录，直接从苹果照片的 EXIF 时间与位置生成本地 `TrackSession` 草稿：

- `sourceType = photo_import`
- `archiveStatus = draft`
- `points = []`，但 `PhotoCluster` 会提供 `clusterCount / photoCount / centroid`
- `Profile` 仍从 `trackerStore.sessions` 派生 `FootprintJourney`，并在档案墙上标记草稿和照片导入来源
- 该草稿默认只存在本地，不自动公开为 `SpotContent`

## Wishlist 自动归类规则

目标是解决“收藏后吃灰”：用户进入 `Plan` 页时，不只看到平铺收藏列表，而是先看到可整理的目的地区块。

### 当前端侧规则

| 层级 | 当前来源 | 说明 |
|------|----------|------|
| 省份 | `SpotPreview.region.province` 优先，坐标启发式兜底 | 后续接逆地理编码时只需写入 region |
| 城市 | `SpotPreview.region.city` 优先，坐标启发式兜底 | 支持昆明 / 云南等真实行政区直接展示 |
| 地区 | `region.area` / `region.district` 优先，坐标桶兜底 | 用于把近距离收藏点聚成可行动的小组 |

### 分组展示

每个分组展示：

- 地区名，例如 `浙江 · 杭州 · 西湖西线`
- 收藏点数量
- 主分类摘要，例如 `餐食 2 / 观景 1`
- 组内 Spot 列表
- 一键把该组全部加入路线稿

### 后续升级

- 接入真实逆地理编码后，用行政区和 POI 商圈替换本地坐标桶
- 支持按时间窗口、主题、开闭店状态自动生成路线草案
- 支持将执行后的 `DraftWay` 关联到 `TravelArchive.primaryWayId`

## 当前验收标准

- `Plan` 的 Wishlist tab 从平铺列表升级为自动归类分组
- 每个分组可以一键加入路线稿，已有点位不重复添加
- `Tracker` 标签点评变化能同步到 Profile 的旅行档案标签
- Wiki 同步更新 `Stage B / Stage C / Stage D` 的数据流说明
