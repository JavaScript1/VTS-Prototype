import type { PushMessage } from '../../../types';

const relaxedColdImage = new URL('../../../../AGENTS/image/悠闲-低温度.gif', import.meta.url).href;
const relaxedHotImage = new URL('../../../../AGENTS/image/悠闲-高温度.gif', import.meta.url).href;
const urgentColdImage = new URL('../../../../AGENTS/image/紧急-低温度.gif', import.meta.url).href;
const urgentHotImage = new URL('../../../../AGENTS/image/紧急-高温度.gif', import.meta.url).href;
const accidentImage = new URL('../../../../AGENTS/image/事故.gif', import.meta.url).href;

export type MessageSeverityKind = 'normal' | 'emergency' | 'accident';
export type TemperatureBand = 'low' | 'high';
export type MessageFeedMode = 'manual' | 'auto';

export type MessageFeedItem = PushMessage & {
  severityKind: MessageSeverityKind;
  temperatureBand: TemperatureBand;
  shipQuestion?: string;
  operatorAnswer?: string;
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

const AUTO_STRATEGY_MESSAGES: MessageTemplate[] = [
  {
    type: 'intent',
    title: '靠泊托管策略',
    content: "自动托管：已识别 'COSCO SHIPPING' 靠泊粮油码头 A1 意图。",
    level: 'info',
    suggestion: '系统将自动批准靠泊申请，并联动拖轮“沪港拖01”前出接应。',
    hasActions: true,
    severityKind: 'normal',
    temperatureBand: 'high',
    shipQuestion: '交管中心，COSCO SHIPPING 申请靠泊粮油码头 A1，当前是否可以进港？',
    operatorAnswer: 'COSCO SHIPPING，可以靠泊 A1，保持低速进港，拖轮“沪港拖01”已前出接应。',
  },
  {
    type: 'intent',
    title: '通航护航策略',
    content: "自动托管：已识别 'EVER GIVEN' 过境意图，进入窄段护航策略。",
    level: 'info',
    suggestion: '系统将维持安全航速建议，并持续监测会遇风险变化。',
    hasActions: true,
    severityKind: 'normal',
    temperatureBand: 'high',
    shipQuestion: '交管中心，EVER GIVEN 准备通过窄段水域，请确认推荐航速和会遇安排。',
    operatorAnswer: 'EVER GIVEN，维持安全航速通过窄段，系统持续监测会遇风险，按推荐航线航行。',
  },
  {
    type: 'intent',
    title: '锚地引导策略',
    content: "自动托管：已识别 'MAERSK ALABAMA' 前往 A2 锚地 3 号位。",
    level: 'info',
    suggestion: '系统将自动发送引导航线，并预留锚位占用窗口。',
    hasActions: true,
    severityKind: 'normal',
    temperatureBand: 'low',
    shipQuestion: '交管中心，MAERSK ALABAMA 申请进入 A2 锚地，请指示锚位。',
    operatorAnswer: 'MAERSK ALABAMA，请进入 A2 锚地 3 号位，系统已发送引导航线并预留锚位窗口。',
  },
  {
    type: 'warning',
    title: '偏航纠偏策略',
    content: "自动托管：'SHIP A' 偏离航道 0.5nm，已进入纠偏处置。",
    level: 'warning',
    suggestion: '系统已下发修正航向指令，并保持连续跟踪 10 分钟。',
    hasActions: true,
    severityKind: 'normal',
    temperatureBand: 'high',
    shipQuestion: '交管中心，SHIP A 当前航迹偏离，是否需要立即调整航向？',
    operatorAnswer: 'SHIP A，立即向推荐航向修正，保持在航道内航行，系统将连续跟踪 10 分钟。',
  },
  {
    type: 'warning',
    title: '自动避碰策略',
    content: "自动托管：'SHIP B' 与 'SHIP C' 存在碰撞风险 (CPA < 0.1nm)。",
    level: 'emergency',
    suggestion: '系统将同步执行 VHF 呼叫、让路建议与重点监测托管。',
    hasActions: true,
    severityKind: 'emergency',
    temperatureBand: 'high',
    shipQuestion: '交管中心，SHIP B 与附近船舶距离快速缩短，请确认避让动作。',
    operatorAnswer: 'SHIP B，立即按系统让路建议调整航向，保持 VHF 守听，交管已同步呼叫相关船舶。',
  },
  {
    type: 'warning',
    title: '禁区拦截策略',
    content: "自动托管：'SHIP D' 进入禁航区，触发联动拦截方案。",
    level: 'emergency',
    suggestion: '系统将自动指派海巡力量前出，并锁定后续轨迹证据链。',
    hasActions: true,
    severityKind: 'emergency',
    temperatureBand: 'high',
    shipQuestion: '交管中心，SHIP D 已接近禁航区边界，是否继续当前航向？',
    operatorAnswer: 'SHIP D，立即停止进入禁航区，按指令转向驶离，海巡力量已前出确认。',
  },
  {
    type: 'warning',
    title: '失动力处置策略',
    content: "自动托管：'SHIP E' 疑似失去动力，航速异常下降。",
    level: 'warning',
    suggestion: '系统将协调拖轮待命，并同步海巡与锚地疏导策略。',
    hasActions: true,
    severityKind: 'emergency',
    temperatureBand: 'low',
    shipQuestion: '交管中心，SHIP E 航速下降，疑似动力异常，请求处置建议。',
    operatorAnswer: 'SHIP E，保持当前位置报告状态，拖轮已待命，海巡与锚地疏导策略同步启动。',
  },
  {
    type: 'warning',
    title: '事故封控策略',
    content: "自动托管：'SHIP F' 与小型作业艇擦碰，进入事故封控流程。",
    level: 'emergency',
    suggestion: '系统将自动启动封航、消防待命与周边交通流改道策略。',
    hasActions: true,
    severityKind: 'accident',
    temperatureBand: 'high',
    shipQuestion: '交管中心，SHIP F 与作业艇发生擦碰，请求封控和救援指令。',
    operatorAnswer: 'SHIP F，立即停船待命并保护现场，周边交通流已改道，消防和救援力量正在前往。',
  },
  {
    type: 'weather',
    title: '低温防护策略',
    content: '自动托管：冷空气进入辖区，甲板结露风险升高。',
    level: 'info',
    suggestion: '系统将自动下发防滑提醒，并降低露天作业强度建议。',
    hasActions: true,
    severityKind: 'normal',
    temperatureBand: 'low',
    shipQuestion: '交管中心，辖区低温结露明显，甲板作业是否需要调整？',
    operatorAnswer: '各船注意，降低露天作业强度，做好甲板防滑，保持安全航速和值班报告。',
  },
  {
    type: 'weather',
    title: '强降雨防护策略',
    content: '自动托管：区域 A 预计 10 分钟后有强降雨。',
    level: 'info',
    suggestion: '系统将自动推送减速航行策略，并滚动刷新影响范围。',
    hasActions: true,
    severityKind: 'normal',
    temperatureBand: 'high',
    shipQuestion: '交管中心，区域 A 即将强降雨，当前通航是否需要限速？',
    operatorAnswer: '区域 A 船舶请减速航行，扩大安全间距，系统将滚动刷新影响范围。',
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

function pickAutoStrategyTemplate() {
  return AUTO_STRATEGY_MESSAGES[Math.floor(Math.random() * AUTO_STRATEGY_MESSAGES.length)];
}

export function createMessageFeedItem(
  maxMessagesTime = new Date(),
  mode: MessageFeedMode = 'manual',
): MessageFeedItem {
  const template = mode === 'auto' ? pickAutoStrategyTemplate() : pickTemplate();

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
