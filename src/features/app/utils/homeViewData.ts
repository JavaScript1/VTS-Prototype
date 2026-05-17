import {
  INTENT_DATA,
  MOCK_ALERTS,
  MOCK_RISK_STATS,
  SHIP_POSITIONS,
} from '../../../mockData';
import type {
  HomeShipDetail,
  VHFMessage,
  VhfSessionSummary,
  VhfShipInfo,
} from '../../../types';
import { groupVhfMessages } from '../../../utils/vhfConversation';
import {
  createHomeShipDynamicEvents,
  createHomeShipTrack,
  getHomeShipEnglishName,
  getHomeShipMovement,
  getHomeShipOperator,
} from './homeShips';
import {
  mergeVhfShipInfo,
  normalizeLegacyVhfMessage,
  normalizeVhfShipName,
  parseLegacyVhfTimestamp,
} from './vhf';

export function buildVhfShipInfoLookup() {
  const lookup = new Map<string, VhfShipInfo>();
  const upsert = (name: string, next: Partial<VhfShipInfo>) => {
    if (!name) return;
    const key = normalizeVhfShipName(name);
    lookup.set(key, mergeVhfShipInfo(lookup.get(key), { name, ...next }));
  };

  SHIP_POSITIONS.forEach((ship) => {
    upsert(ship.name, {
      shipType: ship.type,
      mmsi: ship.mmsi,
      callSign: ship.callsign,
      englishName: ship.englishName,
      destination: ship.destination,
      speed: `${ship.speed.toFixed(1)}kn`,
    });
  });

  INTENT_DATA.forEach((item) => {
    upsert(item.ship, {
      shipType: item.shipType,
      englishName: item.englishName,
      mmsi: item.mmsi,
      callSign: item.callSign,
      imo: item.imo,
      flag: item.flag,
      lastPort: item.past,
      cargoType: item.cargoType,
      length: item.length,
      width: item.width,
      draft: item.draft,
      speed: item.speed,
      destination: item.destination,
      hdg: item.situation?.hdg,
    });
  });

  MOCK_RISK_STATS.forEach((item) => {
    upsert(item.name, {
      shipType: item.type,
      mmsi: item.mmsi,
      cargoType: item.cargo,
      length: item.length ? `${item.length}m` : undefined,
      width: item.width ? `${item.width}m` : undefined,
      draft: item.draft ? `${item.draft}m` : undefined,
      speed: item.speed !== undefined ? `${item.speed.toFixed(1)}kn` : undefined,
      destination: item.destination,
    });
  });

  return lookup;
}

export function buildVhfSessions(
  vhfMessages: VHFMessage[],
  vhfShipInfoLookup: Map<string, VhfShipInfo>,
) {
  const groupedSessions = new Map<string, VHFMessage[]>();

  vhfMessages.forEach((message) => {
    if (!groupedSessions.has(message.sessionId)) {
      groupedSessions.set(message.sessionId, []);
    }
    groupedSessions.get(message.sessionId)?.push(message);
  });

  return [...groupedSessions.entries()]
    .map(([sessionId, sessionMessages]) => {
      const messages = [...sessionMessages].sort(
        (a, b) => parseLegacyVhfTimestamp(a) - parseLegacyVhfTimestamp(b),
      );
      const cards = groupVhfMessages(messages.map(normalizeLegacyVhfMessage));
      const shipMessage = messages.find((message) => !message.isVTS);
      const latestMessage = messages[messages.length - 1];
      const firstMessage = messages[0];
      const shipName = shipMessage?.sender || latestMessage?.sender || '未知船舶';

      return {
        sessionId,
        shipName,
        operatorName: messages.find((message) => message.isVTS)?.sender || '值班员',
        intent: latestMessage?.sessionIntent || shipMessage?.sessionIntent || '待识别',
        sessionType: latestMessage?.sessionType || shipMessage?.sessionType || 'intent',
        messages,
        cards,
        shipInfo: vhfShipInfoLookup.get(normalizeVhfShipName(shipName)),
        startedAt: firstMessage ? parseLegacyVhfTimestamp(firstMessage) : 0,
        latestAt: latestMessage ? parseLegacyVhfTimestamp(latestMessage) : 0,
        latestTime: latestMessage ? `${latestMessage.date} ${latestMessage.time}` : '',
      };
    })
    .sort((a, b) => b.latestAt - a.latestAt);
}

export function buildHomeShipDetails(
  vhfSessions: VhfSessionSummary[],
  vhfShipInfoLookup: Map<string, VhfShipInfo>,
): HomeShipDetail[] {
  return SHIP_POSITIONS.map((ship) => {
    const shipKey = normalizeVhfShipName(ship.name);
    const intent = INTENT_DATA.find((item) => normalizeVhfShipName(item.ship) === shipKey);
    const riskStat = MOCK_RISK_STATS.find(
      (item) => item.mmsi === ship.mmsi || normalizeVhfShipName(item.name) === shipKey,
    );
    const alert = MOCK_ALERTS.find(
      (item) => item.mmsi === ship.mmsi || normalizeVhfShipName(item.ship) === shipKey,
    );
    const session = vhfSessions.find((item) => normalizeVhfShipName(item.shipName) === shipKey);
    const info = vhfShipInfoLookup.get(shipKey);
    const route = {
      past: intent?.past || '上游航段',
      current: intent?.current || ship.destination,
      destination: intent?.destination || ship.destination,
    };
    const track = createHomeShipTrack(ship, route);
    const movement = getHomeShipMovement(route.destination);
    const operator = getHomeShipOperator(route.destination);
    const cargoName = info?.cargoType || riskStat?.cargo || alert?.cargo || '普通货物';
    const isContainerShip = (info?.shipType || riskStat?.type || ship.type).includes('集装箱');
    const isHazardous =
      ship.type.includes('油') || cargoName.includes('油') || cargoName.includes('危险');
    const grossTonnage = `${Math.max(800, Math.round(ship.speed * 260 + ship.heading * 7))}`;
    const dynamicEvents = createHomeShipDynamicEvents({
      shipId: ship.id,
      route,
      intent,
      track,
    });

    return {
      id: ship.id,
      name: ship.name,
      displayName: `${getHomeShipEnglishName(ship.name)} / ${ship.name}`,
      mmsi: ship.mmsi,
      type: info?.shipType || riskStat?.type || ship.type,
      status: ship.status,
      destination: ship.destination,
      speed: ship.speed,
      heading: ship.heading,
      lat: ship.lat,
      lng: ship.lng,
      length: info?.length || (riskStat ? `${riskStat.length}m` : '--'),
      width: info?.width || (riskStat ? `${riskStat.width}m` : '--'),
      draft: info?.draft || (riskStat ? `${riskStat.draft}m` : '--'),
      cargo: cargoName,
      callsign: riskStat?.callsign || alert?.callsign || `VTS${ship.mmsi.slice(-4)}`,
      imo: `${9700000 + Number(ship.mmsi.slice(-4))}`,
      grossTonnage,
      statusBanner:
        ship.status === 'warning'
          ? '10分钟前申请锚地'
          : ship.status === 'caution'
            ? '15分钟前提交进港申请'
            : '当前动态正常',
      route,
      intentSummary:
        intent?.intentSummary ||
        `当前前往 ${route.destination}，保持 ${ship.heading}° 航向，持续沿推荐航路航行。`,
      vhfSummary: session
        ? `${session.intent} · 最近通话 ${session.latestTime.split(' ').pop()}`
        : '暂无实时 VHF 对话',
      riskSummary:
        riskStat?.risk || alert?.type || (ship.status === 'warning' ? '重点关注' : '常规监控'),
      businessInfo: {
        plannedBerth: route.destination,
        movement,
        plannedTime: intent?.intentEta || '待调度确认',
        previousPort: route.past,
        nextPort: route.destination,
        applicant: session?.operatorName || '值班员',
        operator,
        teu: isContainerShip ? `${Math.max(220, Math.round(ship.speed * 36))}` : '--',
        dischargeVolume: isContainerShip
          ? `${Math.max(120, Math.round(ship.speed * 18))}`
          : `${Math.max(300, Math.round(ship.speed * 42))}吨`,
        eta: intent?.occurrenceTime || '待更新',
        departureTime: session?.latestTime || intent?.occurrenceTime || '待更新',
      },
      cargoInfo: {
        cargoName,
        cargoAmount: isContainerShip
          ? `${Math.max(260, Math.round(ship.speed * 40))}TEU`
          : `${Math.max(500, Math.round(ship.speed * 55))}吨`,
        localHazardAmount: isHazardous ? `${Math.max(20, Math.round(ship.speed * 4))}吨` : '--',
        actualHazardAmount: isHazardous ? `${Math.max(80, Math.round(ship.speed * 8))}吨` : '--',
      },
      dynamicEvents,
      track,
    };
  });
}
