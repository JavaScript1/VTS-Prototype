import { type IntentItem } from '../../../types';

const getPrimaryIntentAction = (item: IntentItem) =>
  item.path.find((step) => step.status === 'active')?.action || '正常航行';

export const getCompactIntentLine = (item: IntentItem) =>
  `${getPrimaryIntentAction(item)} → ${item.destination}（${item.intentConfidence}%）`;

export const getCompactRiskLines = (item: IntentItem) => {
  const collisionRisk = item.risks[0];
  const tone = collisionRisk.level === '紧急' || collisionRisk.level === '警报' ? 'high' : 'medium';

  return [
    {
      tone,
      label: '风险：',
      text: `与${collisionRisk.counterparty || '目标船'}会遇｜CPA ${item.situation.cpa}`,
    },
    {
      tone,
      label: '会遇：',
      text: `${collisionRisk.location || item.current}｜${collisionRisk.timeToEncounter || `${item.situation.tcpa} 后`}`,
    },
  ];
};
