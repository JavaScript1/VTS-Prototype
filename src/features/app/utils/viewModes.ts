export type HomeViewMode =
  | 'normal'
  | 'smart-duty'
  | 'risk-analysis'
  | 'case-playback'
  | 'emergency-rescue';

export const HOME_VIEW_MODE_OPTIONS: Array<{
  id: HomeViewMode;
  label: string;
}> = [
  { id: 'normal', label: '常规模式' },
  { id: 'smart-duty', label: '智能值班模式' },
  { id: 'risk-analysis', label: '风险分析' },
  { id: 'case-playback', label: '执法力量' },
  { id: 'emergency-rescue', label: '应急力量' },
];
