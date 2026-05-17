import type { PushMessage } from '../../../types';

const relaxedColdImage = new URL('../../../../AGENTS/image/悠闲-低温度.png', import.meta.url).href;
const relaxedHotImage = new URL('../../../../AGENTS/image/悠闲-高温度.png', import.meta.url).href;
const urgentColdImage = new URL('../../../../AGENTS/image/紧急-低温度.png', import.meta.url).href;
const urgentHotImage = new URL('../../../../AGENTS/image/紧急-高温度.png', import.meta.url).href;
const accidentImage = new URL('../../../../AGENTS/image/事故.png', import.meta.url).href;

export type MessageSeverityKind = 'normal' | 'emergency' | 'accident';
export type TemperatureBand = 'low' | 'high';

export type MessageFeedItem = PushMessage & {
  severityKind: MessageSeverityKind;
  temperatureBand: TemperatureBand;
};

type MessageTemplate = Omit<MessageFeedItem, 'id' | 'time'>;

type AvatarPresentation = {
  imageSrc: string;
  accentClass: string;
  title: string;
  description: string;
};

const NORMAL_MESSAGES: MessageTemplate[] = [
  {
    type: 'intent',
    title: '意图识别',
    content: "识别到 'COSCO SHIPPING' 意图：靠泊 粮油码头 A1",
    level: 'info',
    suggestion: '建议批准靠泊申请，并指派拖轮“沪港拖01”协助。',
    hasActions: true,
    severityKind: 'normal',
    temperatureBand: 'high',
  },
  {
    type: 'intent',
    title: '意图识别',
    content: "识别到 'EVER GIVEN' 意图：通过 苏伊士运河",
    level: 'info',
    suggestion: '建议保持当前航速，注意河道窄段。',
    hasActions: false,
    severityKind: 'normal',
    temperatureBand: 'high',
  },
  {
    type: 'intent',
    title: '意图识别',
    content: "识别到 'MAERSK ALABAMA' 意图：前往 锚地 A2",
    level: 'info',
    suggestion: '建议引导其进入 A2 锚地 3 号位。',
    hasActions: true,
    severityKind: 'normal',
    temperatureBand: 'low',
  },
  {
    type: 'warning',
    title: '预警信息',
    content: "预警：'SHIP A' 偏离航道 0.5nm",
    level: 'warning',
    suggestion: '系统已发出修正指令，建议值班员持续观察。',
    hasActions: true,
    severityKind: 'normal',
    temperatureBand: 'high',
  },
];

const EMERGENCY_MESSAGES: MessageTemplate[] = [
  {
    type: 'warning',
    title: '碰撞风险',
    content: "预警：'SHIP B' 与 'SHIP C' 存在碰撞风险 (CPA < 0.1nm)",
    level: 'emergency',
    suggestion: '立即通过 VHF 呼叫双方避让。',
    hasActions: true,
    severityKind: 'emergency',
    temperatureBand: 'high',
  },
  {
    type: 'warning',
    title: '进入禁区',
    content: "警报：'SHIP D' 进入禁航区",
    level: 'emergency',
    suggestion: '立即指派海巡船进行干预。',
    hasActions: true,
    severityKind: 'emergency',
    temperatureBand: 'high',
  },
  {
    type: 'warning',
    title: '应急联动',
    content: "预警：'SHIP E' 疑似失去动力，航速异常下降",
    level: 'warning',
    suggestion: '建议通知拖轮待命，并同步海巡力量前出。',
    hasActions: true,
    severityKind: 'emergency',
    temperatureBand: 'low',
  },
];

const ACCIDENT_MESSAGES: MessageTemplate[] = [
  {
    type: 'warning',
    title: '事故警情',
    content: "事故：'SHIP F' 与小型作业艇发生擦碰",
    level: 'emergency',
    suggestion: '立即启动事故处置预案，封控周边交通流。',
    hasActions: true,
    severityKind: 'accident',
    temperatureBand: 'high',
  },
  {
    type: 'warning',
    title: '事故警情',
    content: "事故：'SHIP G' 机舱冒烟，报告需要消防支援",
    level: 'emergency',
    suggestion: '立刻协调消防拖轮、海巡和医疗力量赶赴现场。',
    hasActions: true,
    severityKind: 'accident',
    temperatureBand: 'low',
  },
];

const WEATHER_MESSAGES: MessageTemplate[] = [
  {
    type: 'weather',
    title: '低温提醒',
    content: '冷空气已进入辖区，甲板结露风险提升',
    level: 'info',
    suggestion: '建议提醒值班船舶降低露天作业强度，注意甲板防滑。',
    hasActions: false,
    severityKind: 'normal',
    temperatureBand: 'low',
  },
  {
    type: 'weather',
    title: '天气提醒',
    content: '区域 A 预计 10 分钟后有强降雨',
    level: 'info',
    suggestion: '建议周边船舶减速航行。',
    hasActions: false,
    severityKind: 'normal',
    temperatureBand: 'high',
  },
  {
    type: 'weather',
    title: '大风预警',
    content: '阵风达到 7 级，请注意航行安全',
    level: 'warning',
    suggestion: '建议锚泊船加强值班，防止走锚。',
    hasActions: false,
    severityKind: 'normal',
    temperatureBand: 'high',
  },
];

const MESSAGE_BUCKETS = [
  { weight: 0.58, items: NORMAL_MESSAGES },
  { weight: 0.24, items: EMERGENCY_MESSAGES },
  { weight: 0.08, items: ACCIDENT_MESSAGES },
  { weight: 0.1, items: WEATHER_MESSAGES },
];

function pickBucket() {
  const roll = Math.random();
  let cursor = 0;

  for (const bucket of MESSAGE_BUCKETS) {
    cursor += bucket.weight;
    if (roll <= cursor) {
      return bucket.items;
    }
  }

  return NORMAL_MESSAGES;
}

function pickTemplate() {
  const bucket = pickBucket();
  return bucket[Math.floor(Math.random() * bucket.length)];
}

export function createMessageFeedItem(maxMessagesTime = new Date()): MessageFeedItem {
  const template = pickTemplate();

  return {
    ...template,
    id: Math.random().toString(36).slice(2, 11),
    time: maxMessagesTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
}

export function getAvatarPresentation(messages: MessageFeedItem[]): AvatarPresentation {
  const latestMessage = messages[0] ?? null;
  const weatherSource =
    latestMessage?.type === 'weather'
      ? latestMessage.temperatureBand
      : messages.find((message) => message.type === 'weather')?.temperatureBand ??
        latestMessage?.temperatureBand ??
        'high';

  const topSeverity = latestMessage?.severityKind ?? 'normal';

  if (topSeverity === 'accident') {
    return {
      imageSrc: accidentImage,
      accentClass: 'border-red-500/20 bg-red-500/8',
      title: '事故处置中',
      description: '已切换事故应急形象，建议优先关注事故类消息并同步联动力量。',
    };
  }

  if (topSeverity === 'emergency') {
    return {
      imageSrc: weatherSource === 'low' ? urgentColdImage : urgentHotImage,
      accentClass: 'border-orange-500/20 bg-orange-500/8',
      title: weatherSource === 'low' ? '紧急值守·低温' : '紧急值守·高温',
      description:
        weatherSource === 'low'
          ? '当前存在紧急消息，且天气偏冷，数字人切换为低温应急值守形象。'
          : '当前存在紧急消息，且天气偏热，数字人切换为高温应急值守形象。',
    };
  }

  return {
    imageSrc: weatherSource === 'low' ? relaxedColdImage : relaxedHotImage,
    accentClass: 'border-sky-500/15 bg-sky-500/6',
    title: weatherSource === 'low' ? '常态值守·低温' : '常态值守·高温',
    description:
      weatherSource === 'low'
        ? '当前以一般消息为主，数字人保持低温环境下的常态值守形象。'
        : '当前以一般消息为主，数字人保持高温环境下的常态值守形象。',
  };
}
