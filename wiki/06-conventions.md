<!-- Last verified: 2026-04-14 | Current stage: A -->

# 编码约定

> 项目级编码偏好和约束。Agent 写代码前参考此文件。

## 库选择

| 用途 | 使用 | 不使用 | 原因 |
|------|------|--------|------|
| 导航 | Expo Router | React Navigation 直接使用 | Expo Router 基于 file-based routing，与 Expo 深度集成 |
| 地图 | @rnmapbox/maps | react-native-maps | Mapbox 支持自定义样式、深夜模式、矢量瓦片 |
| 状态管理 | Zustand | Redux / MobX | 轻量、无 boilerplate、支持持久化 |
| HTTP 请求 | fetch (React Native 内置) | axios | 减少依赖，RN 内置 fetch 够用 |
| 日期处理 | dayjs | moment / date-fns | moment 已废弃，dayjs 体积小 |
| 动画 | react-native-reanimated | Animated API | 性能更好，运行在 UI 线程 |
| 手势 | react-native-gesture-handler | RN 内置手势 | 拖拽排序等复杂手势必需 |
| ORM | SQLAlchemy 2.0 | Tortoise / Peewee | 生态最大，GeoAlchemy2 支持 PostGIS |
| 迁移 | Alembic | 手动 SQL | 自动生成迁移脚本 |
| 验证 | Pydantic v2 | marshmallow | FastAPI 原生集成 |

## 命名规范

| 对象 | 规范 | 示例 |
|------|------|------|
| React 组件 | PascalCase | `SpotCard`, `MapExplorer` |
| 组件文件 | PascalCase.tsx | `SpotCard.tsx` |
| Hook | camelCase，use 前缀 | `useLocation`, `useWayStore` |
| Zustand Store | camelCase，use 前缀 + Store 后缀 | `useWayStore` |
| API 路由文件 | snake_case.py | `spots.py`, `tracks.py` |
| Python 函数 | snake_case | `get_spots_in_bbox` |
| Python 模型 | PascalCase | `SpotModel`, `WayModel` |
| 数据库表名 | snake_case 复数 | `spots`, `ways`, `tracks` |
| TypeScript 类型 | PascalCase | `Spot`, `Way`, `TrackPoint` |
| CSS Token | kebab-case，`--` 前缀 | `--bg-primary`, `--text-secondary` |

## 代码模式

### 错误处理
- 前端：API 调用统一通过 `lib/api.ts` 封装，错误用 toast 提示
- 后端：FastAPI HTTPException，自定义 error code

### 类型约束
- 前端禁止 `any`，使用 `unknown` + 类型守卫
- 后端使用 Pydantic schema 做请求/响应验证

### 文件组织
- 组件内部状态用 `useState`，跨组件状态用 Zustand
- 一个 Zustand store 文件只管一个 domain（way、spot、track 各一个）

### 版本控制
- 不提交本地依赖和生成物：`node_modules/`、`.venv/`、`.expo/`、`__pycache__/`、`*.py[cod]`
- 不提交本地环境变量文件：`.env.local`
- 如果依赖目录曾被误加入 Git，上传前先从索引和历史中清理，保留本地文件即可

## 禁止项

- 不使用 `console.log` 做日志，开发用 `__DEV__` 守卫
- 不使用内联样式，统一用 `StyleSheet.create`
- 不在组件内直接调 fetch，通过 `lib/api.ts`
- 不使用 `enum`（TypeScript），用 `as const` 联合类型
