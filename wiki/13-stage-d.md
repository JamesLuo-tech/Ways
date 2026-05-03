<!-- Last verified: 2026-04-23 | Current stage: D on top of C -->

# Stage D — 个人

## 功能汇总

| # | 功能 | 状态 | 备注 |
|---|------|---------|------|
| D1 | 足迹资产库 | ✅ | 时间轴 + Atlas 图谱双视图 |
| D2 | 动态足迹海报 | ✅ | 海报预览 + 系统分享文案 |

---

## 当前实现状态（2026-04-15）

- `Profile` 页已由占位卡片重写为 Stage D 主页面
- 页面顶部已改为更像“内容主页”的个人资料头：头像、简介、地域、标签、档案统计与主动作
- 足迹资产库当前支持 `Archive Wall / Timeline / Poster` 三种模式切换
- `Archive Wall` 采用双列档案卡墙，视觉上更接近内容主页，但底层对象仍然是旅行档案而非社交帖子
- Timeline 视图展示日期区间、区域、路线缩略图、行程统计、亮点标签
- Poster 模式支持选择 journey，实时生成海报预览，并调用系统分享面板输出摘要文案
- 当前数据直接派生自 Stage C 的 `TrackSession`、`PhotoCluster` 与标签数据，不再依赖 mock footprint
- Stage C 的照片导入和标签点评会同步刷新 session 摘要，Profile 的旅行档案标签与统计不再依赖旧快照
- 为便于开发态预览，`trackerStore.sessions` 现在会预置少量 `TrackSession` seed；Profile 仍然只消费这同一条 session 数据源

## D1: 足迹资产库

### 用户场景

用户进入 Profile 页，首先看到一个更像内容主页的资料头：头像、简介、主页标签和统计摘要；随后可以在 `Archive Wall / Timeline / Poster` 三种模式间切换：

- Archive Wall：双列档案卡墙，像内容主页一样快速扫视历史旅程
- Timeline：按时间顺序查看每次 journey 的主题、里程、时长、Spot 数和亮点标签
- Poster：选中一条档案后生成海报预览并分享

### 设计决策

| 决策点 | 选择 | 原因 | 放弃的方案 |
|--------|------|------|-----------|
| 数据来源 | Stage C 本地 session / cluster 数据 | 与已完成的 Tracker 工作台直连 | 额外维护一套 mock footprint |
| 视图模式 | Archive Wall + Timeline + Poster | 同时满足主页感、回顾和分享 | 只做单列表 |
| 路线预览 | 轻量自绘线路缩略图 | 不增加地图依赖和 key 要求 | Profile 页内嵌高德地图 |
| 统计口径 | journey / distance / spot / photo | 能体现“资产化”价值 | 只显示路线数量 |

### 数据模型

```typescript
interface FootprintJourney {
  id: string;
  title: string;
  theme: WayTheme;
  region: string;
  startedAt: string;
  endedAt: string;
  distanceKm: number;
  durationHours: number;
  spotCount: number;
  photoCount: number;
  tags: string[];
  routePreview: Coordinate[];
  heroMetric: string;
}
```

当前由 `TrackSession` 派生：

- `distanceKm` ← `distanceMeters / 1000`
- `spotCount` ← `clusterCount`
- `photoCount` ← session 关联照片数
- `tags` ← 当前 session 下所有 cluster 标签去重汇总
- `routePreview` ← 当前 session 的采样轨迹缩略数组
- `tags` 会随 Tracker 页照片簇标签切换而刷新
- 开发态会先显示几条预置旅程，用户新记录完成后会继续追加到同一列表
- `Profile` 直接导入照片时，会生成本地照片档案草稿；此类 session 的 `sourceType = photo_import`、`archiveStatus = draft`，档案墙会展示草稿状态与照片导入来源

### 受影响文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `app/(tabs)/profile.tsx` | 重写 | Stage D 主页面，改为个人资料头 + 档案卡墙 |
| `lib/types.ts` | 修改 | 新增足迹资产相关类型 |
| `lib/tracker.ts` | 修改 | 生成可供 Stage D 复用的 session 摘要 |
| `lib/store/trackerStore.ts` | 修改 | 在导入照片和切换标签后同步更新 session 摘要，并预置开发态 session seed |
| `lib/mock-data.ts` | 修改 | 新增 Profile / Poster 预览用 `TrackSession` seed |

---

## D2: 动态足迹海报

### 用户场景

用户在 Profile 页切换到 Poster 模式，选择一条 journey 后，系统根据该 journey 的主题、里程、Spot 数、照片数和标签生成一张长图风格的海报预览。用户点击分享按钮，可直接唤起系统分享面板，把本次 journey 的摘要文案发给外部 app。

### 设计决策

| 决策点 | 选择 | 原因 | 放弃的方案 |
|--------|------|------|-----------|
| 海报载体 | 应用内实时预览卡片 | 先确保视觉结果可控 | 直接后台生成图片 |
| 分享方式 | React Native `Share.share()` 分享摘要文案 | 无需新增原生依赖 | 强依赖截图/文件导出库 |
| 海报模板 | 主题驱动的渐变 + 指标卡 | 兼顾品牌感和实现成本 | 高自由度编辑器 |
| 入口位置 | 与资产库同页切换 | 用户心智连续，不跳流程 | 独立新页面 |

### 海报文案结构

```text
Ways Footprint
{journey.title} · {journey.region}
{distanceKm} km / {durationHours} h / {spotCount} clusters / {photoCount} photos
亮点：{tags.join(' · ')}
```

### 受影响文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `app/(tabs)/profile.tsx` | 同 D1 | 新增 Poster 模式与分享动作 |
| `lib/store/trackerStore.ts` | 同 D1 | 提供海报所需 session / tag / photo 汇总 |

---

## 当前边界

- 不做位图级海报导出，不生成本地图片文件
- 不做后端同步、登录态和跨端资产持久化
- 当前 region 只显示 session 质心经纬度，尚未做逆地理编码
