<!-- Last verified: 2026-05-14 | Current stage: D on top of C, PostgreSQL integrated, Auth complete -->

# 系统架构

## 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 前端框架 | React Native (Expo SDK 52+) | ~52 |
| 导航 | Expo Router (file-based routing) | ~4 |
| 地图 | 原生 `@rnmapbox/maps` + Web `mapbox-gl` | ~10 / 2.15 |
| 状态管理 | Zustand | ~5 |
| 后端 | Python FastAPI | ~0.115 |
| ORM | SQLAlchemy + GeoAlchemy2 | ~2.0 |
| 数据库 | PostgreSQL 16 + PostGIS 3.4 | — |
| 对象存储 | Supabase Storage (S3 兼容) | — |
| 部署 | Docker + Fly.io / Railway | — |

## 当前实现状态（2026-04-29）

- 已落地 Stage A 基线：Expo Router 4 Tab、Explore 地图探索页、Way 卡片、锚点渲染、Spot 气泡窗
- 已落地 Stage B 规划工具：Wishlist 收藏、连点成线路线构建、排序、外部导航导出
- 已落地 Stage C 记录工具：实时轨迹采样、后台增强开关、EXIF 照片聚类、标签点评、本地 session 历史
- 已落地 Stage D MVP：Profile 足迹资产库、Atlas 图谱视图、Poster 海报预览、系统分享摘要
- 已落地 Agent 2 Explore 改版：`heatBucket` 路线筛选、Spot 内容抽屉、轻量博主主页预览、内容到 Wishlist / `DraftWay` 的转化
- UI 已从 Apple HIG Native 切换为 Warm Cream 设计系统：暖奶油底色 (#FAF9F6)、电光蓝强调色 (#0A84FF)、暖色调阴影、有机大圆角、浮动毛玻璃 Tab Bar
- 已落地 FastAPI 示例接口：`GET /api/ways`、`GET /api/ways/{id}`、`GET /api/spots`、`GET /api/spots/{id}`、`GET /healthz`
- 已落地 PostgreSQL 集成：SQLAlchemy 2.0 异步 ORM（GeoAlchemy2）、Alembic 迁移管理、`server/db/` ORM 层、`server/scripts/seed.py` 初始数据导入
- 已落地完整 Auth（Tasks 2–8）：`User` ORM 模型（`server/db/models.py`）、Alembic 迁移 `002_add_users`、Pydantic auth schemas（`server/schemas/auth.py`）、`get_current_user` JWT 依赖（`server/dependencies.py`）、auth router（`server/api/auth.py`）已注册到 `server/main.py`
- 前端已回退到 Mapbox 方案，Explore 页在原生端继续使用 `@rnmapbox/maps`，Web 端单独使用纯 `mapbox-gl`
- 前端在未设置 `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` 时会退化为占位地图面板，便于先跑通交互链路
- Explore 地图在进入 SDK 前会统一校验 `Coordinate`，过滤非法 `previewPolyline` / Spot 坐标；Web 端 Mapbox 瓦片、session、events 等短暂资源请求失败不再作为致命加载失败处理
- Stage B 数据（Wishlist、DraftWay）纯前端 Zustand 管理，暂不持久化；Wishlist 会在端侧做自动归类分组
- Stage C 数据（TrackSession、PhotoCluster、标签点评）同样纯前端 Zustand 管理，当前不做跨重启持久化
- Stage D 数据当前直接派生自 Stage C 的 `trackerStore` session / cluster 摘要，不再维护独立 mock footprint；标签点评变化会回写 session 摘要

## 目录结构

```
ways/
├── app/                          # Expo Router 页面
│   ├── (tabs)/                   # Tab 导航组
│   │   ├── explore.tsx           # 探索页
│   │   ├── plan.tsx              # 规划页
│   │   ├── tracker.tsx           # 记录页
│   │   └── profile.tsx           # 我的页
│   ├── _layout.tsx               # 根布局
├── components/                   # 可复用组件
│   ├── map/                      # 地图相关组件
│   │   ├── geo.ts                # 地图坐标校验与边界计算
│   ├── cards/                    # 卡片组件
│   └── ui/                       # 基础 UI 组件
├── lib/                          # 工具函数 + hooks
│   ├── api.ts                    # API 客户端
│   ├── mock-data.ts              # Stage A 前端 fallback seed
│   ├── navigation.ts             # 外部导航 deep link 工具
│   ├── tracker.ts                # Stage C 轨迹与聚类工具
│   ├── store/                    # Zustand stores
│   │   ├── wayStore.ts           # 路线列表 store（含 heatBucket）
│   │   ├── spotStore.ts          # Spot 内容抽屉 store
│   │   ├── wishlistStore.ts      # 灵感池收藏 store
│   │   ├── planStore.ts          # 路线构建 store
│   │   └── trackerStore.ts       # 记录工作台 store，同时为 Stage D 提供资产摘要
│   └── types.ts                  # 领域类型
├── constants/                    # 主题、配置常量
│   ├── theme.ts                  # 设计 token
│   └── map-styles.ts             # Mapbox 样式配置
├── server/                       # FastAPI 后端
│   ├── main.py                   # 入口
│   ├── requirements.txt          # 后端依赖
│   ├── api/                      # 路由
│   │   ├── auth.py               # Auth API（register / login / me）
│   │   ├── routes.py             # 路线 API
│   │   ├── spots.py              # Spot API
│   │   ├── tracker.py            # Tracker API（会话保存 / 列表 / 详情 / 删除）
│   ├── schemas/                  # Pydantic schemas
│   │   ├── auth.py               # RegisterRequest / LoginRequest / TokenResponse / UserResponse
│   │   ├── content.py            # CreateWayRequest / PatchWayRequest / CreateSpotRequest / PatchSpotRequest
│   │   ├── tracker.py            # TrackSessionCreate / TrackSessionResponse 等 tracker schemas
│   ├── dependencies.py           # FastAPI 依赖：get_current_user（JWT Bearer）
│   ├── services/                 # 业务逻辑 / seed 数据
│   ├── db/                       # 数据库层
│   │   ├── engine.py             # SQLAlchemy 异步引擎 + Base + get_db
│   │   └── models.py             # ORM 模型（Way、Spot、User，含 PostGIS geometry）
│   ├── scripts/                  # 实用脚本
│   │   └── seed.py               # 将 mock 数据导入数据库的初始 seed 脚本
│   └── alembic/                  # Alembic 迁移脚本目录
│       ├── env.py                # 异步迁移环境配置
│       ├── script.py.mako        # 迁移文件模板
│       └── versions/             # 生成的迁移版本文件
│           └── 002_add_users.py  # users 表迁移
├── alembic.ini                   # Alembic 配置（script_location = server/alembic）
├── tests/                        # API 测试套件
├── wiki/                         # 项目文档
└── package.json
```

## 数据流

```
┌─────────────┐     HTTPS/JSON      ┌──────────────┐
│  React Native│ ──────────────────→ │   FastAPI     │
│  (Expo)      │ ←────────────────── │   Server      │
└─────────────┘                      └──────────────┘
       │                                    │
       │ Mapbox token                        │ SQLAlchemy async ORM (GeoAlchemy2)
       ↓                                    ↓
┌──────────────┐                      ┌──────────────┐
│  Mapbox CDN   │                      │ PostgreSQL +  │
└──────────────┘                      │ PostGIS       │
                                      │ (integrated)  │
                                      └──────────────┘
```

- 前端通过 REST API 与后端通信
- Stage A 后端现由 PostgreSQL + PostGIS 驱动，通过 `server/scripts/seed.py` 导入初始数据；前端保留 fallback seed，便于未装数据库时快速预览
- Agent 2 新增的 `SpotContent / UserProfileSummary / TravelArchiveSummary / heatBucket` 仍然由同一组 mock 数据驱动
- Stage C 当前在端侧完成轨迹采样、图片导入、聚类和标签点评，尚未回传后端
- 轨迹缓存、照片直传属于后续 Stage 的实现项
- Stage D 的分享能力当前只输出系统分享文案，未导出位图海报文件
- Stage D 当前使用 `TrackSession.centroid` 作为地域摘要，未做逆地理编码

## 核心类型

```typescript
// 地理坐标
type Coordinate = [longitude: number, latitude: number];

type SpotCategory = 'scenic' | 'food' | 'camp' | 'viewpoint' | 'culture' | 'other';
type HeatBucket = 'emerging' | 'hot' | 'classic' | 'editorial';

interface UserProfileSummary {
  id: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  homeBase: string;
}

interface TravelArchiveSummary {
  id: string;
  title: string;
  regionName: string;
  routeSignature: Coordinate[];
}

interface SpotContent {
  id: string;
  spotId: string;
  owner: UserProfileSummary;
  archive: TravelArchiveSummary;
  coverAssetUrl: string;
  capturedAt: string;
  tags: string[];
}

interface SpotDetail {
  id: string;
  name: string;
  coordinate: Coordinate;
  category: SpotCategory;
  tags: string[];
  photos: { url: string; takenAt: string }[];
  wayIds: string[];
  contents: SpotContent[];
}

// Way — 路线
interface Way {
  id: string;
  name: string;
  theme: WayTheme;
  spots: SpotRef[];          // 有序 Spot 引用
  polyline: Coordinate[];    // 路线几何
  distance: number;          // 米
  duration: number;          // 预计秒数
  heatBucket: HeatBucket;
}

type WayTheme = 'hiking' | 'wine' | 'coffee' | 'ancient-town' | 'cycling' | 'custom';

// 主题 → 视觉映射（用于地图锚点渲染）
const themeStyles: Record<WayTheme, { color: string; dashArray?: number[] }> = {
  hiking:       { color: '#1B5E20' },                    // 深绿实线
  wine:         { color: '#FF6D00', dashArray: [4, 2] }, // 橙色发光虚线
  coffee:       { color: '#795548' },                    // 棕色
  'ancient-town': { color: '#5D4037', dashArray: [6, 3] },
  cycling:      { color: '#0277BD' },
  custom:       { color: '#607D8B' },
};

// Track — 用户实际轨迹
interface Track {
  id: string;
  wayId?: string;             // 可关联到某条路线
  points: TrackPoint[];
  startedAt: string;
  endedAt: string;
  photos: TrackPhoto[];
}

interface TrackPoint {
  coordinate: Coordinate;
  altitude: number;
  timestamp: string;
  speed: number;
}

interface TrackPhoto {
  url: string;
  coordinate: Coordinate;
  takenAt: string;
  tags: string[];
}
```

## API 路由概览

> 完整请求/响应细节见 `04-api-reference.md`（待创建）。

| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/api/spots` | 获取区域内 Spots（bbox 查询） |
| GET | `/api/spots/{id}` | Spot 详情 |
| GET | `/api/ways` | 获取区域内路线 |
| GET | `/api/ways/{id}` | 路线详情 |
| POST | `/api/auth/register` | 用户注册（返回 JWT accessToken） |
| POST | `/api/auth/login` | 用户登录 / 获取 JWT |
| GET | `/api/auth/me` | 获取当前用户信息（Bearer token 鉴权） |
| POST | `/api/tracker/sessions` | 保存轨迹会话（需 auth） |
| GET | `/api/tracker/sessions` | 列出当前用户的会话（需 auth） |
| GET | `/api/tracker/sessions/{id}` | 会话详情，含全量 GPS 点（需 auth，仅限本人） |
| DELETE | `/api/tracker/sessions/{id}` | 删除会话（需 auth，仅限本人） |
| POST | `/api/ways` | 创建路线（需 auth） |
| PATCH | `/api/ways/{id}` | 部分更新路线（需 auth，本人） |
| DELETE | `/api/ways/{id}` | 删除路线（需 auth，本人） |
| POST | `/api/spots` | 创建地点（需 auth） |
| PATCH | `/api/spots/{id}` | 部分更新地点（需 auth，本人） |
| DELETE | `/api/spots/{id}` | 删除地点（需 auth，本人） |

> 当前已实现：`GET /api/spots`、`GET /api/spots/{id}`、`GET /api/ways`、`GET /api/ways/{id}`、`GET /healthz`、`POST /api/auth/register`、`POST /api/auth/login`、`GET /api/auth/me`、`POST /api/tracker/sessions`、`GET /api/tracker/sessions`、`GET /api/tracker/sessions/{id}`、`DELETE /api/tracker/sessions/{id}`、`POST /api/ways`、`PATCH /api/ways/{id}`、`DELETE /api/ways/{id}`、`POST /api/spots`、`PATCH /api/spots/{id}`、`DELETE /api/spots/{id}`

## 数据库表

| 表名 | 主要列 | 备注 |
|------|--------|------|
| `ways` | id, name, theme, polyline, distance, duration, heat_bucket, **owner_id VARCHAR NULL** | PostGIS geometry 存储路线几何；`owner_id` 关联 `users.id`，NULL 表示系统内容 |
| `spots` | id, name, coordinate, category, tags, **owner_id VARCHAR NULL** | PostGIS geometry 存储坐标；`owner_id` 关联 `users.id`，NULL 表示系统内容 |
| `users` | id, email, hashed_password, display_name, avatar_url, bio, home_base, created_at | 用户账号表，`002_add_users` 迁移创建 |
| `track_sessions` | id, user_id, started_at, ended_at, track (LINESTRING), points (JSONB), photo_clusters (JSONB), tags, distance_m, duration_s, created_at | 用户轨迹会话，PostGIS LINESTRING 存储路径几何 |

## 环境变量

| 变量 | 用途 | 默认值 |
|------|------|--------|
| `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` | Expo 前端 Mapbox token | — |
| `EXPO_PUBLIC_API_BASE_URL` | Expo 前端 API 基地址 | `http://127.0.0.1:8000` |
| `DATABASE_URL` | PostgreSQL 异步连接串（**必填**，asyncpg 驱动） | `postgresql+asyncpg://user:pass@localhost/ways` |
| `SUPABASE_URL` | Supabase 项目 URL | — |
| `SUPABASE_ANON_KEY` | Supabase 匿名 key | — |
| `JWT_SECRET` | JWT 签名密钥（**必填**） | — |

## 构建命令

```bash
# 前端开发
npm install
npm run start

# 后端开发
pip install -r server/requirements.txt
uvicorn server.main:app --reload

# 数据库迁移（从项目根目录运行）
alembic upgrade head
alembic current        # 查看当前版本

# 导入初始 seed 数据
python -m server.scripts.seed

# iOS 构建
npx expo run:ios

# Android 构建
npx expo run:android
```
