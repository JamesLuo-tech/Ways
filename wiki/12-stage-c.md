<!-- Last verified: 2026-04-23 | Current stage: C -->

# Stage C — 记录

## 功能汇总

| # | 功能 | 状态 | 备注 |
|---|------|------|------|
| C1 | GPS 轨迹记录 | ✅ | 前台持续采样已落地；支持后台增强开关与自动升级 |
| C2 | 照片 EXIF 地理聚类 | ✅ | 多选导入带坐标图片，按 180m 阈值自动归簇 |
| C3 | 气泡标签点评 | ✅ | 预设标签多选，绑定到照片簇 |

---

## 目标

把 `Tracker` 页从占位卡片升级为可操作的“记录工作台”，完成 Stage C 的三个闭环：

| # | 功能 | 本轮实现 |
|---|------|---------|
| C1 | 后台 GPS 轨迹记录 | `expo-location` 实时采样；支持前台持续记录；在支持 `TaskManager` + 后台定位的环境中自动升级为后台任务 |
| C2 | 照片 EXIF 地理聚类 | 用户批量导入带 EXIF 经纬度的图片，前端按距离阈值自动聚类 |
| C3 | 气泡标签点评 | 在聚类卡片上点选预设标签，避免文本输入 |

> 说明：当前仓库尚未接入数据库，也未建立媒体同步后端，因此 Stage C 以“端侧 MVP”交付。轨迹、照片聚类、标签点评先保存在前端 Zustand store 中，不做跨重启持久化。

---

## 当前实现状态（2026-04-15）

- `Tracker` 页已从占位卡片升级为完整工作台 UI
- 新增 `expo-location`、`expo-task-manager`、`expo-image-picker` 依赖与 Expo config plugin 配置
- 当前轨迹、照片、聚类、标签点评均由 `lib/store/trackerStore.ts` 内存管理
- 停止记录后会生成本地 `TrackSession` 历史项
- 导入照片或切换照片簇标签后，会同步刷新当前 `TrackSession` 摘要，供 Stage D 旅行档案库实时派生
- 当前仍不做跨重启持久化，也未接后端上传接口

---

## 核心设计

### C1: 轨迹记录

#### 当前行为

- 点击 `Start Recording` 后请求前台定位权限，并启动 `watchPositionAsync`
- 页面实时展示时长、里程、点数、最近采样时间
- 若 `Background Boost` 打开，则尝试请求后台权限并注册 `startLocationUpdatesAsync`
- 若当前环境不支持后台增强，则保留前台记录，并给出非阻塞提示
- 点击 `Stop Recording` 后生成一条本地 `TrackSession`

#### 用户场景

用户在 `Tracker` 页点击 `Start Recording`，应用开始持续采集位置点；点击 `Stop` 后生成一段本地轨迹会话，显示时长、里程、点数。

#### 设计决策

| 决策点 | 选择 | 原因 | 放弃的方案 |
|--------|------|------|-----------|
| 采集主路径 | `watchPositionAsync` 前台实时采样 | Expo Go / 开发环境即可工作，落地风险低 | 仅做后台任务，导致开发阶段不可验证 |
| 后台增强 | 支持时自动调用 `startLocationUpdatesAsync` | 满足 Stage C“后台记录”目标，同时保留降级路径 | 强依赖 Dev Client / 真机构建 |
| 数据归档 | 停止记录时生成 `TrackSession` | 与 Stage D 足迹资产库衔接自然 | 只保留临时 points 数组 |
| 轨迹展示 | 当前会话卡片 + 历史 session 列表 | MVP 信息密度高，实现直接 | 地图回放动画 |

#### 权限与降级

- 先请求前台定位权限
- 用户显式开启后台增强时，再请求后台定位权限
- 若后台权限、TaskManager 或运行环境不满足，则继续使用前台记录，不阻塞主流程
- 若定位不可用，则保留 UI，但禁止开始记录并给出明确错误提示

### C2: 照片 EXIF 地理聚类

#### 当前行为

- 用户点击 `Import Photos` 后可从系统图库多选图片
- 导入逻辑优先读取 EXIF 中的 `latitude` / `longitude` / `GPSLatitude` / `GPSLongitude`
- 无坐标图片会被跳过，并显示在导入摘要中
- 聚类结果展示代表图、张数、中心点、拍摄时间区间
- `Profile` 页也可直接触发照片导入，生成 `sourceType = photo_import`、`archiveStatus = draft` 的本地照片档案草稿

#### 用户场景

用户在记录完成后点击 `Import Photos`，从系统相册选择多张照片。应用读取 EXIF 经纬度，把距离接近的照片归到同一簇，并在页面上展示簇摘要。

#### 设计决策

| 决策点 | 选择 | 原因 | 放弃的方案 |
|--------|------|------|-----------|
| 图片来源 | `expo-image-picker` 多选导入 | API 简洁，可直接拿到 EXIF，依赖最少 | 静默扫描整库相册 |
| 聚类依据 | 基于经纬度的距离阈值聚类 | 与产品“时空预览”目标一致 | 按日期聚类 |
| 无坐标图片 | 跳过并计入导入摘要 | 保证聚类结果可信 | 回退用拍摄时间硬聚 |
| 预览形式 | 簇卡片 + 首图缩略图 + 张数 | 快速识别，不引入复杂瀑布流 | 原图平铺 |

#### 聚类规则

- 仅处理带 `latitude` / `longitude` EXIF 的图片
- 采用固定距离阈值（默认 180 米）做轻量聚类
- 同一簇记录中心点、照片数、首末拍摄时间、代表图

### C3: 标签点评

#### 当前行为

- 每个照片簇卡片展示全部预设标签
- 标签支持多选；再次点击同一标签会取消
- 聚类重新计算时，若照片集合未变，会保留已有标签选择

#### 用户场景

每个照片簇卡片底部展示一组高频标签，用户点选即可完成点评；再次点击可取消。

#### 设计决策

| 决策点 | 选择 | 原因 | 放弃的方案 |
|--------|------|------|-----------|
| 标签来源 | 本地预设 tag 池 | 不依赖后端，先跑通闭环 | 自由文本输入 |
| 绑定对象 | 绑定到照片簇而非单张图 | 操作量小，更贴合“地点感受” | 每张图单独点评 |
| 交互方式 | 多选气泡 chip | 与 Explore SpotSheet 标签语言一致 | 下拉菜单 |

建议首批标签：

- `机位极佳`
- `人烟稀少`
- `适合微醺`
- `补给方便`
- `适合停留`
- `逆光友好`
- `风大`
- `建议轻装`
- `值得二刷`

---

## 页面结构

`Tracker` 页分为四个区块：

1. Recording Hero
   - 当前状态：Idle / Recording / Error
   - 主 CTA：Start / Stop
   - 次级开关：Background Boost
   - 实时指标：时长、里程、采样点数
2. Current Session Summary
   - 起止时间、最近采样、权限状态、后台增强状态
3. Photo Clusters
   - 导入按钮
   - 导入摘要（成功数 / 无坐标数）
   - 照片簇卡片列表
4. History
   - 最近轨迹会话列表
   - 每条显示时长、里程、点数、绑定照片簇数

---

## 数据模型

```typescript
type TrackerStatus = 'idle' | 'recording' | 'stopped' | 'error';

interface TrackPoint {
  coordinate: Coordinate;
  altitude: number | null;
  timestamp: string;
  speed: number | null;
}

interface TrackPhotoInput {
  id: string;
  uri: string;
  width: number;
  height: number;
  coordinate: Coordinate;
  takenAt: string | null;
}

interface PhotoCluster {
  id: string;
  centroid: Coordinate;
  photoCount: number;
  photoIds: string[];
  coverUri: string;
  takenAtStart: string | null;
  takenAtEnd: string | null;
  tags: string[];
}

interface TrackSession {
  id: string;
  startedAt: string;
  endedAt: string;
  distanceMeters: number;
  pointCount: number;
  clusterCount: number;
  photoCount: number;
  tags: TrackReviewTag[];
  routePreview: Coordinate[];
  centroid: Coordinate | null;
}
```

说明：

- `photoCount`、`tags`、`routePreview`、`centroid` 用于 Stage D 直接派生足迹资产库
- 当用户在当前 session 下继续导入照片并更新聚类时，session 摘要会同步刷新
- 当用户切换照片簇标签时，当前 session 的 `tags` 也会同步刷新，避免 Profile 旅行档案标签停留在旧快照

---

## 本轮新增/修改文件

- `lib/store/trackerStore.ts` — 轨迹记录、照片聚类、标签点评状态管理
- `lib/tracker.ts` — 定位采样、距离计算、聚类算法、导入转换
- `lib/types.ts` — 新增 Stage C 相关类型
- `app/(tabs)/tracker.tsx` — 从占位页改为完整 Tracker 工作台
- `package.json` — 增加 `expo-location`、`expo-task-manager`、`expo-image-picker`
- `app.json` — 新增定位/相册权限文案与后台定位 plugin 配置

---

## 风险与约束

- 真后台定位在 Expo 中需要对应平台权限与运行环境支持，不能保证在所有开发模式下一致可用
- 图片 EXIF 经纬度并非所有相册图片都具备，导入结果需要显式展示“被跳过的照片数”
- 当前不做本地持久化，刷新或重启应用后记录数据会丢失；后续可在 Stage D 接入 AsyncStorage / SQLite / 后端同步
- 当前未做轨迹地图回放，也未把照片簇反投影到 Explore / Profile 页

---

## 验收标准

- 用户能在 `Tracker` 页开始与停止一次轨迹记录
- 页面能实时显示时长、距离、点数
- 用户能导入多张图片，并看到按地理位置聚类后的卡片列表
- 用户能为任意照片簇添加和取消预设标签
- 停止记录后，历史列表新增一条本地 session
- 在不支持后台增强的环境中，前台记录主流程仍然可用
