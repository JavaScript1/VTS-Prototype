export type HomeViewMode =
  | 'normal'
  | 'smart-duty'
  | 'auto'
  | 'risk-analysis'
  | 'case-playback'
  | 'emergency-rescue'
  | 'port-nav-coordination';

export const HOME_VIEW_MODE_OPTIONS: Array<{
  id: HomeViewMode;
  label: string;
}> = [
  { id: 'normal', label: '标准模式' },
  { id: 'smart-duty', label: '辅助模式' },
  { id: 'auto', label: '自动模式' },
  { id: 'risk-analysis', label: '风险态势' },
  { id: 'case-playback', label: '执法辅助' },
  { id: 'emergency-rescue', label: '应急处置' },
  { id: 'port-nav-coordination', label: '港航协同' },
];

export const HOME_PRIMARY_MODE_OPTIONS = HOME_VIEW_MODE_OPTIONS.filter((option) =>
  ['normal', 'smart-duty', 'auto'].includes(option.id),
);

export const HOME_ROUTE_MODE_OPTIONS = HOME_VIEW_MODE_OPTIONS.filter((option) =>
  ['risk-analysis', 'case-playback', 'emergency-rescue', 'port-nav-coordination'].includes(option.id),
);
