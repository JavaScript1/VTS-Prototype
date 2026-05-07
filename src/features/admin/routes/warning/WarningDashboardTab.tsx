import { AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MockRiskStat, WarningRule } from '../../../../types';

type WarningDashboardTabProps = {
  risks: MockRiskStat[];
  warningRules: WarningRule[];
};

const COLORS = ['#38bdf8', '#f97316', '#eab308', '#ef4444', '#10b981'];

export default function WarningDashboardTab({
  risks,
  warningRules,
}: WarningDashboardTabProps) {
  const riskTrendData = [
    { time: '00:00', value: 4 },
    { time: '04:00', value: 2 },
    { time: '08:00', value: 7 },
    { time: '12:00', value: 11 },
    { time: '16:00', value: 9 },
    { time: '20:00', value: 6 },
    { time: '24:00', value: 3 },
  ];

  const dimensionData = Object.entries(
    risks.reduce<Record<string, number>>((acc, item) => {
      acc[item.risk] = (acc[item.risk] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, count]) => ({ name, count }));

  const areaRankingData = Object.entries(
    risks.reduce<Record<string, number>>((acc, item) => {
      acc[item.snapshot.location] = (acc[item.snapshot.location] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-4">
        {[
          { label: '风险事件总量', value: risks.length, hint: '今日累计', icon: Shield, tone: 'text-sky-400' },
          {
            label: '高风险目标数',
            value: risks.filter((item) => (item.riskScore ?? 0) >= 80).length,
            hint: '持续跟踪',
            icon: AlertTriangle,
            tone: 'text-red-400',
          },
          {
            label: '启用规则数',
            value: warningRules.filter((rule) => rule.enabled).length,
            hint: '规则已生效',
            icon: TrendingUp,
            tone: 'text-emerald-400',
          },
          {
            label: '平均风险分',
            value: Math.round(
              risks.reduce((sum, item) => sum + (item.riskScore ?? 0), 0) / Math.max(risks.length, 1),
            ),
            hint: '综合热度',
            icon: Shield,
            tone: 'text-amber-400',
          },
        ].map((card) => (
          <div key={card.label} className="rounded-[32px] border border-white/5 bg-[#0a101a] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ${card.tone}`}>
                <card.icon size={24} />
              </div>
              <span className="rounded-lg bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white/35">
                {card.hint}
              </span>
            </div>
            <p className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/30">{card.label}</p>
            <h4 className="text-3xl font-black tracking-tighter text-white">{card.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8 rounded-[40px] border border-white/5 bg-[#0a101a] p-8 shadow-2xl">
          <div className="mb-8">
            <h4 className="text-lg font-black tracking-tight text-white">风险趋势分析</h4>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-white/30">24小时风险触发变化</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrendData}>
                <defs>
                  <linearGradient id="warningTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#ffffff20', fontSize: 11, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff20', fontSize: 11, fontWeight: 'bold' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a101a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} fill="url(#warningTrendFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-4 rounded-[40px] border border-white/5 bg-[#0a101a] p-8 shadow-2xl">
          <h4 className="mb-8 text-sm font-black uppercase tracking-widest text-white">风险维度构成</h4>
          <div className="space-y-6">
            {dimensionData.map((item, index) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                  <span className="text-white/40">{item.name}</span>
                  <span className="text-white">{item.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(item.count / Math.max(dimensionData[0]?.count ?? 1, 1)) * 100}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7 rounded-[32px] border border-white/5 bg-[#0a101a] p-6 shadow-2xl">
          <h4 className="mb-6 text-xs font-black uppercase tracking-widest text-white/90">高频风险区域</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaRankingData} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#ffffff20', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#ffffff60', fontSize: 11 }} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#0a101a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {areaRankingData.map((item, index) => (
                    <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-5 rounded-[32px] border border-white/5 bg-[#0a101a] p-6 shadow-2xl">
          <h4 className="mb-6 text-xs font-black uppercase tracking-widest text-white/90">高风险关注名单</h4>
          <div className="space-y-3">
            {risks
              .slice()
              .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
              .slice(0, 5)
              .map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[12px] font-bold text-white/90">{item.name}</div>
                      <div className="mt-1 text-[10px] text-white/35">{item.type} · {item.risk}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-red-400">{item.riskScore ?? '--'}</div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-white/25">风险分</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
