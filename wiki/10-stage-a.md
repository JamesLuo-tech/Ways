<!-- Last verified: 2026-04-29 | Current stage: A -->

# Stage A — 地基

## 功能汇总

| # | 功能 | 状态 | 备注 |
|---|------|------|------|
| A1 | 底部 Tab 导航框架 | ✅ | Expo Router 4 Tab 已实现 |
| A2 | 地图探索页 | ✅ | Explore 主链路已实现，支持无 token 占位 |
| A3 | 路线锚点渲染 | ✅ | 主题线样式 + 选中 glow 已实现 |
| A4 | Spot 气泡窗 | ✅ | Bottom Sheet + 标签点评已实现 |

---

## 当前实现状态（2026-04-29）

- 已创建 Expo 项目骨架：`app/`、`components/`、`constants/`、`lib/`
- 已创建 FastAPI 项目骨架：`server/main.py`、`server/api/`、`server/schemas/`、`server/services/`
- Explore 页已打通 `Way 列表 → Way 详情 → Spot 气泡窗` 交互链路
- 前端默认通过 `lib/api.ts` 请求 FastAPI；请求失败时退化到 `lib/mock-data.ts`，便于本地预览
- 后端当前使用内存 seed 数据，不含 SQLAlchemy / PostgreSQL 持久化
- 地图已回退到 Mapbox 实现；原生端继续使用 `@rnmapbox/maps`，Web 端单独改为纯 `mapbox-gl`，当前仅保留底图、路线聚焦与 Spot 标记，暂不在 Web 端绘制路线线条
- 地图坐标统一经过 `components/map/geo.ts` 校验；非法 `previewPolyline` / Spot 坐标会被过滤，避免 `fitBounds` 或 marker 渲染收到 `NaN`
- Web 地图实例只在组件挂载时创建一次；Way 选择变化只更新 marker 和相机聚焦，Mapbox 瓦片、session、events 等短暂资源请求失败不会再触发致命错误面板
- 地图在无 `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` 时使用占位视图，避免空白页

### 本轮新增文件

- `package.json` / `app.json` / `babel.config.js` / `tsconfig.json`
- `app/_layout.tsx` / `app/(tabs)/_layout.tsx`
- `app/(tabs)/explore.tsx` / `plan.tsx` / `tracker.tsx` / `profile.tsx`
- `components/map/MapExplorer.native.tsx` / `MapExplorer.web.tsx` / `MapExplorer.types.ts` / `geo.ts` / `WayLine.tsx` / `WayLine.native.tsx` / `SpotMarker.tsx` / `SpotMarker.native.tsx`
- `components/cards/WayCard.tsx` / `components/SpotSheet.tsx` / `components/ui/TagBubble.tsx`
- `constants/theme.ts` / `constants/map-styles.ts`
- `lib/types.ts` / `lib/mock-data.ts` / `lib/api.ts` / `lib/store/wayStore.ts` / `lib/store/spotStore.ts`
- `server/main.py` / `server/api/routes.py` / `server/api/spots.py`
- `server/schemas/way.py` / `server/schemas/spot.py` / `server/services/mock_data.py`

## A1: 底部 Tab 导航框架

### 用户场景

用户打开 app，通过底部 Tab 在四个核心功能间切换。

### 设计决策

| 决策点 | 选择 | 原因 | 放弃的方案 |
|--------|------|------|-----------|
| 导航方案 | Expo Router file-based tabs | 与 Expo 深度集成，约定优于配置 | React Navigation 手动配置 |
| Tab 数量 | 4 个 | Design.md 明确定义，覆盖核心场景 | 5 Tab（底部拥挤） |
| Tab 图标 | 线性图标，激活态填充 | 清爽，符合"硬核清爽"调性 | 彩色图标（糖果色） |

### 受影响文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `app/(tabs)/_layout.tsx` | 新增 | Tab 导航配置 |
| `app/(tabs)/explore.tsx` | 新增 | 探索页主链路 |
| `app/(tabs)/plan.tsx` | 新增 | Stage B 占位页 |
| `app/(tabs)/tracker.tsx` | 新增 | Stage C 占位页 |
| `app/(tabs)/profile.tsx` | 新增 | Stage D 占位页 |
| `app/_layout.tsx` | 新增 | 根布局 |

---

## A2: 地图探索页

### 用户场景

用户进入探索页，看到全屏地图（浅色 Mapbox 底图），上层是可水平滑动的路线卡片。选中某条路线时，地图会按该路线的边界自动聚焦到对应区域。

### 设计决策

| 决策点 | 选择 | 原因 | 放弃的方案 |
|--------|------|------|-----------|
| 地图 SDK | 原生端 `@rnmapbox/maps`，Web 端 `mapbox-gl` | 原生端保留 RN 地图栈，Web 端先保留稳定底图与点位交互，不再强上路线图层 | react-native-maps（样式自定义差） |
| 底图样式 | Mapbox Light 定制 | 与 Warm Cream 设计系统一致 | 标准亮色地图 |
| 坐标保护 | 进入地图 SDK 前统一校验坐标 | API / fallback 数据可能缺字段或含非法值，地图相机不能接收 `NaN` | 直接信任运行时数据 |
| Web 错误处理 | 样式加载失败才展示致命错误；瓦片 / session / events 短暂失败降级 | 网络切换会导致单个资源失败，但不应卸载整张地图 | 所有 `mapbox-gl` error 都切到 fallback |
| 路线数据加载 | bbox 查询，视口内加载 | 性能考虑，不一次加载全部 | 全量加载 |
| 卡片交互 | 水平滑动，一次露 1.2 张 | 暗示可滑动，减少误触 | 垂直列表 |
| 双层视觉 | 卡片叠加在地图底部 | Design.md 明确要求 | 分屏布局 |

### API 契约

```
GET /api/ways?bbox={west,south,east,north}&theme={theme}
```

**请求：**
```
Query params:
  bbox: string    — "lng1,lat1,lng2,lat2" 视口边界
  theme?: string  — 按主题过滤
  limit?: number  — 默认 20
```

**响应：**
```json
{
  "ways": [
    {
      "id": "uuid",
      "name": "莫干山精酿之路",
      "theme": "wine",
      "spotCount": 5,
      "distance": 12400,
      "duration": 18000,
      "coverPhoto": "https://...",
      "previewPolyline": [[120.108, 30.262], [120.1139, 30.2648], [120.1187, 30.2687], [120.1251, 30.2719], [120.1342, 30.2767], [120.138, 30.279]]
    }
  ],
  "total": 42
}
```

### 数据模型

```typescript
// 探索页列表项（轻量版，不含完整 spots）
interface WayPreview {
  id: string;
  name: string;
  theme: WayTheme;
  spotCount: number;
  distance: number;      // 米
  duration: number;       // 秒
  coverPhoto: string;
  previewPolyline: Coordinate[]; // 更密的路线采样几何，而不是只放 Spot 关键点
}
```

### 受影响文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `app/(tabs)/explore.tsx` | 修改 | 地图 + 卡片布局 |
| `components/map/MapExplorer.native.tsx` | 修改 | 原生端继续封装 `@rnmapbox/maps` 地图与相机聚焦 |
| `components/map/MapExplorer.web.tsx` | 修改 | Web 端改为纯 `mapbox-gl`，当前保留地图底图、路线聚焦与 Spot 标记，并降级可恢复资源错误 |
| `components/map/geo.ts` | 新增 | 地图坐标校验、默认中心点和路线边界计算 |
| `components/cards/WayCard.tsx` | 新增 | 路线卡片组件 |
| `lib/store/wayStore.ts` | 新增 | 路线数据 store |
| `lib/api.ts` | 新增 | API 客户端 |
| `lib/mock-data.ts` | 新增 | 前端 fallback seed 数据 |
| `constants/map-styles.ts` | 新增 | 地图样式配置 |
| `server/api/routes.py` | 新增 | 路线查询 API |
| `server/schemas/way.py` | 新增 | Way Pydantic schema |
| `server/services/mock_data.py` | 新增 | Stage A 路线 seed 数据 |

---

## A3: 路线锚点渲染

### 用户场景

地图上的每条路线用不同视觉主题渲染：徒步用深绿实线，酒文化用橙色虚线。用户能一眼区分路线类型。

### 设计决策

| 决策点 | 选择 | 原因 | 放弃的方案 |
|--------|------|------|-----------|
| 渲染方式 | 原生端 `ShapeSource + LineLayer`，Web 端暂不绘制路线线条 | 先保证 Web 端地图稳定可用，路线几何展示仅保留在原生端 | RN 侧绘制（性能差） |
| 选中效果 | 线宽 3→5px + glow | 明确反馈，不打断地图浏览 | 弹窗确认 |
| 主题映射 | 静态配置表 | 主题有限（6 种），无需动态 | 服务端下发样式 |

### 受影响文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `components/map/WayLine.tsx` | 新增 | 平台分发入口 |
| `components/map/WayLine.native.tsx` | 新增 | 原生端路线线段渲染组件 |
| `constants/map-styles.ts` | 修改 | 追加主题→样式映射 |

---

## A4: Spot 气泡窗

### 用户场景

用户点击地图上的 Spot 节点，底部弹出半屏气泡窗，展示 Spot 名称、用户实拍照片、标签式点评。不跳转页面，保持地图上下文。选中路线时，Spot 会以 `1 / 2 / 3...` 编号；路线本身继续由 `previewPolyline` 表达，不再额外绘制点对点假连线。

### 设计决策

| 决策点 | 选择 | 原因 | 放弃的方案 |
|--------|------|------|-----------|
| 展示方式 | Bottom Sheet（半屏） | Design.md 明确要求不跳页 | 全屏 Modal |
| 底层库 | @gorhom/bottom-sheet | RN 生态最成熟的 Bottom Sheet | 自己实现（工作量大） |
| 照片展示 | 水平滑动缩略图 | 气泡窗空间有限 | 瀑布流（占空间太大） |
| 标签样式 | Pill 气泡，可点选 | 零文字交互，Design.md 核心理念 | 文字评论 |

### API 契约

```
GET /api/spots/{id}
```

**响应：**
```json
{
  "id": "uuid",
  "name": "青芝坞入口",
  "coordinate": [120.108, 30.262],
  "category": "scenic",
  "tags": ["机位极佳", "人烟稀少", "适合微醺"],
  "photos": [
    { "url": "https://...", "takenAt": "2026-03-15T10:30:00Z" }
  ],
  "wayIds": ["way-uuid-1"]
}
```

### 受影响文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `components/map/SpotMarker.tsx` | 新增 | 平台分发入口 |
| `components/map/SpotMarker.native.tsx` | 新增 | 原生端 Spot 地图标记 |
| `components/map/MapExplorer.web.tsx` | 修改 | Web 端使用 `mapbox-gl.Marker` 渲染 Spot 编号与名称 |
| `components/SpotSheet.tsx` | 新增 | Spot 气泡窗 Bottom Sheet |
| `components/ui/TagBubble.tsx` | 新增 | 标签气泡组件 |
| `lib/store/spotStore.ts` | 新增 | Spot 数据 store |
| `server/api/spots.py` | 新增 | Spot API |
| `server/schemas/spot.py` | 新增 | Spot Pydantic schema |
| `server/services/mock_data.py` | 新增 | Stage A Spot seed 数据 |

---

## 遗留项 / Backlog
- PostgreSQL / PostGIS / SQLAlchemy 模型待替换当前内存 seed 数据
- `GET /api/spots` 目前后端已提供，前端尚未基于 bbox 独立拉取 Spot
- 地图离线缓存策略待 Stage B 确定
- 地图样式的精确 JSON 定制需实际调试
