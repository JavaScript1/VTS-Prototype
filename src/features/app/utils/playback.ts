import { MOCK_RISK_STATS } from '../../../mockData';

export type AppPlaybackSession = {
  vessel: any;
  event: any;
};

export const getRiskPlaybackSession = (
  item: (typeof MOCK_RISK_STATS)[number],
): AppPlaybackSession => {
  const dialogue = [
    {
      sender: item.name,
      content: `${item.name} 报告，发生区域 ${item.snapshot.location}，当前风险为「${item.risk}」。`,
      time: item.time.split(' ')[1] ?? item.time,
    },
    {
      sender: '吴淞交管',
      content: `收到，请重点关注「${item.risk}」并按指令修正动态。`,
      time: item.time.split(' ')[1] ?? item.time,
    },
  ];

  return {
    vessel: {
      name: item.name,
      englishName: (item as typeof item & { englishName?: string }).englishName,
      mmsi: item.mmsi,
      type: item.type,
      callsign: item.callsign,
      imo: (item as typeof item & { imo?: string }).imo,
      destination: item.destination,
      speed: item.speed,
      heading: item.heading,
      draft: item.draft,
      length: item.length,
      width: item.width,
      cargo: item.cargo,
    },
    event: {
      coords: item.coords,
      time: item.time,
      label: item.risk,
      type: 'risk',
      desc: `${item.name} 于 ${item.time} 触发「${item.risk}」风险预警，发生区域 ${item.snapshot.location}。`,
      timeline: item.timeline.map((entry) => ({
        ...entry,
        desc: entry.event,
      })),
      dialogue,
      environment: [
        { label: '风险区域', value: item.snapshot.location },
        { label: '船首向', value: `${item.heading}°` },
        { label: '实际航速', value: `${item.speed.toFixed(1)} kn` },
        { label: '可视距离', value: item.visibility },
        {
          label: '交通密度',
          value:
            item.riskScore && item.riskScore >= 80
              ? '高密度'
              : item.riskScore && item.riskScore >= 60
                ? '中密度'
                : '常态',
        },
        { label: '管制状态', value: item.risk },
      ],
      weather: [
        { label: '风力', value: item.wind },
        { label: '浪高', value: item.wave },
        { label: '能见度', value: item.visibility },
      ],
    },
  };
};
