<!-- Last verified: 2026-04-23 | Current stage: B -->

# Stage B — 规划

## 功能汇总

| # | 功能 | 状态 | 备注 |
|---|------|------|------|
| B1 | 灵感池 Wishlist | ✅ | 收藏/移除 Spot，列表视图已实现 |
| B2 | 连点成线交互 | ✅ | 从 Wishlist 选点添加到路线，按序自动排列 |
| B3 | 拖拽排序 + 实时路线刷新 | ✅ | 上下箭头重排序，timeline 可视化 |
| B4 | 一键唤起外部导航 | ✅ | 高德/Google Maps/Apple Maps deep link |
| B5 | Wishlist 自动归类 | ✅ | 端侧按坐标聚成省份 / 城市 / 地区小组 |

---

## 当前实现状态（2026-04-23）

- Wishlist 通过 Zustand store 管理，数据保存在内存中
- 收藏入口在 Explore 页的 SpotSheet 气泡窗（心形按钮）
- Plan 页面分两个 tab：Wishlist（自动归类分组）和 Route（路线构建器）
- 路线构建器支持：命名、主题选择、添加/移除/重排序 Spot、清空
- 导航导出支持：高德地图 URI Scheme → Google Maps → Apple Maps → Web 回退链
- Wishlist 现在会按端侧坐标启发式规则聚成 `省份 / 城市 / 地区` 分组，并支持整组加入路线稿
- 数据目前纯前端，无后端持久化（Stage B 不做数据库集成）

### 本轮新增/修改文件

- `lib/types.ts` — 新增 `WishlistItem`、`DraftWay` 类型
- `lib/store/wishlistStore.ts` — 新增，Wishlist Zustand store
- `lib/store/planStore.ts` — 新增，路线构建 Zustand store
- `lib/navigation.ts` — 新增，外部导航 deep link 工具函数
- `app/(tabs)/plan.tsx` — 重写，完整规划页 UI
- `components/SpotSheet.tsx` — 修改，新增心形收藏按钮

## B1: 灵感池 Wishlist

### 用户场景

用户在探索页浏览 Spot 时，对感兴趣的 Spot 点击心形按钮，该 Spot 被加入灵感池。切换到规划页后，用户在 Wishlist tab 看到所有已收藏的 Spot。

### 设计决策

| 决策点 | 选择 | 原因 | 放弃的方案 |
|--------|------|------|-----------|
| 收藏入口 | SpotSheet 内心形按钮 | 无需跳页，沉浸式操作 | 长按 Spot 弹菜单 |
| 存储方案 | Zustand 内存 store | Stage B 不做后端持久化，简洁 | AsyncStorage / SQLite |
| 视图形式 | 自动归类分组列表 | 先解决“收藏后吃灰” | 纯平铺列表 |

### 数据模型

```typescript
interface WishlistItem {
  spotId: string;
  name: string;
  coordinate: Coordinate;
  category: SpotCategory;
  addedAt: string;
}
```

### 受影响文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `lib/types.ts` | 修改 | 新增 WishlistItem 类型 |
| `lib/store/wishlistStore.ts` | 新增 | Wishlist store (add/remove/has/clear) |
| `components/SpotSheet.tsx` | 修改 | 新增收藏按钮 + 渐变激活态 |

---

## B2: 连点成线交互

### 用户场景

用户在 Wishlist 中选中 Spot（点击 + 按钮），该 Spot 被添加到 Route 构建器的末尾。用户可以依次添加多个 Spot，它们按添加顺序排列形成一条路线。

### 设计决策

| 决策点 | 选择 | 原因 | 放弃的方案 |
|--------|------|------|-----------|
| 添加方式 | Wishlist 卡片上的 + 按钮 | 操作直觉，减少步骤 | 地图上点选 |
| 路线数据 | DraftWay 结构 | 支持命名、主题、有序 Spot 列表 | 简单数组 |
| 首次添加 | 自动创建 DraftWay | 减少空白步骤 | 先手动"新建路线" |

### 数据模型

```typescript
interface DraftWay {
  id: string;
  name: string;
  theme: WayTheme;
  spots: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}
```

`WishlistItem` 现在可携带 `region`，Plan 页自动归类优先使用 `province / city / district / area`，坐标桶只作为缺少行政区信息时的兜底。来自 Explore 内容卡、博主停靠点和普通 Spot 收藏的点位都会把 `region` 一并写入灵感池。

### 受影响文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `lib/types.ts` | 修改 | 新增 DraftWay 类型 |
| `lib/store/planStore.ts` | 新增 | 路线构建 store |
| `app/(tabs)/plan.tsx` | 重写 | 完整规划页 UI |

---

## B3: 拖拽排序 + 实时路线刷新

### 用户场景

用户在 Route builder 中看到已添加的 Spot 以 timeline 形式排列（序号圆点 + 连接线）。通过上下箭头按钮调整 Spot 顺序，序号和连线实时更新。

### 设计决策

| 决策点 | 选择 | 原因 | 放弃的方案 |
|--------|------|------|-----------|
| 排序交互 | 上下箭头按钮 | 简单可靠，跨平台一致 | 长按拖拽 |
| 视觉展示 | Timeline 连接线 + 渐变序号圆点 | 路线感强，与品牌调性一致 | 纯列表 |
| 删除 | 每行末尾 × 按钮 | 直觉操作 | 左滑删除 |

### 受影响文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `lib/store/planStore.ts` | 同 B2 | reorderSpots(from, to) |
| `app/(tabs)/plan.tsx` | 同 B2 | RouteSpotCard 组件 |

---

## B4: 一键唤起外部导航

### 用户场景

用户路线构建完成后（≥2 个 Spot），点击右上角 Navigate 按钮。系统尝试唤起高德地图 → Google Maps → Apple Maps（iOS）→ Web Google Maps（终极回退）。

### 设计决策

| 决策点 | 选择 | 原因 | 放弃的方案 |
|--------|------|------|-----------|
| 优先级 | 高德 → Google → Apple → Web | 国内用户高德优先，海外 Google | 弹窗让用户选 |
| 调用方式 | URI Scheme (deep link) | 无需安装 SDK，零依赖 | 第三方导航 SDK |
| Waypoint 支持 | Google Maps 支持中间点，高德不支持 | 受限于各 app URI Scheme 能力 | — |

### Deep Link 格式

| App | URL 模板 |
|-----|---------|
| 高德 | `amapuri://route/plan/?slat=...&slon=...&dlat=...&dlon=...&t=2` |
| Google Maps | `comgooglemaps://?saddr=...&daddr=...&waypoints=...&directionsmode=walking` |
| Apple Maps | `maps://?saddr=...&daddr=...&dirflg=w` |
| Web 回退 | `https://www.google.com/maps/dir/origin/waypoint/destination` |

### 受影响文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `lib/navigation.ts` | 新增 | openExternalNav() + URL 构建函数 |
| `app/(tabs)/plan.tsx` | 修改 | Navigate 按钮调用 |

---

## B5: Wishlist 自动归类

### 用户场景

用户在 Explore 页收藏多个 Spot 后，进入 `Plan` 页不再看到一条平铺列表，而是先看到按 `省份 / 城市 / 地区` 聚合的小组。用户可以先挑一个地区小组，再把整组点位加入路线稿，减少“收藏后吃灰”。

### 设计决策

| 决策点 | 选择 | 原因 | 放弃的方案 |
|--------|------|------|-----------|
| 分组来源 | 端侧坐标启发式聚合 | 不依赖逆地理编码服务，当前即可落地 | 接第三方地理编码 API |
| 层级展示 | `省份 / 城市 / 地区` 三段标题 | 与产品文档口径一致，便于后续替换真实行政区 | 只显示一层 tag |
| 整理动作 | 支持整组加入路线稿 | 减少逐条点加的摩擦 | 仍只支持单点加入 |
| 去重策略 | 已在路线稿中的点位不重复添加 | 保持草稿稳定 | 允许重复追加 |

### 当前规则

- `省份 / 城市`：由坐标启发式推断，当前主要覆盖示例 seed 所在区域
- `地区`：由本地坐标桶和相对方位生成，例如 `西片区`、`北片区`
- 分类摘要：按组内 Spot 的 category 统计前 2 项

### 受影响文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `app/(tabs)/plan.tsx` | 修改 | Wishlist 分组视图、整组加入路线稿 |
| `wiki/89-agent3-profile-tracker-wishlist.md` | 新增 | Agent 3 的 Wishlist 自动归类规则说明 |

---

## 遗留项 / Backlog

- Wishlist 地图视图（在地图上显示所有已收藏 Spot）待后续迭代
- 真实逆地理编码替换当前端侧坐标启发式规则
- 真正的长按拖拽排序（react-native-draggable-flatlist）待 UX 验证后考虑
- DraftWay 持久化（AsyncStorage 或后端 API）待后续阶段
- 路线预览（在地图上显示 DraftWay 的连线）待后续迭代
- 后端 `POST /api/ways` 创建路线 API 待数据库接入后实现
