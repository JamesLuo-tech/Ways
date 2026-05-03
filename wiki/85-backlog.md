<!-- Last verified: 2026-04-23 | Current stage: D on top of C -->

# Backlog

> 临时 bug、技术债、改进想法。解决后移除或转入对应 stage 文件。

## Bug

（暂无）

## 技术债

- [ ] 用 SQLAlchemy + PostgreSQL/PostGIS 替换 `server/services/mock_data.py`
- [ ] 在 Dev Client / 真机环境执行一轮 Stage C 真机冒烟测试（定位权限、后台增强、图片导入）
- [ ] Explore 页改为视口变化时请求 `GET /api/ways` 与 `GET /api/spots`
- [ ] 补齐 `server/models/`、迁移脚本和数据库初始化流程
- [ ] Stage C 记录数据接入 AsyncStorage / SQLite，避免重启丢失

## 改进想法

- [ ] 地图离线瓦片缓存，支持无信号区域使用
- [ ] Spot 数据的初始 seed 方案（爬取公开 POI 数据 or 手动录入）
- [ ] 路线推荐算法（基于用户历史偏好）
- [ ] 多语言支持（中/英）
- [ ] 数据导入：支持从 GPX 文件导入轨迹
- [ ] Tracker 页增加轨迹地图回放和照片簇地图投影
- [ ] 用真实逆地理编码替换 Wishlist 当前的端侧坐标启发式归类

## 专项 TODO

- [x] 第一版修改意见已整理为专项文档：`wiki/86-first-version-feedback-todo.md`
- [x] 三个 Agent 的分工文档：`wiki/87-three-agent-work-plan.md`
- [x] Agent 1 产品决策与数据契约交付：`wiki/88-agent1-product-data-contract.md`
- [x] Agent 2 Explore 内容流改版交付：`wiki/89-agent2-explore-content-flow.md`

## 待验证

- [ ] Mapbox 免费额度是否满足初期用量（每月 25,000 次地图加载）
- [ ] expo-location 后台 GPS 采集的电量消耗实测
- [ ] @gorhom/bottom-sheet 与高德地图 WebView 手势冲突情况
- [ ] @gorhom/bottom-sheet 与 @rnmapbox/maps 手势冲突情况
- [ ] 无 `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` 时的占位地图是否满足内部预览需求
- [ ] Expo Go / Dev Client / 真机构建下 Background Boost 的可用性差异
- [ ] iOS / Android 相册 EXIF 字段差异是否会影响当前坐标解析逻辑
