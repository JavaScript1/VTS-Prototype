/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MOCK_RISK_HEATMAP_POINTS = Array.from({ length: 50 }, () => ({
  lat: 31.2 + Math.random() * 0.4,
  lng: 121.4 + Math.random() * 0.6,
  intensity: Math.random(),
}));

export const MOCK_RISK_TIME_DISTRIBUTION = [
  { label: '00:00', value: 120 },
  { label: '04:00', value: 80 },
  { label: '08:00', value: 450 }, // Morning peak
  { label: '12:00', value: 300 },
  { label: '16:00', value: 520 }, // Evening peak
  { label: '20:00', value: 200 },
];

export const MOCK_OPERATOR_EFFICIENCY = [
  { name: '值班员 A', cases: 145, efficiency: '98%' },
  { name: '值班员 B', cases: 132, efficiency: '95%' },
  { name: '值班员 C', cases: 168, efficiency: '92%' },
  { name: '值班员 D', cases: 110, efficiency: '99%' },
];

export const MOCK_SERVICE_DIMENSIONS = [
  { category: '引航调度', ratio: '35%', efficiency: '88%' },
  { category: '泊位管理', ratio: '25%', efficiency: '94%' },
  { category: '应急搜救', ratio: '15%', efficiency: '100%' },
  { category: '常规监管', ratio: '25%', efficiency: '91%' },
];
