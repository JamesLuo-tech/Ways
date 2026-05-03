from __future__ import annotations

from server.schemas.spot import (
    ArchiveStopSummary,
    SpotContent,
    SpotDetail,
    SpotPhoto,
    TravelArchiveStats,
    TravelArchiveSummary,
    UserProfileStats,
    UserProfileSummary,
    WayReference,
)
from server.schemas.way import SpotPreview, WayDetail, WayPreview


USER_PROFILES: dict[str, UserProfileSummary] = {
    "user-annie": UserProfileSummary(
        id="user-annie",
        displayName="Annie",
        avatarUrl="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
        bio="周末短途和咖啡路线采集者",
        homeBase="杭州",
        stats=UserProfileStats(archiveCount=12, distanceKm=148.2, spotCount=63, photoCount=418),
    ),
    "user-luca": UserProfileSummary(
        id="user-luca",
        displayName="Luca",
        avatarUrl="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
        bio="山路喝酒线和慢节奏补给点记录中",
        homeBase="德清",
        stats=UserProfileStats(archiveCount=8, distanceKm=92.4, spotCount=41, photoCount=205),
    ),
    "user-sora": UserProfileSummary(
        id="user-sora",
        displayName="Sora",
        avatarUrl="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80",
        bio="逆光机位和风景停留点搜集癖",
        homeBase="上海",
        stats=UserProfileStats(archiveCount=15, distanceKm=176.7, spotCount=88, photoCount=530),
    ),
}


ARCHIVE_SUMMARIES: dict[str, TravelArchiveSummary] = {
    "archive-westlake-dawn": TravelArchiveSummary(
        id="archive-westlake-dawn",
        title="西湖清晨咖啡环线",
        regionName="杭州西湖",
        routeSignature=[(120.143, 30.248), (120.154, 30.254), (120.168, 30.261)],
        stops=[
            ArchiveStopSummary(id="spot-solstice-beans", name="Solstice Beans", coordinate=(120.143, 30.248), category="food", region={"province": "浙江", "city": "杭州", "district": "西湖区", "area": "西湖西线"}, sequence=1),
            ArchiveStopSummary(id="spot-shaded-pier", name="湖畔阴影栈桥", coordinate=(120.154, 30.254), category="viewpoint", region={"province": "浙江", "city": "杭州", "district": "西湖区", "area": "西湖西线"}, sequence=2),
            ArchiveStopSummary(id="spot-forest-roaster", name="林间烘焙屋", coordinate=(120.168, 30.261), category="food", region={"province": "浙江", "city": "杭州", "district": "西湖区", "area": "灵隐片区"}, sequence=3),
        ],
        stats=TravelArchiveStats(distanceKm=8.6, durationHours=3.5, spotCount=3, photoCount=17),
    ),
    "archive-westlake-light": TravelArchiveSummary(
        id="archive-westlake-light",
        title="西湖逆光晨雾档案",
        regionName="杭州西湖",
        routeSignature=[(120.143, 30.248), (120.1502, 30.2512), (120.154, 30.254)],
        stops=[
            ArchiveStopSummary(id="spot-solstice-beans", name="Solstice Beans", coordinate=(120.143, 30.248), category="food", region={"province": "浙江", "city": "杭州", "district": "西湖区", "area": "西湖西线"}, sequence=1),
            ArchiveStopSummary(id="spot-shaded-pier", name="湖畔阴影栈桥", coordinate=(120.154, 30.254), category="viewpoint", region={"province": "浙江", "city": "杭州", "district": "西湖区", "area": "西湖西线"}, sequence=2),
        ],
        stats=TravelArchiveStats(distanceKm=5.2, durationHours=2.1, spotCount=2, photoCount=9),
    ),
    "archive-mogan-brew": TravelArchiveSummary(
        id="archive-mogan-brew",
        title="莫干山精酿慢爬线",
        regionName="莫干山",
        routeSignature=[(120.108, 30.262), (120.122, 30.271), (120.138, 30.279)],
        stops=[
            ArchiveStopSummary(id="spot-qingzhiwu", name="青芝坞入口", coordinate=(120.108, 30.262), category="scenic", region={"province": "浙江", "city": "湖州", "district": "德清", "area": "莫干山南线"}, sequence=1),
            ArchiveStopSummary(id="spot-bamboo-brew", name="竹林精酿站", coordinate=(120.122, 30.271), category="food", region={"province": "浙江", "city": "湖州", "district": "德清", "area": "莫干山南线"}, sequence=2),
            ArchiveStopSummary(id="spot-ridge-view", name="山脊观景台", coordinate=(120.138, 30.279), category="viewpoint", region={"province": "浙江", "city": "湖州", "district": "德清", "area": "莫干山山脊"}, sequence=3),
        ],
        stats=TravelArchiveStats(distanceKm=12.4, durationHours=5.0, spotCount=3, photoCount=14),
    ),
}


WAY_SPOTS: dict[str, list[SpotPreview]] = {
    "way-mogan-wine": [
        SpotPreview(id="spot-qingzhiwu", name="青芝坞入口", coordinate=(120.108, 30.262), category="scenic", region={"province": "浙江", "city": "湖州", "district": "德清", "area": "莫干山南线"}),
        SpotPreview(id="spot-bamboo-brew", name="竹林精酿站", coordinate=(120.122, 30.271), category="food", region={"province": "浙江", "city": "湖州", "district": "德清", "area": "莫干山南线"}),
        SpotPreview(id="spot-ridge-view", name="山脊观景台", coordinate=(120.138, 30.279), category="viewpoint", region={"province": "浙江", "city": "湖州", "district": "德清", "area": "莫干山山脊"}),
    ],
    "way-westlake-coffee": [
        SpotPreview(id="spot-solstice-beans", name="Solstice Beans", coordinate=(120.143, 30.248), category="food", region={"province": "浙江", "city": "杭州", "district": "西湖区", "area": "西湖西线"}),
        SpotPreview(id="spot-shaded-pier", name="湖畔阴影栈桥", coordinate=(120.154, 30.254), category="viewpoint", region={"province": "浙江", "city": "杭州", "district": "西湖区", "area": "西湖西线"}),
        SpotPreview(id="spot-forest-roaster", name="林间烘焙屋", coordinate=(120.168, 30.261), category="food", region={"province": "浙江", "city": "杭州", "district": "西湖区", "area": "灵隐片区"}),
    ],
    "way-ancient-town-slow": [
        SpotPreview(id="spot-stone-gate", name="石门巷口", coordinate=(120.268, 30.091), category="culture", region={"province": "浙江", "city": "嘉兴", "district": "桐乡", "area": "乌镇西栅"}),
        SpotPreview(id="spot-river-tea", name="河埠茶馆", coordinate=(120.276, 30.095), category="food", region={"province": "浙江", "city": "嘉兴", "district": "桐乡", "area": "乌镇西栅"}),
        SpotPreview(id="spot-ink-bridge", name="墨桥拱洞", coordinate=(120.283, 30.099), category="viewpoint", region={"province": "浙江", "city": "嘉兴", "district": "桐乡", "area": "乌镇东栅"}),
    ],
}


WAYS: list[WayPreview] = [
    WayPreview(
        id="way-mogan-wine",
        name="莫干山精酿之路",
        theme="wine",
        spotCount=len(WAY_SPOTS["way-mogan-wine"]),
        distance=12400,
        duration=18000,
        coverPhoto="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
        previewPolyline=[
            (120.108, 30.262),
            (120.1108, 30.2633),
            (120.1139, 30.2648),
            (120.1164, 30.2666),
            (120.1187, 30.2687),
            (120.1204, 30.2701),
            (120.122, 30.271),
            (120.1251, 30.2719),
            (120.1283, 30.2732),
            (120.1316, 30.2749),
            (120.1342, 30.2767),
            (120.1363, 30.2782),
            (120.138, 30.279),
        ],
        heatBucket="hot",
        contentCount=6,
        savedCountLabel="782 人收藏",
    ),
    WayPreview(
        id="way-westlake-coffee",
        name="西湖清晨咖啡环线",
        theme="coffee",
        spotCount=len(WAY_SPOTS["way-westlake-coffee"]),
        distance=8600,
        duration=12600,
        coverPhoto="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
        previewPolyline=[
            (120.143, 30.248),
            (120.1451, 30.2487),
            (120.1478, 30.2498),
            (120.1502, 30.2512),
            (120.1523, 30.2527),
            (120.154, 30.254),
            (120.1562, 30.2548),
            (120.1587, 30.2556),
            (120.1614, 30.2568),
            (120.1642, 30.2584),
            (120.1663, 30.2598),
            (120.168, 30.261),
        ],
        heatBucket="editorial",
        contentCount=7,
        savedCountLabel="编辑精选",
    ),
    WayPreview(
        id="way-ancient-town-slow",
        name="古镇慢晃茶点线",
        theme="ancient-town",
        spotCount=len(WAY_SPOTS["way-ancient-town-slow"]),
        distance=5900,
        duration=9600,
        coverPhoto="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
        previewPolyline=[
            (120.268, 30.091),
            (120.2706, 30.0921),
            (120.2731, 30.0934),
            (120.276, 30.095),
            (120.2794, 30.0971),
            (120.283, 30.099),
        ],
        heatBucket="emerging",
        contentCount=4,
        savedCountLabel="近 14 天升温",
    ),
]


WAY_DETAILS: dict[str, WayDetail] = {
    way.id: WayDetail(**way.model_dump(), spots=WAY_SPOTS[way.id]) for way in WAYS
}


def content(
    *,
    content_id: str,
    spot_id: str,
    owner_id: str,
    archive_id: str,
    cover_asset_url: str,
    captured_at: str,
    tags: list[str],
    visibility: str = "public",
    source_type: str,
) -> SpotContent:
    return SpotContent(
        id=content_id,
        spotId=spot_id,
        owner=USER_PROFILES[owner_id],
        archive=ARCHIVE_SUMMARIES[archive_id],
        coverAssetUrl=cover_asset_url,
        capturedAt=captured_at,
        tags=tags,
        visibility=visibility,
        sourceType=source_type,
    )


SPOTS: dict[str, SpotDetail] = {
    "spot-qingzhiwu": SpotDetail(
        id="spot-qingzhiwu",
        name="青芝坞入口",
        coordinate=(120.108, 30.262),
        category="scenic",
        tags=["机位极佳", "人烟稀少", "适合热身"],
        photos=[SpotPhoto(url="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80", takenAt="2026-03-15T10:30:00Z")],
        wayIds=["way-mogan-wine"],
        relatedWays=[WayReference(id="way-mogan-wine", name="莫干山精酿之路", heatBucket="hot")],
        contents=[
            content(
                content_id="content-qingzhiwu-1",
                spot_id="spot-qingzhiwu",
                owner_id="user-luca",
                archive_id="archive-mogan-brew",
                cover_asset_url="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
                captured_at="2026-03-15T10:30:00Z",
                tags=["机位极佳", "人烟稀少"],
                source_type="tracked",
            ),
            content(
                content_id="content-qingzhiwu-2",
                spot_id="spot-qingzhiwu",
                owner_id="user-sora",
                archive_id="archive-mogan-brew",
                cover_asset_url="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80",
                captured_at="2026-03-17T09:50:00Z",
                tags=["逆光友好", "建议轻装"],
                source_type="mixed",
            ),
        ],
    ),
    "spot-bamboo-brew": SpotDetail(
        id="spot-bamboo-brew",
        name="竹林精酿站",
        coordinate=(120.122, 30.271),
        category="food",
        tags=["适合微醺", "补给方便", "拍照友好"],
        photos=[SpotPhoto(url="https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=800&q=80", takenAt="2026-03-15T11:05:00Z")],
        wayIds=["way-mogan-wine"],
        relatedWays=[WayReference(id="way-mogan-wine", name="莫干山精酿之路", heatBucket="hot")],
        contents=[
            content(
                content_id="content-bamboo-1",
                spot_id="spot-bamboo-brew",
                owner_id="user-luca",
                archive_id="archive-mogan-brew",
                cover_asset_url="https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=900&q=80",
                captured_at="2026-03-15T11:05:00Z",
                tags=["适合微醺", "补给方便"],
                source_type="tracked",
            ),
            content(
                content_id="content-bamboo-2",
                spot_id="spot-bamboo-brew",
                owner_id="user-annie",
                archive_id="archive-mogan-brew",
                cover_asset_url="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80",
                captured_at="2026-03-20T11:40:00Z",
                tags=["适合停留", "补给方便"],
                source_type="planned",
            ),
        ],
    ),
    "spot-ridge-view": SpotDetail(
        id="spot-ridge-view",
        name="山脊观景台",
        coordinate=(120.138, 30.279),
        category="viewpoint",
        tags=["风大", "落日友好", "建议轻装"],
        photos=[SpotPhoto(url="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80", takenAt="2026-03-15T12:10:00Z")],
        wayIds=["way-mogan-wine"],
        relatedWays=[WayReference(id="way-mogan-wine", name="莫干山精酿之路", heatBucket="hot")],
        contents=[
            content(
                content_id="content-ridge-1",
                spot_id="spot-ridge-view",
                owner_id="user-sora",
                archive_id="archive-mogan-brew",
                cover_asset_url="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80",
                captured_at="2026-03-15T12:10:00Z",
                tags=["风大", "建议轻装"],
                source_type="tracked",
            ),
            content(
                content_id="content-ridge-2",
                spot_id="spot-ridge-view",
                owner_id="user-luca",
                archive_id="archive-mogan-brew",
                cover_asset_url="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
                captured_at="2026-03-18T17:48:00Z",
                tags=["值得二刷", "逆光友好"],
                source_type="mixed",
            ),
        ],
    ),
    "spot-solstice-beans": SpotDetail(
        id="spot-solstice-beans",
        name="Solstice Beans",
        coordinate=(120.143, 30.248),
        category="food",
        tags=["早开门", "豆单稳定", "座位紧凑"],
        photos=[SpotPhoto(url="https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80", takenAt="2026-03-22T07:20:00Z")],
        wayIds=["way-westlake-coffee"],
        relatedWays=[WayReference(id="way-westlake-coffee", name="西湖清晨咖啡环线", heatBucket="editorial")],
        contents=[
            content(
                content_id="content-solstice-1",
                spot_id="spot-solstice-beans",
                owner_id="user-annie",
                archive_id="archive-westlake-dawn",
                cover_asset_url="https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=900&q=80",
                captured_at="2026-03-22T07:20:00Z",
                tags=["早开门", "豆单稳定"],
                source_type="mixed",
            ),
            content(
                content_id="content-solstice-2",
                spot_id="spot-solstice-beans",
                owner_id="user-sora",
                archive_id="archive-westlake-light",
                cover_asset_url="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
                captured_at="2026-03-24T07:45:00Z",
                tags=["适合停留", "逆光友好"],
                source_type="planned",
            ),
        ],
    ),
    "spot-shaded-pier": SpotDetail(
        id="spot-shaded-pier",
        name="湖畔阴影栈桥",
        coordinate=(120.154, 30.254),
        category="viewpoint",
        tags=["逆光友好", "人流可控", "适合停留"],
        photos=[SpotPhoto(url="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80", takenAt="2026-03-22T08:05:00Z")],
        wayIds=["way-westlake-coffee"],
        relatedWays=[WayReference(id="way-westlake-coffee", name="西湖清晨咖啡环线", heatBucket="editorial")],
        contents=[
            content(
                content_id="content-pier-1",
                spot_id="spot-shaded-pier",
                owner_id="user-sora",
                archive_id="archive-westlake-light",
                cover_asset_url="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80",
                captured_at="2026-03-22T08:05:00Z",
                tags=["逆光友好", "适合停留"],
                source_type="tracked",
            ),
            content(
                content_id="content-pier-2",
                spot_id="spot-shaded-pier",
                owner_id="user-annie",
                archive_id="archive-westlake-dawn",
                cover_asset_url="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
                captured_at="2026-03-22T08:18:00Z",
                tags=["人烟稀少", "机位极佳"],
                source_type="mixed",
            ),
        ],
    ),
    "spot-forest-roaster": SpotDetail(
        id="spot-forest-roaster",
        name="林间烘焙屋",
        coordinate=(120.168, 30.261),
        category="food",
        tags=["适合补糖", "烘焙香浓", "适合收尾"],
        photos=[SpotPhoto(url="https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=800&q=80", takenAt="2026-03-22T09:10:00Z")],
        wayIds=["way-westlake-coffee"],
        relatedWays=[WayReference(id="way-westlake-coffee", name="西湖清晨咖啡环线", heatBucket="editorial")],
        contents=[
            content(
                content_id="content-forest-1",
                spot_id="spot-forest-roaster",
                owner_id="user-annie",
                archive_id="archive-westlake-dawn",
                cover_asset_url="https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=900&q=80",
                captured_at="2026-03-22T09:10:00Z",
                tags=["补给方便", "适合收尾"],
                source_type="tracked",
            ),
            content(
                content_id="content-forest-2",
                spot_id="spot-forest-roaster",
                owner_id="user-sora",
                archive_id="archive-westlake-light",
                cover_asset_url="https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=900&q=80",
                captured_at="2026-03-25T09:00:00Z",
                tags=["适合停留", "值得二刷"],
                source_type="planned",
            ),
        ],
    ),
    "spot-stone-gate": SpotDetail(
        id="spot-stone-gate",
        name="石门巷口",
        coordinate=(120.268, 30.091),
        category="culture",
        tags=["人烟稀少", "适合停留", "建议轻装"],
        photos=[SpotPhoto(url="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80", takenAt="2026-04-02T10:20:00Z")],
        wayIds=["way-ancient-town-slow"],
        relatedWays=[WayReference(id="way-ancient-town-slow", name="古镇慢晃茶点线", heatBucket="emerging")],
        contents=[
            content(
                content_id="content-stone-gate-1",
                spot_id="spot-stone-gate",
                owner_id="user-sora",
                archive_id="archive-westlake-light",
                cover_asset_url="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80",
                captured_at="2026-04-02T10:20:00Z",
                tags=["人烟稀少", "适合停留"],
                source_type="planned",
            ),
        ],
    ),
    "spot-river-tea": SpotDetail(
        id="spot-river-tea",
        name="河埠茶馆",
        coordinate=(120.276, 30.095),
        category="food",
        tags=["适合停留", "补给方便", "人流可控"],
        photos=[SpotPhoto(url="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80", takenAt="2026-04-02T11:05:00Z")],
        wayIds=["way-ancient-town-slow"],
        relatedWays=[WayReference(id="way-ancient-town-slow", name="古镇慢晃茶点线", heatBucket="emerging")],
        contents=[
            content(
                content_id="content-river-tea-1",
                spot_id="spot-river-tea",
                owner_id="user-annie",
                archive_id="archive-westlake-dawn",
                cover_asset_url="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
                captured_at="2026-04-02T11:05:00Z",
                tags=["适合停留", "补给方便"],
                source_type="planned",
            ),
        ],
    ),
    "spot-ink-bridge": SpotDetail(
        id="spot-ink-bridge",
        name="墨桥拱洞",
        coordinate=(120.283, 30.099),
        category="viewpoint",
        tags=["逆光友好", "值得二刷", "人烟稀少"],
        photos=[SpotPhoto(url="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80", takenAt="2026-04-02T11:45:00Z")],
        wayIds=["way-ancient-town-slow"],
        relatedWays=[WayReference(id="way-ancient-town-slow", name="古镇慢晃茶点线", heatBucket="emerging")],
        contents=[
            content(
                content_id="content-ink-bridge-1",
                spot_id="spot-ink-bridge",
                owner_id="user-sora",
                archive_id="archive-westlake-light",
                cover_asset_url="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
                captured_at="2026-04-02T11:45:00Z",
                tags=["逆光友好", "值得二刷"],
                source_type="mixed",
            ),
        ],
    ),
}

for way_spots in WAY_SPOTS.values():
    for spot_preview in way_spots:
        if spot_preview.id in SPOTS:
            SPOTS[spot_preview.id].region = spot_preview.region


def parse_bbox(bbox: str | None) -> tuple[float, float, float, float] | None:
    if bbox is None:
        return None

    parts = [segment.strip() for segment in bbox.split(",")]
    if len(parts) != 4:
        return None

    west, south, east, north = map(float, parts)
    return west, south, east, north


def is_point_in_bbox(point: tuple[float, float], bbox: tuple[float, float, float, float]) -> bool:
    west, south, east, north = bbox
    longitude, latitude = point
    return west <= longitude <= east and south <= latitude <= north


def filter_ways(bbox: str | None, theme: str | None, limit: int) -> tuple[list[WayPreview], int]:
    parsed_bbox = parse_bbox(bbox)
    result = WAYS

    if theme:
        result = [way for way in result if way.theme == theme]

    if parsed_bbox:
        result = [
            way
            for way in result
            if any(is_point_in_bbox(coordinate, parsed_bbox) for coordinate in way.previewPolyline)
        ]

    total = len(result)
    return result[:limit], total


def filter_spots(bbox: str | None, limit: int) -> tuple[list[SpotPreview], int]:
    parsed_bbox = parse_bbox(bbox)
    result = [
        SpotPreview(
            id=spot.id,
            name=spot.name,
            coordinate=spot.coordinate,
            category=spot.category,
            region=spot.region,
        )
        for spot in SPOTS.values()
    ]

    if parsed_bbox:
        result = [
            spot for spot in result if is_point_in_bbox(spot.coordinate, parsed_bbox)
        ]

    total = len(result)
    return result[:limit], total
