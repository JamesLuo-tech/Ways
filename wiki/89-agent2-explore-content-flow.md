<!-- Last verified: 2026-04-23 | Source: wiki/87-three-agent-work-plan.md + wiki/88-agent1-product-data-contract.md -->

# Agent 2 交付：Explore 内容流改版

> 目的：把 `Explore` 从“路线卡 + 单个 Spot 详情”升级为“路线优先、内容辅助”的内容探索 MVP，覆盖 Spot 内容抽屉、博主主页预览、快速收藏、长按节点快速规划和热门路线筛选。

## 适用范围

- 覆盖 `wiki/87-three-agent-work-plan.md` 中 Agent 2 的任务范围
- 基于 `wiki/88-agent1-product-data-contract.md` 的 `SpotContent`、`UserProfile`、`TravelArchive` 与 `heatBucket` 契约
- 不修改 `Profile` 信息架构
- 不修改 `Tracker` 导入链路
- 不引入关注、评论、私信或完整帖子系统

## 一页决策

| 主题 | 决策 | 原因 | 实现约束 |
|------|------|------|----------|
| 首页主结构 | `Way` 仍是首屏主对象 | Ways 是路线工具，不转成内容平台 | 底部主 rail 继续展示路线卡 |
| Spot 抽屉 | 保留 Bottom Sheet，但改为内容抽屉 | 保留地图上下文，同时展示同一 Spot 下多张内容卡 | 不做全屏帖子详情页 |
| 内容卡 | 使用 `SpotContent` 作为抽屉主内容 | 与 Agent 1 数据契约一致 | 内容卡包含作者、封面、标签、所属档案和快捷动作 |
| 博主主页 | 在 Explore 内提供轻量主页预览 | 当前没有独立 User Profile 页面 | 点击作者后在抽屉内展示该用户资料、档案和相关路线 |
| 热门路线 | 前端只消费 `heatBucket` | 避免展示原始热度分数 | 筛选为 `全部 / 热门路线 / 新发现 / 经典路线 / 编辑精选` |
| 小众可见性 | 保留非热度入口 | 避免 Explore 被纯热门占满 | `编辑精选` 与 `新发现` 必须可选 |
| 内容到路线 | 先复用 `Wishlist` 与 `DraftWay` | 不新增后端写入接口 | 内容卡可收藏 Spot，也可把 Spot 加入当前路线稿 |
| 长按节点 | 长按 Spot 直接快速规划 | 降低从地图节点进入 Plan 的摩擦 | 原生 marker 与 Web marker 都暴露长按 / 右键入口，页面内复用同一处理函数 |

## Explore 信息结构

```text
Explore
├── 地图层
│   ├── Way 锚点
│   └── 当前 Way 的 Spot 节点
├── 顶部筛选
│   ├── 全部
│   ├── 热门路线
│   ├── 新发现
│   ├── 经典路线
│   └── 编辑精选
├── Way 卡片 rail
│   ├── 主题
│   ├── heatBucket 文案
│   ├── 距离 / 时长 / Spot 数
│   └── 选择路线
└── Spot 内容抽屉
    ├── Spot 摘要
    ├── SpotContent 横滑内容卡
    ├── 收藏到灵感池
    ├── 加入路线稿
    └── 作者主页预览
```

## 数据契约

### `WayPreview` 增量字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `heatBucket` | `emerging \| hot \| classic \| editorial` | 前端筛选与卡片展示用热度档位 |
| `contentCount` | `number` | 该路线关联的 SpotContent 数量摘要 |
| `savedCountLabel` | `string` | 可展示的收藏量文案，不暴露原始排序分数 |

### `SpotContent`

```typescript
interface SpotContent {
  id: string;
  spotId: string;
  owner: UserProfileSummary;
  archive: TravelArchiveSummary;
  coverAssetUrl: string;
  capturedAt: string;
  tags: string[];
  visibility: 'public' | 'hidden';
  sourceType: 'tracked' | 'planned' | 'mixed';
}
```

### `TravelArchiveSummary.stops`

`TravelArchiveSummary` 增加 `stops: ArchiveStopSummary[]`，用于头像进入博主预览后展示“这个博主在包含当前节点的路线里还去过哪些点”。`ArchiveStopSummary` 继承 `SpotPreview`，额外包含 `sequence`，并允许携带 `region`，方便用户把单个停靠点收藏到自己的 `Wishlist` 或加入 `DraftWay`。

### Spot 详情增量字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `contents` | `SpotContent[]` | 同一 Spot 下的用户内容卡 |
| `relatedWays` | `WayReference[]` | 与该 Spot 相关的路线摘要，用于作者预览和快速规划 |

## 交互闭环

### 从内容进入博主主页

1. 用户点开 Spot 抽屉
2. 横滑查看同一地点下不同博主的 `SpotContent` 大图卡
3. 内容卡采用头像 + 大图 + 左下角地点标记结构，地点始终是当前 Spot
4. 点击作者区域
5. 抽屉内切换到轻量作者主页预览
6. 预览展示作者基础资料、统计、该内容所属旅行档案、相关路线和该档案的有序停靠点
7. 用户可从停靠点逐个收藏或加入路线稿

当前 MVP 不跳转独立页面，因为 `Profile` 信息架构由 Agent 3 负责。

### 从内容快速收藏

1. 内容卡展示当前 Spot 的收藏状态
2. 点击 `收进灵感池` 后写入 `wishlistStore`
3. 若已收藏，再次点击会从灵感池移除

### 从内容快速规划

1. 点击内容卡里的 `加入路线稿`
2. 若当前没有 `DraftWay`，自动创建一条 `custom` 路线稿
3. 将该 Spot 作为 `WishlistItem` 加入 `planStore.draft.spots`
4. 同时确保该 Spot 已进入灵感池，方便用户在 Plan 页继续整理

### 长按节点快速规划

1. 用户长按地图 Spot 节点
2. 页面直接执行“加入路线稿”
3. 顶部提示文案显示已加入路线稿

Web 端用 marker 右键作为长按替代入口；原生端用 `PointAnnotation` 的 `onLongPress`。

## 热门路线展示策略

| 筛选项 | 匹配规则 | 前端文案 |
|--------|----------|----------|
| 全部 | 不过滤 | `全部` |
| 热门路线 | `heatBucket === 'hot'` | `热门路线` |
| 新发现 | `heatBucket === 'emerging'` | `新发现` |
| 经典路线 | `heatBucket === 'classic'` | `经典路线` |
| 编辑精选 | `heatBucket === 'editorial'` | `编辑精选` |

### 约束

- 不展示 `heatScore`
- 不按浏览量直接排序
- 允许 `editorial` 作为非热门入口，保护小众路线可见性

## 当前 MVP 边界

- 使用前端 fallback seed 与 FastAPI 内存 seed 双轨数据
- `SpotContent` 只读展示，不支持发布、编辑、删除
- 作者主页是抽屉内预览，不是独立路由
- 收藏和路线稿仍然是端侧 Zustand 状态，不跨重启持久化
- 热门筛选只基于 mock / API 返回的 `heatBucket`，不在前端计算热度

## 受影响文件

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `app/(tabs)/explore.tsx` | 修改 | 增加筛选、内容到路线转化、长按规划提示 |
| `components/SpotSheet.tsx` | 修改 | 从单点详情升级为 SpotContent 内容抽屉 |
| `components/cards/WayCard.tsx` | 修改 | 增加 heatBucket、内容量和收藏文案 |
| `components/map/MapExplorer.types.ts` | 修改 | 增加 `onSpotLongPress` 回调 |
| `components/map/MapExplorer.native.tsx` | 修改 | 原生 Spot marker 支持长按 |
| `components/map/MapExplorer.web.tsx` | 修改 | Web marker 支持右键快速规划 |
| `lib/types.ts` | 修改 | 增加 Agent 2 数据类型 |
| `lib/mock-data.ts` | 修改 | 增加 heatBucket、SpotContent、UserProfile seed |
| `lib/api.ts` | 修改 | 同步前端 API 类型 |
| `server/schemas/*.py` | 修改 | 同步 FastAPI schema |
| `server/services/mock_data.py` | 修改 | 同步后端 seed 数据 |

## 待后续补强

- 增加独立用户主页路由，并由 Agent 3 的 `TravelArchive` 页面承接
- 将 `GET /api/spots/{id}/contents` 拆成独立分页接口
- 将 `heatBucket` 接入后端真实 `WayHeatSnapshot`
- 为内容卡增加隐私降级状态展示
