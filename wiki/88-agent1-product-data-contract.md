<!-- Last verified: 2026-04-23 | Source: wiki/87-three-agent-work-plan.md -->

# Agent 1 交付：产品决策与数据契约

> 目的：收口 `86-first-version-feedback-todo.md` 中属于 Agent 1 的事项，为 Agent 2 / Agent 3 提供统一的产品边界、对象关系和接口草案。

## 适用范围

- 本文优先解决 `P0：先确认的产品决策`
- 覆盖 `数据与实现支撑`
- 覆盖 `Plan / 规划` 中的 `AI 路线规划助手`
- 覆盖 `Plan / 规划` 中的 `行程变更时的替代点位推荐`
- 不直接改页面视觉，不直接改地图渲染实现

## 一页决策

| 主题 | 决策 | 原因 | 对后续工作的约束 |
|------|------|------|----------------|
| 首页主交互 | `路线优先，内容辅助` | Ways 仍是路线工具，不转成内容平台 | Agent 2 的 `Explore` 改版必须先让用户看到 `Way`，再进入 Spot 内容 |
| `Explore` 底部弹窗 | `保留，但改成内容抽屉` | 保留地图上下文，同时承接 Spot 内容流 | 不做全屏帖子详情页；抽屉内部可横滑内容卡 |
| `Profile` 定位 | `旅行档案库优先，其次才是 feed 感展示` | 保持 Stage D “足迹资产化”方向，不偏成小红书主页 | Agent 3 的 Profile 改版以档案卡和档案详情为主，不做社交主页 |
| 他人主页 / 我的主页 | `共用同一套 UserProfile + TravelArchive 结构` | 后续需要头像跳转、查看他人路线，但不做关注/粉丝体系 | 只区分“本人可编辑”和“访客只可浏览/收藏”两种模式 |
| 热门路线机制 | `热度=收藏 + 打开 + 实际走成 + 新鲜度` 的加权结果 | 不能只看浏览量，否则会持续放大头部路线 | 热门展示只出 `热度档位`，不直接暴露原始分数 |
| 小众可见性 | `热门流` 与 `编辑精选 / 新发现` 并存 | 避免 Explore 被纯热点挤满 | Agent 2 设计筛选时必须保留非热门入口 |
| AI 路线规划 | `助手是 DraftWay 生成器，不是开放聊天入口` | Ways 的核心是帮用户把收藏变成可执行路线 | 输入必须是结构化约束，输出必须回到 `DraftWay` |
| 替代点位推荐 | `规则引擎优先，AI 只负责解释` | 行程变更需要稳定、快、可控 | 替代推荐必须给出可替代理由和距离 / 时段约束 |

## 产品边界

### 保持不变

- Ways 仍然不是社交平台
- 不引入关注、粉丝、评论、私信
- 不引入长文攻略编辑器
- 地图依然承担路线发现和执行入口，不承担社区 feed 首页

### 允许新增

- 轻量用户主页
- 旅行档案卡片流
- Spot 下的轻量内容卡
- 从内容进入路线、从路线进入档案的双向跳转

### 不允许越界

- 不把 `Spot 内容` 扩展成独立帖子系统
- 不让 `Profile` 演化成标准社交主页
- 不让 AI 助手绕开 `Wishlist / DraftWay / Way` 这些现有核心对象

## 对象模型

### 核心对象

| 对象 | 作用 | 关键字段 | 来源 |
|------|------|---------|------|
| `UserProfile` | 统一“我的主页 / 他人主页”资料结构 | `id` `displayName` `avatarUrl` `bio` `homeBase` `stats` `visibility` | 新增 |
| `TravelArchive` | 一次旅行或一次路线执行后的资产容器 | `id` `ownerId` `title` `sourceType` `status` `coverAssetId` `routeSignature` `regionName` `startedAt` `endedAt` `primaryWayId` `stats` | 新增 |
| `ArchiveStop` | 旅行档案中的有序节点，用于详情页和路线签名 | `id` `archiveId` `spotId` `sequence` `coordinate` `arrivedAt` `stayMinutes` | 新增 |
| `SpotContent` | Spot 下的轻量内容卡，不是长帖 | `id` `spotId` `ownerId` `archiveId` `assetIds` `tags` `capturedAt` `visibility` `sourceType` | 新增 |
| `MediaAsset` | 图片资产及其 EXIF / 隐私配置 | `id` `ownerId` `uri` `capturedAt` `exifCoordinate` `sharePrecision` `sourceType` | 新增 |
| `WayHeatSnapshot` | 路线热度快照，只服务排序和筛选 | `wayId` `saveCount30d` `openCount7d` `completionCount30d` `freshnessScore` `editorialBoost` `heatScore` `heatBucket` | 新增 |

### 与现有对象的关系

| 现有对象 | 新契约中的定位 | 后续处理方式 |
|---------|---------------|-------------|
| `Way` | 规划和探索阶段的主对象 | 保留；可被 `TravelArchive.primaryWayId` 引用 |
| `Spot` | 地图节点和内容挂载点 | 保留；`SpotContent` 绑定到 `Spot` |
| `DraftWay` | AI 规划和用户编辑的输出对象 | 保留；AI 助手必须输出到这里 |
| `TrackSession` | 真实执行记录的原始来源 | 保留；可生成 `TravelArchive` 草稿 |
| `PhotoCluster` | EXIF 导入后的中间结果 | 保留；可生成 `SpotContent` 和 `ArchiveStop` 草稿 |
| `FootprintJourney` | 现有 Stage D 列表摘要 | 中期改为 `TravelArchive` 的派生 ViewModel |

## 对象关系

```text
UserProfile 1 ── N TravelArchive
UserProfile 1 ── N SpotContent
TravelArchive 1 ── N ArchiveStop
TravelArchive 1 ── N SpotContent
TravelArchive 0 ── 1 Way (primaryWayId)
Spot 1 ── N SpotContent
Way 1 ── N Spot
TrackSession 0 ── 1 TravelArchive
PhotoCluster 0 ── N SpotContent
MediaAsset N ── 1 SpotContent
```

### 推荐生命周期

| 对象 | 状态 | 说明 |
|------|------|------|
| `TravelArchive` | `draft` / `ready` / `published` / `hidden` | `draft` 可由真实轨迹或手动整理自动生成 |
| `SpotContent` | `draft` / `published` / `hidden` | EXIF 导入后先是 `draft`，用户确认后再公开到 Spot 内容流 |
| `MediaAsset` | `local_only` / `uploaded` / `redacted` | 默认本地解析 EXIF，不自动上传精确坐标 |

## 旅行档案生成规则

### 档案来源

| `TravelArchive.sourceType` | 含义 | 生成方式 |
|---------------------------|------|---------|
| `tracked` | 基于真实 `TrackSession` 的旅行档案 | 用户完成记录后自动生成草稿 |
| `planned` | 基于 `DraftWay` 或现有 `Way` 的手动档案 | 用户在 Profile 中手动创建 |
| `mixed` | 同时含真实轨迹与规划路线 | 用户将 `TrackSession` 关联到一条 `Way` 后生成 |

### 自动生成阈值

- 满足下列任一条件时，可以创建 `TravelArchive draft`
- `TrackSession.distanceMeters >= 1000`
- `TrackSession` 持续时长 >= 30 分钟
- 导入后存在 >= 2 个有效 `PhotoCluster`

### 自动生成后的行为

- 先只在本地创建 `TravelArchive draft`
- 默认不公开，不自动进入他人可见内容流
- 用户可补封面、标题、是否共享 Spot 内容后再发布

## EXIF 导入与隐私边界

### 默认原则

- EXIF 解析默认在端侧完成
- 未经用户确认，不上传精确经纬度
- 未经用户确认，不把图片自动公开到 Spot 内容流

### `MediaAsset.sharePrecision`

| 值 | 含义 | 适用场景 |
|----|------|---------|
| `exact` | 公开 Spot 级位置 | 用户主动公开某个 Spot 内容 |
| `approx` | 仅公开到区域或路线级 | 默认推荐值 |
| `hidden` | 仅自己可见，不带位置信息 | 隐私优先 |

### 用户必须可执行的动作

- 删除单张资产
- 删除位置信息
- 将精确坐标降级为模糊位置
- 将 `SpotContent` 从公开改为隐藏

## 热度口径

### 评分公式

`heatScore = 0.35 * saveCount30d + 0.20 * openCount7d + 0.30 * completionCount30d + 0.10 * freshnessScore + 0.05 * editorialBoost`

### 展示规则

| `heatBucket` | 规则 | 前端展示建议 |
|-------------|------|-------------|
| `emerging` | 最近 14 天新近升温 | 用“新发现”或“升温中” |
| `hot` | 分数稳定处于上层 | 用“热门路线” |
| `classic` | 历史完成率高但近期增速平稳 | 用“经典路线” |

### 约束

- 前端只消费 `heatBucket` 和必要排序字段
- 不展示原始浏览量
- `Explore` 至少保留一个非热度入口，例如 `编辑精选` 或 `小众路线`

## AI 路线规划助手

### 输入

```json
{
  "wishlistSpotIds": ["spot-1", "spot-2"],
  "timeWindow": {
    "start": "2026-05-01T09:00:00+08:00",
    "end": "2026-05-01T18:00:00+08:00"
  },
  "origin": [120.155, 30.274],
  "travelMode": "walk",
  "constraints": {
    "maxDistanceKm": 12,
    "pace": "relaxed",
    "mustIncludeSpotIds": ["spot-1"]
  }
}
```

### 输出

- 产出 1 到 3 个 `DraftWay` 候选

| 输出项 | 说明 |
|--------|------|
| `spots` | 有序 Spot 列表 |
| `distance` / `duration` | 预计距离和时长 |
| `rationale` | 为什么这样排序 |
| `omittedSpotIds` | 被放弃的点及原因 |

### 产品约束

- 不提供开放式闲聊入口
- 不直接生成地图导航路径
- 不覆盖用户已有 `DraftWay`，只生成候选副本

## 行程变更时的替代点位推荐

### 触发条件

- 用户标记某个点 `关闭 / 排队过长 / 天气不适合 / 时间不够`
- 当前路线预计超时
- 当前用户离目标点过远

### 推荐逻辑

1. 规则引擎先筛掉不满足距离、营业时间、主题一致性的点
2. 再按 `Spot category`、当前路线主题、剩余时间做排序
3. 最后可由 AI 生成一段替换理由说明

### 输出结构

```json
{
  "replacements": [
    {
      "spotId": "spot-9",
      "reasonCode": "weather_better_fit",
      "deltaDistanceKm": 1.2,
      "deltaDurationMin": 18,
      "summary": "同属咖啡主题，距离更近，且室内可停留。"
    }
  ]
}
```

## 最小接口草案

| 方法 | 路径 | 用途 |
|------|------|------|
| `GET` | `/api/explore/ways` | 返回带 `heatBucket` 的路线列表 |
| `GET` | `/api/spots/{id}/contents` | 返回 Spot 下的内容卡列表 |
| `GET` | `/api/users/{id}` | 返回用户主页基础信息 |
| `GET` | `/api/users/{id}/archives` | 返回某用户的旅行档案列表 |
| `GET` | `/api/archives/{id}` | 返回旅行档案详情 |
| `POST` | `/api/archives/from-track-session` | 基于 `TrackSession` 生成档案草稿 |
| `POST` | `/api/media/exif/commit` | 用户确认后提交 EXIF 资产及其隐私级别 |
| `POST` | `/api/plan/assist` | 生成 `DraftWay` 候选 |
| `POST` | `/api/plan/replacements` | 返回替代点位建议 |

### `GET /api/spots/{id}/contents`

```json
{
  "items": [
    {
      "id": "content-1",
      "spotId": "spot-1",
      "owner": {
        "id": "user-1",
        "displayName": "Annie"
      },
      "coverAssetUrl": "https://...",
      "capturedAt": "2026-03-22T08:05:00Z",
      "tags": ["逆光友好", "适合停留"],
      "archiveId": "archive-1",
      "visibility": "public"
    }
  ],
  "nextCursor": null
}
```

### `GET /api/users/{id}`

```json
{
  "id": "user-1",
  "displayName": "Annie",
  "avatarUrl": "https://...",
  "bio": "周末短途和咖啡路线采集者",
  "homeBase": "杭州",
  "stats": {
    "archiveCount": 12,
    "distanceKm": 148.2,
    "spotCount": 63,
    "photoCount": 418
  },
  "viewerMode": "self"
}
```

### `GET /api/archives/{id}`

```json
{
  "id": "archive-1",
  "title": "西湖清晨咖啡环线",
  "sourceType": "mixed",
  "status": "published",
  "ownerId": "user-1",
  "primaryWayId": "way-westlake-coffee",
  "coverAssetUrl": "https://...",
  "routeSignature": [[120.143, 30.248], [120.154, 30.254], [120.168, 30.261]],
  "stats": {
    "distanceKm": 8.6,
    "durationHours": 3.5,
    "spotCount": 3,
    "photoCount": 17
  },
  "stops": [],
  "contentPreview": []
}
```

## 术语增补

| 术语 | 定义 | 不要混淆 |
|------|------|---------|
| `UserProfile` | 用户主页资料结构，适用于自己和他人 | 不叫社交主页 |
| `TravelArchive` | 一次旅行沉淀后的资产容器 | 不等于 `TrackSession` |
| `ArchiveStop` | 旅行档案里的有序停留节点 | 不等于原始 `Spot` 本体 |
| `SpotContent` | 挂载在 Spot 下的轻量内容卡 | 不叫帖子、不叫动态 |
| `Route Signature` | 旅行档案封面上的简化路线签名 | 不等于地图主渲染线 |
| `heatBucket` | 路线热度档位 | 不直接显示原始热度分数 |

## 对 Agent 2 / 3 的直接约束

### Agent 2

- `Explore` 首页必须坚持“路线优先，内容辅助”
- Spot 弹窗重做时，数据源优先使用 `SpotContent`
- 热门路线筛选只消费 `heatBucket`

### Agent 3

- `Profile` 改版必须以 `TravelArchive` 为第一对象
- EXIF 导入结果先落为 `MediaAsset` / `SpotContent draft`
- 现有 `FootprintJourney` 视为 `TravelArchive` 摘要层，而不是最终主模型

## 下一步建议

1. Agent 2 基于本文的 `SpotContent` 和 `heatBucket` 开始重做 Explore 信息结构
2. Agent 3 基于本文的 `TravelArchive`、`MediaAsset` 和状态机改造 Profile / Tracker
3. 后端真正建模时，先补 `UserProfile / TravelArchive / SpotContent` 三组 schema 与 mock seed
