<!-- Last verified: 2026-04-29 | Current stage: D MVP -->

# 变更日志

## Git 上传前仓库清理

**日期：** 2026-05-03

### 变更

- 重新整理 Git 历史，上传到 GitHub 的 `main` 仅保留项目源码、配置、文档和锁文件
- 从上传历史中排除 `node_modules/`、`.venv/`、`.expo/`、Python `__pycache__` / `*.pyc` 和 `.env.local`
- 补充版本控制约定，明确本地依赖、环境变量和生成物不进入 Git
- 清理前的本地历史保留在 `backup/pre-upload-with-deps-20260503` 分支

### 修改文件

- `.gitignore` — 增加本地依赖、虚拟环境、Expo 生成物、Python 缓存和环境变量忽略规则
- `wiki/06-conventions.md` — 增加版本控制约定
- `wiki/90-CHANGELOG.md` — 记录本次仓库清理和上传边界

## Web 地图稳定性修复

**日期：** 2026-04-29

### 变更

- 修复 Web 端 Explore 地图在 `fitBounds` 收到 `NaN` 坐标时崩溃的问题
- 地图初始化改为单次创建，选中 Way 变化只触发相机聚焦，不再反复销毁并重建 `mapbox-gl` 实例
- Mapbox 瓦片、session、events 等资源请求的短暂网络失败不再直接切换到致命错误面板
- 原生端与 Web 端共用坐标校验和路线边界计算，过滤非法 `previewPolyline` / Spot 坐标后再传给地图 SDK

### 修改文件

- `components/map/geo.ts` — 新增地图坐标校验、默认中心点和路线边界计算工具
- `components/map/MapExplorer.web.tsx` — 稳定 Web 地图生命周期、降级可恢复 Mapbox 资源错误、过滤非法 Spot 坐标
- `components/map/MapExplorer.native.tsx` / `WayLine.native.tsx` / `SpotMarker.native.tsx` — 原生地图复用坐标保护逻辑
- `wiki/10-stage-a.md` / `wiki/02-system-architecture.md` / `wiki/90-CHANGELOG.md` — 同步 Web 地图稳定性边界

## 首页内容流与照片档案草稿

**日期：** 2026-04-28

### 变更

- `SpotSheet` 改为同一地点下的博主照片 pager：头像 + 大图 + 左下角地点标记，横滑切换不同博主内容
- 博主预览增加旅行档案停靠点列表，停靠点可直接收藏到灵感池或加入路线稿
- `SpotPreview / WishlistItem` 增加 `region`，Plan 自动归类优先使用省份 / 城市 / 地区，坐标桶只作兜底
- `Profile` 增加直接导入照片入口，可从带 EXIF 位置的照片生成本地照片档案草稿
- `TrackSession` 增加 `sourceType / archiveStatus`，照片导入草稿会在档案墙标记草稿和来源

### 修改文件

- `components/SpotSheet.tsx` — 重做地点内容流卡片与博主停靠点转化入口
- `app/(tabs)/plan.tsx` — Wishlist 自动归类优先使用 `region`
- `app/(tabs)/profile.tsx` / `lib/store/trackerStore.ts` — Profile 导入照片生成本地档案草稿
- `lib/types.ts` / `lib/mock-data.ts` / `server/schemas/*.py` / `server/services/mock_data.py` — 同步 region、stops 与照片草稿字段
- `wiki/89-agent2-explore-content-flow.md` / `wiki/89-agent3-profile-tracker-wishlist.md` / `wiki/11-stage-b.md` / `wiki/12-stage-c.md` / `wiki/13-stage-d.md` — 同步数据流与产品边界

## Profile 主页形态改版

**日期：** 2026-04-23

### 变更

- 将“我的”页改为更像内容主页的结构：个人资料头、标签、统计、双列档案墙、时间轴和海报模式
- 视觉上参考小红书主页的信息密度和卡片布局，但仍保持 Ways 的旅行档案定位，不引入关注 / 评论 / 粉丝结构
- `Profile` 默认主视图改为 `Archive Wall`，更适合直接浏览多条旅行档案
- 基于预置 `TrackSession` seed 和真实 session 数据统一派生档案卡，未新增第二套独立主页 mock

### 修改文件

- `app/(tabs)/profile.tsx` — 重写 Profile 页面布局与档案卡墙
- `wiki/13-stage-d.md` — 同步 Stage D 当前 Profile 形态
- `wiki/89-agent3-profile-tracker-wishlist.md` — 同步 Agent 3 的 Profile 口径
- `wiki/90-CHANGELOG.md` — 记录本次改版

## Profile 预置更多旅程 Mock

**日期：** 2026-04-23

### 变更

- 为“我的”页补充多条开发态 `TrackSession` mock 数据
- `Profile` 仍然只消费 `trackerStore.sessions`，但初始状态不再为空，Timeline / Atlas / Poster 可以直接看到多条旅程样本
- 新增西湖、莫干山、古镇、钱塘江骑行、富阳露营等不同风格的预置旅程

### 修改文件

- `lib/mock-data.ts` — 新增 `mockTrackSessions`
- `lib/store/trackerStore.ts` — 使用预置 session seed 初始化
- `wiki/13-stage-d.md` — 同步 Profile 开发态数据来源说明
- `wiki/90-CHANGELOG.md` — 记录本次 mock 数据补充

## Spot 内容抽屉兼容修复

**日期：** 2026-04-23

### 变更

- 修复 Spot 内容抽屉在读取 `spot.contents[0]` 时崩溃的问题
- 根因是 Agent 2 新版 `SpotDetail` 依赖 `contents / relatedWays` 字段，但运行时可能仍收到旧结构或缺失字段的 Spot 数据
- 前端 API 层现在会先将 `SpotDetail` 归一化为安全结构；`SpotSheet` 也增加了空数组兜底和无内容态展示

### 修改文件

- `lib/api.ts` — 为 `SpotDetail` 增加兼容归一化
- `components/SpotSheet.tsx` — 使用安全数组访问并补无内容态
- `wiki/90-CHANGELOG.md` — 记录本次兼容修复

## Agent 2：Explore 内容流改版

**日期：** 2026-04-23

### 变更

- 按 `wiki/87-three-agent-work-plan.md` 执行 Agent 2 的任务，新增 Explore 内容流改版交付文档
- Explore 页改为“路线优先，内容辅助”结构：增加 `heatBucket` 筛选、热门 / 新发现 / 经典 / 编辑精选切换、路线卡热度摘要
- Spot 抽屉从单点详情升级为 `SpotContent` 内容流，支持作者主页预览、相关档案摘要和相关路线标签
- 打通“从内容到路线”的前端闭环：Spot 内容可直接收进灵感池、加入 `DraftWay`，原生端长按 Spot / Web 端右键 Spot 可快速规划
- 前后端 mock / schema 同步扩展为 `SpotContent`、`UserProfileSummary`、`TravelArchiveSummary` 和 `heatBucket`

### 修改文件

- `wiki/89-agent2-explore-content-flow.md` — 新增 Agent 2 交付文档
- `app/(tabs)/explore.tsx` — 接入 Explore 筛选、状态提示、内容到路线转化
- `components/SpotSheet.tsx` — 改为 Spot 内容抽屉与博主主页预览
- `components/cards/WayCard.tsx` — 增加热度与内容摘要展示
- `components/map/MapExplorer.types.ts` / `components/map/MapExplorer.native.tsx` / `components/map/MapExplorer.web.tsx` / `components/map/SpotMarker.native.tsx` — 增加 Spot 长按快速规划入口
- `lib/types.ts` / `lib/labels.ts` / `lib/mock-data.ts` — 增加 Agent 2 领域类型、标签映射和前端 seed
- `server/schemas/way.py` / `server/schemas/spot.py` / `server/services/mock_data.py` — 同步 FastAPI schema 与 seed 数据
- `README.md` / `wiki/01-project-roadmap.md` / `wiki/02-system-architecture.md` / `wiki/85-backlog.md` / `wiki/87-three-agent-work-plan.md` — 同步当前能力与交付入口

## Agent 3：Profile / Tracker / Wishlist 沉淀链路

**日期：** 2026-04-23

### 变更

- 按 `wiki/86-first-version-feedback-todo.md` 和 `wiki/87-three-agent-work-plan.md` 收口 Agent 3 的任务边界
- 新增 `wiki/89-agent3-profile-tracker-wishlist.md`，明确 Profile 旅行档案、Tracker EXIF 沉淀、Wishlist 自动归类三条链路
- `Plan` 页 Wishlist 从平铺列表升级为端侧自动归类分组，支持按 `省份 / 城市 / 地区` 浏览并整组加入路线稿
- `trackerStore.toggleClusterTag()` 现在会同步刷新当前 session 的标签摘要，避免 Profile 旅行档案卡使用旧标签快照
- 同步更新 Stage B / C / D 与系统架构文档，说明当前自动归类和旅行档案同步规则

### 修改文件

- `app/(tabs)/plan.tsx` — 新增 Wishlist 自动归类分组与整组加入路线稿
- `lib/store/trackerStore.ts` — 标签点评后同步刷新 session 摘要
- `wiki/89-agent3-profile-tracker-wishlist.md` — 新增 Agent 3 交付文档
- `wiki/11-stage-b.md` — 新增 Wishlist 自动归类说明
- `wiki/12-stage-c.md` — 补充标签变化回写 session 摘要
- `wiki/13-stage-d.md` — 补充旅行档案标签同步规则
- `wiki/02-system-architecture.md` — 同步当前数据流
- `wiki/85-backlog.md` — 追加逆地理编码替换项

## Agent 1：产品决策与数据契约

**日期：** 2026-04-23

### 变更

- 按 `wiki/87-three-agent-work-plan.md` 执行 Agent 1 的任务，新增产品决策与数据契约文档
- 收口首页主交互、`Explore` 抽屉、`Profile` 定位、他人主页结构、热度口径、AI 规划和替代推荐的产品边界
- 新增 `UserProfile / TravelArchive / ArchiveStop / SpotContent / WayHeatSnapshot` 等术语与对象定义
- 在术语表、backlog、分工文档中同步补充 Agent 1 的正式交付入口

### 修改文件

- `wiki/88-agent1-product-data-contract.md` — 新增 Agent 1 交付文档
- `wiki/05-glossary.md` — 增补 Agent 1 新术语
- `wiki/87-three-agent-work-plan.md` — 回填 Agent 1 交付链接
- `wiki/85-backlog.md` — 同步专项 TODO 状态
- `wiki/90-CHANGELOG.md` — 记录本次文档交付

## 第一版修改意见整理

**日期：** 2026-04-23

### 变更

- 根据 `Ways第一版修改意见.docx` 新增一份结构化 TODO 文档
- 将原始口语化意见拆成 `P0 产品决策 / Profile / Explore / Plan / Tracker / 数据支撑` 六组可执行项
- 在 `Backlog` 中补充专项 TODO 入口，便于后续跟踪

### 修改文件

- `wiki/86-first-version-feedback-todo.md` — 新增第一版修改意见整理文档
- `wiki/85-backlog.md` — 增加专项 TODO 入口
- `wiki/90-CHANGELOG.md` — 记录本次文档整理

## 三个 Agent 分工文档

**日期：** 2026-04-23

### 变更

- 基于第一版修改意见 TODO，新增 3 个 agent 的分工文档
- 明确 Agent 1 / 2 / 3 的任务边界、对应 TODO 和交付物

### 修改文件

- `wiki/87-three-agent-work-plan.md` — 新增三方分工文档
- `wiki/85-backlog.md` — 增加专项 TODO 入口
- `wiki/90-CHANGELOG.md` — 记录本次文档整理

## Web 路线线条回退

**日期：** 2026-04-19

### 变更

- 回退 Web 端 Explore 地图上的路线线条绘制
- 保留 `mapbox-gl` 底图、选中路线后的地图聚焦，以及 Spot 顺序编号点位
- 原生端 `@rnmapbox/maps` 路线展示保持不动

### 修改文件

- `components/map/MapExplorer.web.tsx` — 删除 Web 端路线图层逻辑
- `wiki/10-stage-a.md` — 同步当前 Web 地图能力边界
- `wiki/90-CHANGELOG.md` — 记录本次回退

## Web 路线图层配置修复

**日期：** 2026-04-19

### 变更

- 修复 Web 端 `mapbox-gl` 在添加实线路线时抛出的 `line-dasharray: array expected, undefined found`
- 原因是之前把 `undefined` 也写进了 `paint.line-dasharray`
- 现在仅在主题确实定义虚线样式时才下发 `line-dasharray`

### 修改文件

- `components/map/MapExplorer.web.tsx` — 条件式构造 Web 路线图层 paint
- `wiki/90-CHANGELOG.md` — 补充本次兼容修复说明

## Explore 路线几何加密

**日期：** 2026-04-18

### 变更

- 将两条示例 Way 的 `previewPolyline` 从少量关键点扩成更密的采样折线
- 地图上的路线看起来更像实际走出来的线路，而不再像“Spot 之间的三点折线”
- 前端 fallback mock 与后端 seed 数据同步更新，避免本地 / API 两条链路视觉不一致

### 修改文件

- `lib/mock-data.ts` — 加密前端 fallback 路线几何
- `server/services/mock_data.py` — 加密后端 seed 路线几何
- `wiki/10-stage-a.md` — 同步 `previewPolyline` 的数据语义

### 关键决策

- 先直接提升示例数据质量，而不是在前端对稀疏点位做人造平滑
- `previewPolyline` 表示“路线采样几何”，不是“Spot 列表的简单连线”

## Explore 路线语义收口

**日期：** 2026-04-18

### 变更

- 删除选中路线时额外绘制的 Spot 点对点辅助线
- 保留 Spot 顺序编号，但路线展示重新完全依赖 `previewPolyline`
- 避免把“经过哪些 Spot”误画成“真实路线几何”

### 修改文件

- `components/map/MapExplorer.tsx` — 移除 Spot 简单连线
- `wiki/10-stage-a.md` — 同步路线与 Spot 的职责说明

### 关键决策

- 路线应该由路线几何表达，Spot 只承担节点和顺序信息
- 当前 mock / API 已经提供 `previewPolyline`，不需要再额外造一条点对点连线

## Explore 路线顺序辅助线

**日期：** 2026-04-18

### 变更

- 选中路线时，地图上的 Spot 节点增加顺序编号
- 曾尝试增加一条顺序辅助线，把各个 Spot 按 `1 → 2 → 3` 连起来
- 该方案后续被回退，因为会把 Spot 序列误表达成真实路线

### 修改文件

- `components/map/MapExplorer.tsx` — 接入顺序编号 marker
- `components/map/SpotMarker.tsx` / `.native.tsx` / `.web.tsx` — 增加序号展示
- `wiki/10-stage-a.md` — 同步顺序展示说明

### 关键决策

- 不覆盖原始路线预览线
- 编号直接放在 Spot marker 上，避免用户只看线但不知道先后顺序

## Mapbox Web 兼容修复

**日期：** 2026-04-18

### 变更

- 修复 Web 端填入 Mapbox token 后 Explore 页在 `WayLine` 处崩溃的问题
- 原因是 `@rnmapbox/maps` 的 Web 端只导出 `MapView`、`Camera`、`MarkerView`，不导出 `ShapeSource`、`LineLayer`、`PointAnnotation`
- 为 `WayLine` 和 `SpotMarker` 增加显式平台分发和 Web 专用实现，避免继续渲染未定义组件

### 修改文件

- `components/map/WayLine.tsx` / `components/map/WayLine.native.tsx` / `components/map/WayLine.web.tsx` — 显式平台分发并补上 Web 路线实现
- `components/map/SpotMarker.tsx` / `components/map/SpotMarker.native.tsx` / `components/map/SpotMarker.web.tsx` — 显式平台分发并补上 Web 标记实现
- `types/mapbox-web.d.ts` — 补充 `@rnmapbox/maps` 内部 Web context 的本地声明
- `wiki/10-stage-a.md` — 同步 Mapbox Web 兼容实现说明

### 关键决策

- 不再强行让 Web 端复用原生的 `ShapeSource` / `LineLayer` / `PointAnnotation`
- 继续保留同一个 `MapExplorer` API，对上层 Explore 页和 store 无侵入

## Mapbox Web 路线根因修复

**日期：** 2026-04-18

### 变更

- 确认 Web 端路线不显示的根因不在 token 或数据，而在 Web 路线渲染方案本身
- 删除 Web 端通过 `addSource/addLayer` 临时插入 Mapbox 图层的实现
- 改为使用 SVG 覆盖层按当前地图投影渲染路线，并直接 portal 到真实 map container，避免落在 `@rnmapbox/maps` Web 版的零尺寸 children 容器里

### 修改文件

- `components/map/WayLine.web.tsx` — 从 Mapbox GL 图层注入改为 SVG 覆盖层渲染
- `wiki/10-stage-a.md` — 同步 Web 路线实现方式

### 关键决策

- `@rnmapbox/maps` Web 端的稳定能力只有 `MapView`、`Camera`、`MarkerView`
- 路线使用覆盖层渲染，比继续依赖内部裸 `map` 的图层生命周期更可靠

## 地图栈回退：高德 → Mapbox

**日期：** 2026-04-18

### 变更

- Explore 地图从高德方案回退到 `@rnmapbox/maps + Mapbox GL`
- 删除高德专用的 Web / WebView 双实现，恢复单一 `MapExplorer.tsx`
- 恢复 `WayLine.tsx` 和 `SpotMarker.tsx`
- 环境变量从 `EXPO_PUBLIC_AMAP_WEB_KEY` 回退到 `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`
- 重新启用 `@rnmapbox/maps` 与 `mapbox-gl`，移除 `react-native-webview`

### 修改文件

- `components/map/MapExplorer.tsx` — 恢复 Mapbox 地图封装
- `components/map/WayLine.tsx` — 恢复路线线段渲染
- `components/map/SpotMarker.tsx` — 恢复 Spot 标记
- `constants/map-styles.ts` — 恢复 `MAPBOX_STYLE_URL`
- `package.json` — 恢复 Mapbox 依赖，移除 `react-native-webview`
- `README.md` / `wiki/02-system-architecture.md` / `wiki/06-conventions.md` / `wiki/10-stage-a.md` / `wiki/85-backlog.md` — 回退为 Mapbox 口径

### 关键决策

- 用户当前明确要求恢复到已验证过的 Mapbox 版本，优先回到此前能稳定工作的实现
- 保持 Explore 页组件接口不变，只回退底层地图实现，减少对上层页面和 store 的影响

## 地图栈切换：Mapbox → 高德

**日期：** 2026-04-16

### 变更

- Explore 地图从 `@rnmapbox/maps + Mapbox GL` 切换到高德地图方案
- Web 端改为直接加载高德 JS API 2.0
- iOS / Android 改为 `react-native-webview` 复用同一套高德地图页
- 移除 Mapbox 专用的 `WayLine.tsx`、`SpotMarker.tsx` 和样式 URL 常量
- Explore 地图环境变量从 `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` 改为 `EXPO_PUBLIC_AMAP_WEB_KEY`
- 新增可选的 `EXPO_PUBLIC_AMAP_SECURITY_JS_CODE`
- 无 key 时仍保留占位地图面板，保证主交互链路可预览

### 修改文件

- `components/map/MapExplorer.web.tsx` — Web 端高德地图加载、折线与 Spot marker 渲染
- `components/map/MapExplorer.native.tsx` — 移动端高德 WebView 容器与点击桥接
- `components/map/MapExplorer.types.ts` — 地图组件共享 props
- `components/map/amap.ts` — 高德 key、HTML、覆盖物与 marker 构建
- `constants/map-styles.ts` — 移除 Mapbox style URL，仅保留路线主题色
- `package.json` — 删除 Mapbox 依赖，新增 `react-native-webview`
- `README.md` / `wiki/01-project-roadmap.md` / `wiki/02-system-architecture.md` / `wiki/06-conventions.md` / `wiki/10-stage-a.md` / `wiki/13-stage-d.md` / `wiki/85-backlog.md` — 同步地图方案与环境变量

### 关键决策

- 不切到 `react-native-maps`：当前项目必须兼顾 Expo Web，而 `react-native-maps` 不适合作为统一地图底座
- 不继续维护 Mapbox fallback：目标已经明确转为中国可用性优先
- 采用“Web 直连高德 + 移动端 WebView 复用”的混合方案，以最低维护成本覆盖现有平台组合

## UI 重设计：Warm Cream 暖奶油风格

**日期：** 2026-04-15

### 变更

- 设计系统从 Apple HIG Native 切换为 Warm Cream
- 底色从冷灰 `#F2F2F7` 改为暖奶油 `#FAF9F6`
- 所有灰色从 slate/zinc 冷灰改为 stone 暖灰系
- 阴影从 `rgba(0,0,0,...)` 冷色改为 `rgba(120,100,70,...)` 金棕暖色
- 圆角从 8-20px 增大到 10-28px，更有机更温暖
- 强调色保持电光蓝 `#0A84FF`，搭配暖底提供现代感
- Tab Bar 改回浮动毛玻璃胶囊，暖色调阴影，蓝色 pill 激活态
- 收藏按钮使用暖红 `#FF6B6B` 替代冷红
- 标签气泡未选中态使用 `bgWash` 暖灰底色（无边框）
- 路线主题色改为大地色系（森林绿、酒红、深棕、石灰、琥珀）
- Poster 卡使用 warm charcoal 渐变背景
- 卡片改为暖阴影 + 无边框，替代之前的 hairline border

### 修改文件

- `constants/theme.ts` — 完全重写：暖色调 palette + 金棕阴影 + 有机圆角
- `constants/map-styles.ts` — 路线色改为大地色系
- `app/(tabs)/_layout.tsx` — 浮动毛玻璃 Tab Bar + 蓝色 pill 激活态
- `app/(tabs)/explore.tsx` — 暖色调页面
- `app/(tabs)/plan.tsx` — 暖分段控制 + 暖卡片
- `app/(tabs)/tracker.tsx` — 暖 hero card + 暖 grouped table
- `app/(tabs)/profile.tsx` — 暖统计 + charcoal poster
- `app/_layout.tsx` — 修复 bg token 引用
- `components/SpotSheet.tsx` — 暖红心形 + 暖弹窗
- `components/cards/WayCard.tsx` — 暖阴影 + 大圆角
- `components/ui/TagBubble.tsx` — bgWash 未选中底色
- `components/map/MapExplorer.tsx` — 暖调 fallback
- `components/map/SpotMarker.tsx` — 暖调标签
- `wiki/03-design-principle.md` — 完全重写设计原则

### 关键决策

- 暖奶油 + 电光蓝的搭配：温暖底色让 app 亲和有生活感，蓝色强调色防止过度甜腻并提供科技感
- 暖色调阴影是核心差异点：金棕 shadow 让卡片"自然地浮在暖底上"，而非冷灰阴影的生硬感
- 有机大圆角（20-28px）让整体视觉更柔软，对标小红书/Bear 的温暖质感

## 中文化与页面头部收敛

**日期：** 2026-04-15

### 变更

- 将 Tab、页面按钮、空状态、加载文案、错误提示、导航提示统一改为中文
- 新增 `components/ui/PageHeader.tsx`，用暖色信息头替代页面顶部单独的大号标题
- Explore 页改为“浮在地图上的信息头 + 右侧数据胶囊”
- Plan / Tracker / Profile 页改为“信息头 + 内容模块”的顶部结构
- 路线主题、Spot 分类和 Tracker 状态新增统一中文标签映射
- 外部导航的起点/终点名称改为中文

### 修改文件

- `components/ui/PageHeader.tsx` — 新增统一页面头部组件
- `lib/labels.ts` — 新增主题 / 分类 / 状态中文标签
- `app/(tabs)/_layout.tsx` — Tab 标题改为中文
- `app/(tabs)/explore.tsx` — 顶部改为信息头，加载 / 错误文案中文化
- `app/(tabs)/plan.tsx` — 信息头替换大标题，规划相关文案中文化
- `app/(tabs)/tracker.tsx` — 信息头替换大标题，记录相关文案中文化
- `app/(tabs)/profile.tsx` — 信息头替换大标题，足迹相关文案中文化
- `components/cards/WayCard.tsx` — 主题与统计文案中文化
- `components/map/MapExplorer.tsx` — Mapbox fallback 文案中文化
- `components/SpotSheet.tsx` — Spot Sheet 文案中文化
- `lib/api.ts` / `lib/store/wayStore.ts` / `lib/store/spotStore.ts` / `lib/store/trackerStore.ts` / `lib/navigation.ts` — 用户可见提示中文化

### 关键决策

- 不再让页面顶部只靠一个大中文标题撑视觉；标题信息拆成 eyebrow、主标题、说明文，更柔和也更易读
- 中文化不仅改页面表层，也覆盖到 error、Alert、加载态和外部导航名称，避免交互链路中途跳回英文

## UI 重设计：Apple HIG Native

**日期：** 2026-04-15

### 变更

- 设计系统从 Soft Glass 切换为 Apple HIG Native
- 移除所有 indigo-pink 渐变（按钮、图标、标签、Tab、Timeline 节点）
- Tab Bar 从浮动胶囊改为标准 iOS 底部 Tab Bar（hairline 顶部分隔线）
- 所有卡片从阴影堆叠改为 hairline border 分隔
- 标签气泡从渐变背景改为 `tint` 蓝色实色背景
- 收藏按钮从渐变圆改为红色心形图标（对标 Apple Maps）
- Plan/Profile 模式切换从自定义 toggle 改为 iOS segmented control
- Tracker hero card 从深色渐变改为白色卡片 + hairline border
- Profile stats 从深色渐变卡改为白色统计栏
- 字号阶梯从 11-32 切换为 iOS HIG 标准（11-34）
- 所有间距和触控区域对齐 44pt 标准
- 路线主题色更新为 iOS 系统色（green/purple/brown/gray/blue/orange）

### 修改文件

- `constants/theme.ts` — 完全重写设计 token（palette/spacing/radius/typography）
- `constants/map-styles.ts` — 路线主题色更新为 iOS 系统色
- `app/(tabs)/_layout.tsx` — 标准 iOS Tab Bar（移除 expo-blur/expo-linear-gradient 依赖）
- `app/(tabs)/explore.tsx` — 简化 header、移除 avatar 渐变
- `app/(tabs)/plan.tsx` — iOS segmented control、hairline 卡片、蓝色 timeline dot
- `app/(tabs)/tracker.tsx` — 白色 hero card、iOS grouped table 布局
- `app/(tabs)/profile.tsx` — 白色 stats 栏、iOS segmented control、黑色 poster 卡
- `components/SpotSheet.tsx` — 红色心形收藏、44pt 触控区域
- `components/cards/WayCard.tsx` — 简化为 scrim + 无阴影
- `components/ui/TagBubble.tsx` — 蓝色实色替代渐变
- `components/map/MapExplorer.tsx` — 更新到新 palette
- `components/map/SpotMarker.tsx` — 更新到新 palette
- `wiki/03-design-principle.md` — 完全重写设计原则文档

### 关键决策

- 选择 iOS System Blue (#007AFF) 作为唯一强调色，不再使用双色渐变
- 用 hairline border 替代 shadow 分隔卡片，符合 iOS 原生视觉规范
- Poster 卡保留深色背景（纯黑 #000000），作为唯一的"反色"场景

## Wiki 初始化

**日期：** 2026-04-14

### 新增
- 初始化 wiki 文档体系（9 个文件）
- 确定技术栈：React Native (Expo) + FastAPI + PostgreSQL/PostGIS + Mapbox
- 确定四阶段路线图：地基 → 规划 → 记录 → 个人
- 确定设计语言："硬核清爽"，深色主题为默认

### 关键决策
- 选 Expo Router 而非裸 React Navigation：file-based routing 更适合 Vibe Coding
- 选 Zustand 而非 Redux：轻量无 boilerplate
- 选 @rnmapbox/maps 而非 react-native-maps：自定义样式是核心需求
- 术语统一：路线叫 Way（不叫 Route），兴趣点叫 Spot（不叫 POI）

## Stage A 基线实现

**日期：** 2026-04-14

### 新增
- 创建 Expo Router 前端骨架：4 Tab 导航、Explore 页、Way 卡片、Spot 气泡窗
- 创建主题与地图样式常量：`constants/theme.ts`、`constants/map-styles.ts`
- 创建领域类型、API 封装和 Zustand store：`lib/types.ts`、`lib/api.ts`、`lib/store/*`
- 创建 FastAPI 后端骨架：`server/main.py`、`server/api/routes.py`、`server/api/spots.py`
- 提供 Stage A 示例接口：`GET /api/ways`、`GET /api/ways/{id}`、`GET /api/spots`、`GET /api/spots/{id}`、`GET /healthz`
- 创建 `README.md`，补充前后端启动方式

### 关键决策
- 当前后端使用内存 seed 数据，先跑通 Stage A 主链路，再在后续阶段接入 PostgreSQL / PostGIS
- 前端 API 请求失败时退化到本地 mock 数据，避免环境未就绪时 Explore 页不可预览
- Mapbox token 改为前端环境变量 `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`，与 Expo 运行时约束保持一致
- 在无 token 情况下提供占位地图面板，而不是展示空白地图

## Stage B 实现：规划工具

**日期：** 2026-04-15

### 新增
- 新增 `WishlistItem` 和 `DraftWay` 类型（`lib/types.ts`）
- 新增 Wishlist store（`lib/store/wishlistStore.ts`）：收藏/移除/查询 Spot
- 新增 Plan store（`lib/store/planStore.ts`）：路线构建（创建/命名/主题/添加/移除/排序/清空）
- 新增外部导航工具（`lib/navigation.ts`）：高德 → Google → Apple → Web 回退链
- SpotSheet 新增心形收藏按钮，支持渐变激活态
- Plan 页面完整重写：Wishlist 列表 + Route builder 双 tab 视图
- Route builder 支持 Timeline 可视化、主题选择、命名、上下排序、导航导出
- 创建 `wiki/11-stage-b.md` 完整文档

### 关键决策
- B 阶段纯前端实现，Wishlist 数据存于 Zustand 内存 store，不做后端持久化
- 排序使用上下箭头按钮而非长按拖拽，简单可靠跨平台一致
- 导航导出优先高德（国内用户）→ Google Maps → Apple Maps → Web 回退
- Wishlist 暂时只做列表视图，地图悬浮点视图留待后续迭代

## Stage C 实现：记录工作台

**日期：** 2026-04-15

### 新增
- 新增 Stage C 类型：`TrackerStatus`、`TrackPoint`、`TrackPhotoInput`、`PhotoCluster`、`TrackSession`
- 新增 `lib/tracker.ts`：轨迹距离计算、EXIF 坐标提取、照片去重、地理聚类、session 汇总
- 新增 `lib/store/trackerStore.ts`：定位采样、后台增强、照片导入、标签点评、本地历史管理
- 重写 `app/(tabs)/tracker.tsx`：Recording Hero、权限状态、照片簇、历史列表
- 增加 Expo 依赖：`expo-location`、`expo-task-manager`、`expo-image-picker`
- 更新 `app.json`：定位与相册权限文案、后台定位 plugin 配置
- 创建 `wiki/12-stage-c.md` 并同步路线图、架构文档、backlog

### 关键决策
- Stage C 先采用端侧 MVP：轨迹、照片和标签点评全部保存在 Zustand 内存 store，不做后端同步
- 轨迹记录以前台 `watchPositionAsync` 为主，后台增强作为自动升级能力，避免开发环境不可验证
- 照片聚类采用用户主动多选导入而非静默扫描全库，降低权限复杂度并保持 EXIF 数据质量可控
- 标签点评绑定到照片簇而不是单张图片，减少操作成本并更贴近“地点感受”

## Stage D 实现：个人资产库

**日期：** 2026-04-15

### 新增
- 新增 `FootprintJourney` 类型（`lib/types.ts`）
- 重写 `app/(tabs)/profile.tsx`：Journey 统计、Timeline 视图、Atlas 视图、Poster 模式
- 新增轻量路线缩略图绘制逻辑，用于资产卡片和海报预览
- 新增系统分享摘要动作，复用 React Native `Share.share()`
- 创建 `wiki/13-stage-d.md` 并同步路线图、架构文档

### 关键决策
- Stage D 直接复用 Stage C 的本地 session / cluster 数据，不再单独维护 mock journey
- Poster 当前渲染为应用内海报预览卡，不新增截图/文件导出原生依赖
- 分享能力先输出结构化摘要文案，位图海报导出留待后续增强

## 本地环境打通

**日期：** 2026-04-14

### 新增
- 创建本地 Python 虚拟环境 `.venv` 并安装 `server/requirements.txt`
- 安装前端依赖并补齐 Expo 运行时缺失包：`expo-asset`、`expo-font`、`react-dom`、`react-native-web`、`@expo/metro-runtime`、`mapbox-gl`
- 对齐 Expo SDK 52 推荐依赖版本：`react-native` 升到 `0.76.9`，`@expo/vector-icons` 固定到 `~14.0.4`

### 关键决策
- 将 `@rnmapbox/maps` 从范围版本改为精确版本 `10.1.36`，避免被解析到要求 `react-native >= 0.79` 的不兼容版本
- 从 `babel.config.js` 移除过时的 `expo-router/babel` 插件，避免 SDK 52 下持续出现弃用告警
- Web 端需要额外补齐 `expo-font` 与 `mapbox-gl`，否则会导致 `entry.bundle` 返回 Metro 错误 JSON 并在浏览器表现为脚本 MIME type 报错
- 本地验证以两个端口为准：Expo `http://localhost:8081` 返回 `200`，FastAPI `http://127.0.0.1:8000/healthz` 返回 `{"status":"ok"}`
## 2026-04-19

### Web 地图渲染回切到纯 mapbox-gl

- Explore 页保留原生端 `@rnmapbox/maps` 实现不动
- Web 端 `MapExplorer` 改为纯 `mapbox-gl`，直接将 `previewPolyline` 注入 GeoJSON source + line layer
- 修正地图组件平台入口，避免 Web 错误落到 native 导出，导致地图或路线组件不可用
- Wiki 同步更新为「原生端与 Web 分栈渲染」约定
