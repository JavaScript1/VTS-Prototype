import { type VhfShipInfo, type VHFMessage } from '../../../types';
import { type ConversationCard, type VhfMessage as AggregatedVhfMessage } from '../../../utils/vhfConversation';

export const parseLegacyVhfTimestamp = (message: VHFMessage) => {
  const parsed = Date.parse(`${message.date}T${message.time}`);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const getLegacyVhfRiskLevel = (message: VHFMessage): AggregatedVhfMessage['riskLevel'] =>
  message.sessionType === 'alert' ? 'high' : null;

export const normalizeLegacyVhfMessage = (message: VHFMessage): AggregatedVhfMessage => ({
  id: message.id,
  speaker: message.sender,
  role: message.isVTS ? 'control' : 'ship',
  text: message.content,
  timestamp: parseLegacyVhfTimestamp(message),
  time: `${message.date} ${message.time}`,
  intent: message.sessionIntent,
  riskLevel: getLegacyVhfRiskLevel(message),
});

export const getConversationCardTimeLabel = (card: ConversationCard) => {
  const start = card.messages[0]?.time;
  const end = card.messages[card.messages.length - 1]?.time;
  return start && end && start !== end ? `${start} - ${end}` : start || end;
};

export const normalizeVhfShipName = (value: string) => value.replace(/[\s_-]+/g, '').toLowerCase();

export const mergeVhfShipInfo = (
  current: VhfShipInfo | undefined,
  next: Partial<VhfShipInfo> & { name: string },
): VhfShipInfo => ({
  name: current?.name ?? next.name,
  englishName: next.englishName ?? current?.englishName,
  shipType: next.shipType ?? current?.shipType,
  mmsi: next.mmsi ?? current?.mmsi,
  callSign: next.callSign ?? current?.callSign,
  imo: next.imo ?? current?.imo,
  destination: next.destination ?? current?.destination,
  speed: next.speed ?? current?.speed,
  hdg: next.hdg ?? current?.hdg,
  length: next.length ?? current?.length,
  width: next.width ?? current?.width,
  draft: next.draft ?? current?.draft,
  cargoType: next.cargoType ?? current?.cargoType,
});
