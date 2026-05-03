import type { HeatBucket, SpotCategory, TrackerStatus, WayTheme } from './types';

const WAY_THEME_LABELS: Record<WayTheme, string> = {
  hiking: '徒步',
  wine: '酒庄',
  coffee: '咖啡',
  'ancient-town': '古镇',
  cycling: '骑行',
  custom: '自定义',
};

const SPOT_CATEGORY_LABELS: Record<SpotCategory, string> = {
  scenic: '风景',
  food: '餐食',
  camp: '营地',
  viewpoint: '观景',
  culture: '人文',
  other: '其他',
};

const TRACKER_STATUS_LABELS: Record<TrackerStatus, string> = {
  idle: '待命',
  recording: '记录中',
  stopped: '已完成',
  error: '异常',
};

const HEAT_BUCKET_LABELS: Record<HeatBucket, string> = {
  emerging: '新发现',
  hot: '热门路线',
  classic: '经典路线',
  editorial: '编辑精选',
};

export function getWayThemeLabel(theme: WayTheme): string {
  return WAY_THEME_LABELS[theme];
}

export function getSpotCategoryLabel(category: SpotCategory): string {
  return SPOT_CATEGORY_LABELS[category];
}

export function getTrackerStatusLabel(status: TrackerStatus): string {
  return TRACKER_STATUS_LABELS[status];
}

export function getHeatBucketLabel(bucket: HeatBucket): string {
  return HEAT_BUCKET_LABELS[bucket];
}
