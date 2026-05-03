# Ways

按照 `wiki/` 文档实现的当前前端 MVP：

- Expo Router 4 Tab 导航
- Explore 地图探索页（路线优先 + Spot 内容抽屉 + 热门/精选筛选）
- Plan 路线规划工具（Wishlist / Route builder / 外部导航）
- Tracker 记录工作台（轨迹记录 / EXIF 照片聚类 / 标签点评）
- Profile 足迹资产库（直接复用 Tracker session / photo cluster 数据）
- FastAPI 示例接口

## 前端启动

```bash
npm install
npm run start
```

可选环境变量：

- `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token`

未设置 Mapbox token 时，Explore 页会显示占位地图面板，但交互链路仍可预览。

Explore 当前能力：

- 路线卡按 `heatBucket` 展示 `热门路线 / 新发现 / 经典路线 / 编辑精选`
- Spot 抽屉展示同一节点下的 `SpotContent` 内容卡，而不是单张点位详情
- 内容卡支持 `收进灵感池` 和 `加入路线稿`
- 点击内容作者可在抽屉内查看轻量博主主页预览
- 长按原生 Spot 节点，或在 Web 端右键 Spot 标记，可直接把节点加入路线稿

## 后端启动

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r server/requirements.txt
uvicorn server.main:app --reload
```

接口：

- `GET /healthz`
- `GET /api/ways`
- `GET /api/ways/{way_id}`
- `GET /api/spots/{spot_id}`
