export type VhfMessage = {
  id: string;
  speaker: string;
  role?: 'ship' | 'control';
  text: string;
  timestamp: number;
  time?: string;
  intent?: string;
  riskLevel?: 'high' | 'medium' | 'low' | null;
};

export type ConversationCard = {
  id: string;
  speaker: string;
  role?: 'ship' | 'control';
  startTimestamp: number;
  endTimestamp: number;
  time?: string;
  intent?: string;
  riskLevel?: 'high' | 'medium' | 'low' | null;
  messages: VhfMessage[];
  mergedText: string;
};

const MERGE_WINDOW_MS = 10_000;

const RISK_PRIORITY: Record<'high' | 'medium' | 'low' | 'null', number> = {
  high: 3,
  medium: 2,
  low: 1,
  null: 0,
};

const normalizeRiskLevel = (riskLevel?: 'high' | 'medium' | 'low' | null) => riskLevel ?? null;

const pickHigherRiskLevel = (
  current: 'high' | 'medium' | 'low' | null | undefined,
  next: 'high' | 'medium' | 'low' | null | undefined,
): 'high' | 'medium' | 'low' | null => {
  const safeCurrent = normalizeRiskLevel(current);
  const safeNext = normalizeRiskLevel(next);

  return RISK_PRIORITY[safeNext === null ? 'null' : safeNext] > RISK_PRIORITY[safeCurrent === null ? 'null' : safeCurrent]
    ? safeNext
    : safeCurrent;
};

const joinTextSegment = (previous: string, next: string) => {
  if (!previous) {
    return next;
  }

  const shouldInsertSpace = /[A-Za-z0-9]$/.test(previous) && /^[A-Za-z0-9]/.test(next);
  return `${previous}${shouldInsertSpace ? ' ' : ''}${next}`;
};

export const mergeTexts = (messages: VhfMessage[]): string =>
  messages
    .map((message) => message.text.trim())
    .filter(Boolean)
    .reduce((merged, current) => joinTextSegment(merged, current), '')
    .replace(/\s+/g, ' ')
    .trim();

export const groupVhfMessages = (messages: VhfMessage[]): ConversationCard[] => {
  const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  const cards: ConversationCard[] = [];

  sortedMessages.forEach((message) => {
    const lastCard = cards[cards.length - 1];
    const canMerge =
      lastCard &&
      lastCard.speaker === message.speaker &&
      message.timestamp - lastCard.endTimestamp <= MERGE_WINDOW_MS;

    if (!canMerge) {
      cards.push({
        id: `card-${message.id}`,
        speaker: message.speaker,
        role: message.role,
        startTimestamp: message.timestamp,
        endTimestamp: message.timestamp,
        time: message.time,
        intent: message.intent,
        riskLevel: normalizeRiskLevel(message.riskLevel),
        messages: [message],
        mergedText: message.text.trim(),
      });
      return;
    }

    lastCard.messages.push(message);
    lastCard.endTimestamp = message.timestamp;
    lastCard.role = lastCard.role ?? message.role;
    lastCard.intent = lastCard.intent ?? message.intent;
    lastCard.riskLevel = pickHigherRiskLevel(lastCard.riskLevel, message.riskLevel);
    lastCard.mergedText = mergeTexts(lastCard.messages);
  });

  return cards;
};

export const MOCK_VHF_MESSAGES: VhfMessage[] = [
  {
    id: 'm1',
    speaker: '永发589',
    role: 'ship',
    text: '吴淞交管吴淞交管，[永发589]。',
    timestamp: 1766123566000,
    time: '16:32:46',
    intent: '动态报备',
    riskLevel: null,
  },
  {
    id: 'm2',
    speaker: '永发589',
    role: 'ship',
    text: '，[永发589]呃，粮油码头。',
    timestamp: 1766123571000,
    time: '16:32:51',
    intent: '动态报备',
    riskLevel: null,
  },
  {
    id: 'm3',
    speaker: '永发589',
    role: 'ship',
    text: '苏个角粮油码头出口出口准备在圆圆沙啊，由南向北穿越走和塘上水。',
    timestamp: 1766123577000,
    time: '16:32:57',
    intent: '动态报备',
    riskLevel: null,
  },
  {
    id: 'm4',
    speaker: '交管_30736',
    role: 'control',
    text: '开车了，好安全报。',
    timestamp: 1766123579000,
    time: '16:32:59',
    intent: '动态报备',
    riskLevel: null,
  },
  {
    id: 'm5',
    speaker: '海丰国际',
    role: 'ship',
    text: '吴淞交管，我船目前航向偏离，正在尝试修正。',
    timestamp: 1766123590000,
    time: '16:33:10',
    intent: '进入禁航区',
    riskLevel: 'medium',
  },
  {
    id: 'm6',
    speaker: '交管_127705',
    role: 'control',
    text: '请立即向左修正航向，避开圆圆沙禁航区。',
    timestamp: 1766123595000,
    time: '16:33:15',
    intent: '进入禁航区',
    riskLevel: 'high',
  },
  {
    id: 'm7',
    speaker: '交管_127705',
    role: 'control',
    text: '保持 VHF16 频道守听。',
    timestamp: 1766123600000,
    time: '16:33:20',
    intent: '进入禁航区',
    riskLevel: 'high',
  },
];

export const MOCK_CONVERSATION_CARDS = groupVhfMessages(MOCK_VHF_MESSAGES);

export const MOCK_GROUP_CALL_EXAMPLE = groupVhfMessages(MOCK_VHF_MESSAGES);
