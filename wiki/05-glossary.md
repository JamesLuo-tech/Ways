<!-- Last verified: 2026-04-14 | Current stage: A -->

# 术语表

> 统一项目中的领域术语，防止 Agent 用错词或混用近义词。

| 术语 | 定义 | 不要混淆 |
|------|------|---------|
| Spot | 地图上的单个兴趣点（景点、营地、咖啡馆等） | 不叫 POI、Point、Marker |
| Way | 由多个 Spot 串联而成的主题路线 | 不叫 Route（Route 保留给导航 SDK）、不叫 Trip |
| Track | 用户实际行走产生的 GPS 轨迹记录 | 不叫 Route、不叫 Way（Way 是规划的，Track 是实际的） |
| 锚点 | Way 在地图上的可视化线段，带主题色 | 不叫路线线段、不叫 Polyline（代码里可以用 polyline，UI 文案用锚点） |
| 气泡窗 | 点击 Spot 后弹出的半屏 Bottom Sheet | 不叫弹窗、不叫 Modal、不叫详情页 |
| 灵感池 | 用户收藏的 Spot 集合（Wishlist） | 不叫收藏夹、不叫 Bookmark |
| 连点成线 | 从灵感池选 Spot 串联为 Way 的交互 | 不叫路线规划（太笼统） |
| 标签点评 | 用预设气泡标签（非文字）对 Spot 做评价 | 不叫评论、不叫评分、不叫 Review |
| 足迹 | 用户完成的 Track + 关联照片 + 标签的合集 | 不叫轨迹（轨迹是 Track，足迹是 Track + 内容） |
| 海报 | 足迹生成的可分享长图 | 不叫截图、不叫分享图 |
| 主题 (Theme) | Way 的分类标签（hiking/wine/coffee 等） | 不叫类型、不叫分类（代码里用 theme 字段） |
| UserProfile | 用户主页资料结构，适用于“我的主页”和“他人主页” | 不叫社交主页 |
| TravelArchive | 一次旅行沉淀后的资产容器，可由真实轨迹或手动整理生成 | 不等于 TrackSession |
| ArchiveStop | 旅行档案中的有序停留节点 | 不等于 Spot 本体 |
| SpotContent | Spot 下的轻量内容卡，承接 Explore 内容流 | 不叫帖子、不叫动态 |
| Route Signature | 旅行档案封面上的简化路线签名 | 不等于地图主渲染线 |
| heatBucket | 路线热度档位，用于筛选和排序 | 不直接显示原始热度分数 |
