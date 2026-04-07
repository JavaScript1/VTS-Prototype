/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Bell, 
  MessageSquare, 
  ShieldAlert, 
  Settings, 
  User, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  Check,
  Map as MapIcon,
  Radio,
  AlertTriangle,
  AlertCircle,
  Info,
  Maximize2,
  Clock,
  Filter,
  LocateFixed,
  LogOut,
  Layout,
  Users,
  Lock,
  BookOpen,
  Volume2,
  Monitor,
  BarChart3,
  Shield,
  Plus,
  ArrowLeft,
  Ship,
  Anchor,
  Activity,
  History,
  FileText,
  Play,
  Pause,
  MapPin,
  Presentation,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { MapContainer, TileLayer, Marker, CircleMarker, useMapEvents, Polygon, Polyline, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';

// 地图状态持久化组件
const MapStatePersister = () => {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      const center = map.getCenter();
      localStorage.setItem('vts-map-center', JSON.stringify([center.lat, center.lng]));
    },
    zoomend: (e) => {
      const map = e.target;
      localStorage.setItem('vts-map-zoom', map.getZoom().toString());
    },
  });
  return null;
};

// 鼠标位置追踪组件
const MousePositionTracker = ({ onMouseMove }: { onMouseMove: (coords: { lat: number; lng: number }) => void }) => {
  useMapEvents({
    mousemove(e) {
      onMouseMove(e.latlng);
    },
  });
  return null;
};

// 历史回放地图控制组件
const PlaybackMapController = ({ playbackData }: { playbackData: any }) => {
  const map = useMap();
  
  useEffect(() => {
    if (playbackData?.event?.coords) {
      map.setView(playbackData.event.coords, 14, {
        animate: true,
        duration: 1
      });
    }
  }, [playbackData, map]);

  if (!playbackData || !playbackData.event.coords) return null;

  const latestDialogue = playbackData.event.dialogue?.[playbackData.event.dialogue.length - 1];

  return (
    <Marker 
      position={playbackData.event.coords}
      icon={L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative -translate-x-1/2 -translate-y-[120%] min-w-[200px]">
            <div class="bg-[#0a0a0a]/90 backdrop-blur-md border border-sky-500/50 rounded-lg p-3 shadow-2xl ring-1 ring-white/10">
              <div class="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                <div class="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
                <span class="text-[10px] font-black text-sky-400 uppercase tracking-widest">当前意图: ${playbackData.event.label}</span>
              </div>
              
              ${latestDialogue ? `
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-[9px] font-bold text-white/40 uppercase">${latestDialogue.sender}</span>
                    <span class="text-[8px] font-mono text-white/20">${latestDialogue.time}</span>
                  </div>
                  <p class="text-[11px] text-white/90 leading-relaxed font-medium">"${latestDialogue.content}"</p>
                </div>
              ` : `
                <p class="text-[10px] text-white/40 italic">暂无实时对话内容</p>
              `}
              
              <!-- 箭头 -->
              <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-sky-500/50"></div>
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      })}
    />
  );
};

// 模拟船舶位置数据 (以吴淞口5号锚地为中心分布)
const SHIP_POSITIONS = [...Array(40)].map((_, i) => ({
  id: i,
  lat: 31.40 + Math.random() * 0.1,
  lng: 121.52 + Math.random() * 0.15,
  name: `船舶 ${1000 + i}`,
  type: Math.random() > 0.5 ? '货轮' : '油轮',
  status: Math.random() > 0.8 ? 'warning' : 'normal'
}));

// --- 类型定义 ---

type SidebarTab = 'vhf' | 'intent' | 'warning' | 'anchorage';

interface VHFMessage {
  id: string;
  sessionId: string;
  sessionIntent?: string;
  sessionType?: 'intent' | 'alert';
  sender: string;
  content: string;
  time: string;
  date: string;
  duration: string;
  isVTS: boolean;
}

interface Alert {
  id: string;
  ship: string;
  shipType: string;
  mmsi: string;
  callsign?: string;
  destination: string;
  cargo: string;
  riskScore: number;
  length: string;
  width: string;
  draft: string;
  speed: string;
  type: string;
  summary: string;
  time: string;
  coords: [number, number];
  level: 'emergency' | 'alarm' | 'warning' | 'caution';
  timeline: {
    time: string;
    event: string;
    type: 'info' | 'warning' | 'risk';
  }[];
}

// --- 模拟数据 ---

const MOCK_VHF_MESSAGES: VHFMessage[] = [
  { id: '1', sessionId: 's1', sessionIntent: '呼叫应答', sessionType: 'intent', sender: '运兴96', content: '吴淞控制中心[运兴96]。', time: '16:32:34', date: '2025-12-17', duration: '1.99s', isVTS: false },
  { id: '2', sessionId: 's1', sessionIntent: '呼叫应答', sessionType: 'intent', sender: '交管_127705', content: '请讲。', time: '16:32:35', date: '2025-12-17', duration: '0.58s', isVTS: true },
  { id: '3', sessionId: 's2', sessionIntent: '锚地咨询', sessionType: 'intent', sender: '易航158', content: '在9号锚地这个锚这个位置可以锚泊吧。', time: '16:32:39', date: '2025-12-17', duration: '2.69s', isVTS: false },
  { id: '4', sessionId: 's3', sessionIntent: '动态报备', sessionType: 'intent', sender: '永发589', content: '吴淞交管吴淞交管，[永发589]。', time: '16:32:46', date: '2025-12-17', duration: '2.45s', isVTS: false },
  { id: '5', sessionId: 's3', sessionIntent: '动态报备', sessionType: 'intent', sender: '永发589', content: '，[永发589]呃，粮油码头。', time: '16:32:51', date: '2025-12-17', duration: '2.84s', isVTS: false },
  { id: '6', sessionId: 's3', sessionIntent: '动态报备', sessionType: 'intent', sender: '永发589', content: '苏个角粮油码头出口出口准备在圆圆沙啊，由南向北穿越走和塘上水。', time: '16:32:57', date: '2025-12-17', duration: '5.43s', isVTS: false },
  { id: '7', sessionId: 's3', sessionIntent: '动态报备', sessionType: 'intent', sender: '交管_30736', content: '开车了，好安全报。', time: '16:32:59', date: '2025-12-17', duration: '1.72s', isVTS: true },
  { id: '8', sessionId: 's4', sessionIntent: '出港咨询', sessionType: 'intent', sender: 'spk_127707', content: '好的，那现在可以出港池吧。', time: '16:33:02', date: '2025-12-17', duration: '2.03s', isVTS: false },
  { id: '9', sessionId: 's4', sessionIntent: '出港咨询', sessionType: 'intent', sender: '交管_114824', content: '可以可以。', time: '16:33:05', date: '2025-12-17', duration: '0.93s', isVTS: true },
  { id: '10', sessionId: 's5', sessionIntent: '进入禁航区', sessionType: 'alert', sender: '海丰国际', content: '吴淞交管，我船目前航向偏离，正在尝试修正。', time: '16:33:10', date: '2025-12-17', duration: '3.12s', isVTS: false },
  { id: '11', sessionId: 's5', sessionIntent: '进入禁航区', sessionType: 'alert', sender: '交管_127705', content: '请立即向左修正航向，避开圆圆沙禁航区。', time: '16:33:15', date: '2025-12-17', duration: '2.45s', isVTS: true },
];

const MOCK_ANCHORAGES = [
  { 
    id: 'a1', 
    name: '6号锚地', 
    capacity: 20, 
    occupied: 18, 
    expiringCount: 3, 
    status: '拥挤',
    shipTypes: [
      { type: '散货船', count: 8 },
      { type: '集装箱船', count: 6 },
      { type: '油船', count: 4 }
    ],
    expiringShips: [
      { id: 'es1', name: '远洋 123', mmsi: '413000001', type: '货轮', expiryTime: '2026-03-27 10:00', details: { length: 190, width: 32, draft: 11.2, cargo: '铁矿石', destination: '上海', agent: '中远海运' } },
      { id: 'es2', name: '海丰 77', mmsi: '413000002', type: '集装箱船', expiryTime: '2026-03-27 11:30', details: { length: 145, width: 24, draft: 8.5, cargo: '日用品', destination: '宁波', agent: '海丰国际' } },
      { id: 'es3', name: '振华 15', mmsi: '413000003', type: '工程船', expiryTime: '2026-03-27 14:00', details: { length: 220, width: 45, draft: 9.8, cargo: '重型设备', destination: '舟山', agent: '振华重工' } }
    ]
  },
  { 
    id: 'a2', 
    name: '圆圆沙锚地', 
    capacity: 15, 
    occupied: 12, 
    expiringCount: 5, 
    status: '正常',
    shipTypes: [
      { type: '散货船', count: 5 },
      { type: '杂货船', count: 4 },
      { type: '工程船', count: 3 }
    ],
    expiringShips: [
      { id: 'es4', name: '中海 99', mmsi: '413000004', type: '油轮', expiryTime: '2026-03-27 09:15', details: { length: 250, width: 48, draft: 14.5, cargo: '原油', destination: '大连', agent: '中海油' } },
      { id: 'es5', name: '顺风 6', mmsi: '413000005', type: '散货船', expiryTime: '2026-03-27 15:45', details: { length: 110, width: 18, draft: 6.2, cargo: '煤炭', destination: '天津', agent: '顺风航运' } }
    ]
  },
  { 
    id: 'a3', 
    name: '10号锚地', 
    capacity: 25, 
    occupied: 10, 
    expiringCount: 1, 
    status: '空闲',
    shipTypes: [
      { type: '集装箱船', count: 4 },
      { type: '油船', count: 3 },
      { type: '其他', count: 3 }
    ],
    expiringShips: [
      { id: 'es6', name: '东方 55', mmsi: '413000055', type: '客船', expiryTime: '2026-03-27 18:00', details: { length: 120, width: 20, draft: 5.5, cargo: '乘客', destination: '青岛', agent: '东方海外' } }
    ]
  },
  { 
    id: 'a4', 
    name: '绿华山锚地', 
    capacity: 30, 
    occupied: 28, 
    expiringCount: 8, 
    status: '拥挤',
    shipTypes: [
      { type: '散货船', count: 12 },
      { type: '油船', count: 10 },
      { type: '集装箱船', count: 6 }
    ],
    expiringShips: [
      { id: 'es7', name: '远洋 99', mmsi: '413000099', type: '散货船', expiryTime: '2026-03-27 20:30', details: { length: 185, width: 32, draft: 10.5, cargo: '煤炭', destination: '广州', agent: '中远海运' } }
    ]
  },
];

const MOCK_ALERTS: Alert[] = [
  { 
    id: 'a1', 
    ship: '江海通8',
    shipType: '散货船',
    mmsi: '413000008',
    callsign: 'BHT8',
    destination: '上海',
    cargo: '铁矿石',
    riskScore: 85,
    length: '156m',
    width: '28m',
    draft: '8.5m',
    speed: '10.2kn',
    type: '进入禁航区', 
    summary: '该船偏离预定航线，进入禁航区【测试禁航区1】', 
    time: '11:42', 
    coords: [31.35, 121.55],
    level: 'emergency',
    timeline: [
      { time: '11:25:10', event: '进入吴淞口警戒区', type: 'info' },
      { time: '11:32:45', event: '航向偏离预定航线 > 15°', type: 'warning' },
      { time: '11:38:20', event: '接近禁航区边界', type: 'warning' },
      { time: '11:42:05', event: '触发[进入禁航区]风险预警', type: 'risk' }
    ]
  },
  { 
    id: 'a2', 
    ship: '新海安',
    shipType: '集装箱船',
    mmsi: '413000010',
    callsign: 'XHA10',
    destination: '宁波',
    cargo: '日用品',
    riskScore: 72,
    length: '230m',
    width: '36m',
    draft: '12.0m',
    speed: '4.5kn',
    type: '进入禁锚区', 
    summary: '该船在禁锚区【测试禁锚区2】内减速，疑似准备抛锚', 
    time: '11:38', 
    coords: [31.38, 121.58],
    level: 'alarm',
    timeline: [
      { time: '11:15:00', event: '通过圆圆沙报告线', type: 'info' },
      { time: '11:25:30', event: '进入禁锚区水域', type: 'info' },
      { time: '11:32:15', event: '航速降至 5kn 以下', type: 'warning' },
      { time: '11:38:10', event: '检测到抛锚准备行为', type: 'risk' }
    ]
  },
  { 
    id: 'a3', 
    ship: '星海',
    shipType: '油船',
    mmsi: '413000012',
    callsign: 'XH12',
    destination: '舟山',
    cargo: '原油',
    riskScore: 65,
    length: '190m',
    width: '32m',
    draft: '11.5m',
    speed: '13.8kn',
    type: '超速警报', 
    summary: '该船在航道内航速超过 12 节限制', 
    time: '11:25', 
    coords: [31.42, 121.62],
    level: 'warning',
    timeline: [
      { time: '11:05:00', event: '进入吴淞主航道', type: 'info' },
      { time: '11:12:30', event: '航速持续上升 (11.5kn -> 12.8kn)', type: 'warning' },
      { time: '11:20:15', event: '超过航道限速阈值', type: 'warning' },
      { time: '11:25:00', event: '触发[超速航行]风险预警', type: 'risk' }
    ]
  },
  { 
    id: 'a4', 
    ship: '蓝波',
    shipType: '拖船',
    mmsi: '413000015',
    destination: '南通',
    cargo: '无',
    riskScore: 45,
    length: '45m',
    width: '12m',
    draft: '4.5m',
    speed: '1.2kn',
    type: '走锚风险', 
    summary: '检测到该船在锚地内位置发生异常偏移，可能存在走锚风险', 
    time: '11:12', 
    coords: [31.45, 121.65],
    level: 'caution',
    timeline: [
      { time: '10:45:00', event: '进入南槽锚地', type: 'info' },
      { time: '11:00:15', event: '检测到位置持续漂移', type: 'warning' },
      { time: '11:08:30', event: '偏离锚位半径 > 50m', type: 'warning' },
      { time: '11:12:10', event: '触发[走锚风险]预警', type: 'risk' }
    ]
  },
];

// --- 区域设置模拟数据 ---

const AREA_CATEGORIES = ['值班区域', '作业与停泊设施', '航道航行设施', '水域管控'];

const MOCK_RISK_STATS = [
  { 
    id: '1', 
    name: '远洋 123', 
    mmsi: '413000001', 
    callsign: 'YY123',
    type: '货轮', 
    length: 190, 
    width: 32, 
    cargo: '铁矿石', 
    draft: 11.2, 
    risk: '超速航行', 
    speed: 15.4, 
    heading: 125, 
    wind: '4级', 
    wave: '0.8m', 
    visibility: '8km', 
    time: '2026-03-17 09:15:22', 
    coords: [31.35, 121.55] as [number, number],
    destination: '上海',
    riskScore: 88,
    snapshot: {
      image: 'https://picsum.photos/seed/vessel1/400/225',
      location: '吴淞口警戒区 A12 浮标附近',
      actualSpeed: 14.2,
      speedLimit: 12.0
    },
    timeline: [
      { time: '09:00:15', event: '进入吴淞口警戒区', type: 'info' },
      { time: '09:05:42', event: '航速持续上升 (12.5kn -> 14.2kn)', type: 'warning' },
      { time: '09:12:10', event: '接近航道限速区域', type: 'info' },
      { time: '09:15:22', event: '触发[超速航行]风险预警', type: 'risk' }
    ]
  },
  { 
    id: '2', 
    name: '海丰 77', 
    mmsi: '413000002', 
    callsign: 'HF77',
    type: '集装箱船', 
    length: 145, 
    width: 24, 
    cargo: '日用品', 
    draft: 8.5, 
    risk: '偏离航道', 
    speed: 12.1, 
    heading: 210, 
    wind: '5级', 
    wave: '1.2m', 
    visibility: '5km', 
    time: '2026-03-17 10:02:45', 
    coords: [31.38, 121.58] as [number, number],
    destination: '宁波',
    riskScore: 75,
    snapshot: {
      image: 'https://picsum.photos/seed/vessel2/400/225',
      location: '圆圆沙 12 号浮标南侧',
      actualSpeed: 12.1,
      speedLimit: 12.0
    },
    timeline: [
      { time: '09:45:00', event: '通过圆圆沙报告线', type: 'info' },
      { time: '09:55:30', event: '航向发生异常偏转', type: 'warning' },
      { time: '10:02:45', event: '偏离主航道中心线 > 50m', type: 'risk' }
    ]
  },
  { 
    id: '3', 
    name: '振华 15', 
    mmsi: '413000003', 
    type: '工程船', 
    length: 220, 
    width: 45, 
    cargo: '重型设备', 
    draft: 9.8, 
    risk: '非法锚泊', 
    speed: 0.1, 
    heading: 45, 
    wind: '3级', 
    wave: '0.5m', 
    visibility: '10km', 
    time: '2026-03-17 11:30:10', 
    coords: [31.42, 121.62] as [number, number],
    snapshot: {
      image: 'https://picsum.photos/seed/vessel3/400/225',
      location: '非锚泊作业区 B5 区域',
      actualSpeed: 0.1,
      speedLimit: 0.5
    },
    timeline: [
      { time: '11:10:00', event: '进入非锚泊作业区', type: 'info' },
      { time: '11:20:15', event: '航速降至 0.5kn 以下', type: 'warning' },
      { time: '11:30:10', event: '检测到锚泊行为', type: 'risk' }
    ]
  },
  { 
    id: '4', 
    name: '中海 99', 
    mmsi: '413000004', 
    type: '油轮', 
    length: 250, 
    width: 48, 
    cargo: '原油', 
    draft: 14.5, 
    risk: '碰撞风险', 
    speed: 10.5, 
    heading: 180, 
    wind: '6级', 
    wave: '2.0m', 
    visibility: '3km', 
    time: '2026-03-17 12:45:33', 
    coords: [31.45, 121.65] as [number, number],
    snapshot: {
      image: 'https://picsum.photos/seed/vessel4/400/225',
      location: '长江口深水航道 D3 浮标',
      actualSpeed: 10.5,
      speedLimit: 12.0
    },
    timeline: [
      { time: '12:30:00', event: '能见度降至 3km 以下', type: 'warning' },
      { time: '12:40:15', event: '与前方船舶 DCPA < 0.2nm', type: 'warning' },
      { time: '12:45:33', event: '触发碰撞高风险预警', type: 'risk' }
    ]
  },
  { 
    id: '5', 
    name: '顺风 6', 
    mmsi: '413000005', 
    type: '散货船', 
    length: 110, 
    width: 18, 
    cargo: '煤炭', draft: 6.2, risk: '异常停泊', speed: 0.0, heading: 90, wind: '4级', wave: '0.7m', visibility: '7km', time: '2026-03-17 13:20:15', coords: [31.48, 121.68] as [number, number],
    snapshot: {
      image: 'https://picsum.photos/seed/vessel5/400/225',
      location: '航道边缘水域 E1 浮标附近',
      actualSpeed: 0.0,
      speedLimit: 12.0
    },
    timeline: [
      { time: '13:05:00', event: '进入航道边缘水域', type: 'info' },
      { time: '13:15:30', event: '主机疑似发生故障停航', type: 'warning' },
      { time: '13:20:15', event: '航道内异常停泊', type: 'risk' }
    ]
  },
];

const MOCK_INTENT_STATS = [
  {
    id: '1',
    name: '远洋 99',
    mmsi: '413000099',
    type: '散货船',
    intent: '起锚',
    confidence: 92,
    time: '2026-03-19 11:20',
    status: '批准',
    cargo: '煤炭'
  },
  {
    id: '2',
    name: '海丰 77',
    mmsi: '413000002',
    type: '集装箱船',
    intent: '划江',
    confidence: 88,
    time: '2026-03-19 10:45',
    status: '回复等待',
    cargo: '日用品'
  },
  {
    id: '3',
    name: '中海 12',
    mmsi: '413000012',
    type: '油轮',
    intent: '靠泊',
    confidence: 95,
    time: '2026-03-19 09:30',
    status: '主动询问',
    cargo: '原油'
  },
  {
    id: '4',
    name: '东方 55',
    mmsi: '413000055',
    type: '客船',
    intent: '离泊',
    confidence: 85,
    time: '2026-03-19 08:15',
    status: '拒绝',
    cargo: '乘客'
  },
  {
    id: '5',
    name: '远洋 123',
    mmsi: '413000001',
    type: '货轮',
    intent: '进报告线',
    confidence: 90,
    time: '2026-03-19 07:50',
    status: '紧急干预',
    cargo: '铁矿石'
  }
];

const AREA_TYPE_MAPPING: Record<string, Record<string, string[]>> = {
  '值班区域': {
    '值班台': []
  },
  '作业与停泊设施': {
    '码头': ['靠泊等级', '靠泊尺度', '船舶类型限制', '船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深'],
    '泊位': ['靠泊等级', '靠泊尺度', '船舶类型限制', '船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深'],
    '锚地': ['靠泊等级', '靠泊尺度', '船舶类型限制', '船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深']
  },
  '航道航行设施': {
    '主航道': ['船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深', '最高限速', '最低限速', '航道方向'],
    '辅助航道': ['船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深', '最高限速', '最低限速', '航道方向'],
    '小型船舶航道': ['船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深', '最高限速', '最低限速', '航道方向'],
    '航道分割线': [],
    '报告线': [],
    '导堤': ['船舶类型限制', '船舶尺度限制', '最大水深', '最小水深'],
    '物标': []
  },
  '水域管控': {
    '警戒区': ['船舶类型限制', '船舶尺度限制', '最高限速', '最低限速'],
    '禁锚区': ['船舶类型限制', '船舶尺度限制', '最大水深', '最小水深', '最高限速', '最低限速'],
    '禁航区': ['船舶类型限制', '船舶尺度限制', '最大水深', '最小水深', '最高限速', '最低限速'],
    '临时管控区': ['船舶类型限制', '船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深', '最高限速', '最低限速', '有效期'],
    '边坡100米水域': ['船舶类型限制', '船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深', '最高限速', '最低限速'],
    '浅水区': ['船舶类型限制', '船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深', '最高限速', '最低限速'],
    '引航作业区': ['船舶类型限制', '船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深', '最高限速', '最低限速'],
    '调头区': ['船舶类型限制', '船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深', '最高限速', '最低限速']
  }
};

const MOCK_AREAS: Record<string, any[]> = {
  '值班区域': [
    { id: '1', name: '外高桥值班台', time: '2026-03-05 09:42:59', type: '值班台', status: '正常', fields: {} },
    { id: '2', name: '黄浦江值班台', time: '2026-03-05 09:42:59', type: '值班台', status: '正常', fields: {} },
    { id: '3', name: '宝山值班台', time: '2026-03-05 09:42:59', type: '值班台', status: '正常', fields: {} },
    { id: '4', name: '长江口值班台', time: '2026-03-05 09:42:59', type: '值班台', status: '正常', fields: {} },
    { id: '5', name: '北槽值班台', time: '2026-03-05 09:42:59', type: '值班台', status: '正常', fields: {} },
    { id: '6', name: '南槽值班台', time: '2026-03-05 09:42:59', type: '值班台', status: '正常', fields: {} },
  ],
  '作业与停泊设施': [
    { id: '7', name: '外高桥码头', time: '2026-03-05 10:50:00', type: '码头', status: '正常', fields: { '靠泊等级': '5万吨级', '最大水深': '15m', '最小水深': '12m' } },
    { id: '8', name: '罗泾泊位', time: '2026-03-05 11:20:00', type: '泊位', status: '正常', fields: { '靠泊尺度': '300m', '船舶类型限制': '散货船' } },
    { id: '9', name: '吴淞口锚地', time: '2026-03-05 12:00:00', type: '锚地', status: '正常', fields: { '船舶吨位限制': '10万吨', '最大水深': '20m' } },
  ],
  '航道航行设施': [
    { id: '10', name: '吴淞主航道', time: '2026-03-05 13:00:00', type: '主航道', status: '正常', fields: { '最高限速': '12节', '最低限速': '5节', '航道方向': '090/270' } },
    { id: '11', name: '圆圆沙辅助航道', time: '2026-03-05 13:30:00', type: '辅助航道', status: '正常', fields: { '最高限速': '10节', '最大水深': '10m' } },
    { id: '12', name: '吴淞口报告线', time: '2026-03-05 14:00:00', type: '报告线', status: '正常', fields: {} },
  ],
  '水域管控': [
    { id: '13', name: '吴淞口警戒区', time: '2026-03-05 15:00:00', type: '警戒区', status: '正常', fields: { '最高限速': '8节', '船舶类型限制': '危险品船除外' } },
    { id: '14', name: '1号禁锚区', time: '2026-03-05 15:30:00', type: '禁锚区', status: '正常', fields: { '最大水深': '25m' } },
    { id: '15', name: '圆圆沙禁航区', time: '2026-03-05 16:00:00', type: '禁航区', status: '正常', fields: { '最高限速': '0节' } },
  ],
};

interface IntentStep {
  label: string;
  status: 'completed' | 'active' | 'pending';
  action: string;
}

interface IntentTimelineEvent {
  time: string;
  tag: string;
  content: string;
  status: 'active' | 'completed' | 'initial';
}

interface IntentItem {
  ship: string;
  shipType: string;
  cargoType: string;
  length: string;
  width: string;
  draft: string;
  speed: string;
  past: string;
  current: string;
  destination: string;
  confidence: number;
  time: string;
  occurrenceTime: string;
  details: string;
  path: IntentStep[];
  timeline: IntentTimelineEvent[];
}

const INTENT_DATA: IntentItem[] = [
  {
    ship: '远洋99',
    shipType: '散货船',
    cargoType: '煤炭',
    length: '185m',
    width: '32m',
    draft: '10.5m',
    speed: '12.5kn',
    past: '6号锚地',
    current: '吴淞口',
    destination: '黄浦江',
    confidence: 92,
    time: '11:20',
    occurrenceTime: '2026-03-19 11:20',
    details: '该船已完成起锚，目前在主航道由北向南行驶至吴淞口附近，正准备划江进入黄浦江。',
    path: [
      { label: '6号锚地', status: 'completed', action: '申请起锚' },
      { label: '吴淞口', status: 'active', action: '由北向南划江' },
      { label: '黄浦江', status: 'pending', action: '目的地' }
    ],
    timeline: [
      { time: '11:05 UTC', tag: '实时监控', content: '保持航向 184.2。周边区域交通繁忙。系统自主响应等级设置为 2。', status: 'active' },
      { time: '10:42 UTC', tag: '航点通过', content: '第 4 扇区过渡完成。航速稳定在 12.5 节。推进效率 94%。', status: 'completed' },
      { time: '09:15 UTC', tag: '初始序列', content: '从锚地启动离港序列。所有子系统运行正常。', status: 'initial' }
    ]
  },
  {
    ship: '海丰国际',
    shipType: '集装箱船',
    cargoType: '日用品',
    length: '210m',
    width: '35m',
    draft: '11.2m',
    speed: '15.8kn',
    past: '圆圆沙',
    current: '南槽航道',
    destination: '外高桥',
    confidence: 85,
    time: '11:35',
    occurrenceTime: '2026-03-19 11:35',
    details: '该船已从圆圆沙锚地起锚，目前正进入南槽航道由北向南航行，预计前往外高桥码头靠泊。',
    path: [
      { label: '圆圆沙', status: 'completed', action: '已起锚' },
      { label: '南槽航道', status: 'active', action: '由北向南航行' },
      { label: '外高桥', status: 'pending', action: '靠泊' }
    ],
    timeline: [
      { time: '11:25 UTC', tag: '实时监控', content: '进入南槽航道。当前流量中等。系统状态稳定。', status: 'active' },
      { time: '10:55 UTC', tag: '航点通过', content: '圆圆沙报告线通过。航速 11.8 节。', status: 'completed' },
      { time: '09:45 UTC', tag: '初始序列', content: '圆圆沙锚地起锚序列启动。', status: 'initial' }
    ]
  },
  {
    ship: '中远海运',
    shipType: '集装箱船',
    cargoType: '电子产品',
    length: '366m',
    width: '51m',
    draft: '14.5m',
    speed: '4.2kn',
    past: '外高桥',
    current: '外高桥码头',
    destination: '洋山港',
    confidence: 95,
    time: '11:45',
    occurrenceTime: '2026-03-19 11:45',
    details: '该船正在外高桥码头进行离泊作业，预计离泊后经南槽航道前往洋山港。',
    path: [
      { label: '外高桥', status: 'active', action: '离泊中' },
      { label: '南槽航道', status: 'pending', action: '航行' },
      { label: '洋山港', status: 'pending', action: '靠泊' }
    ],
    timeline: [
      { time: '11:40 UTC', tag: '实时监控', content: '解缆作业开始。拖轮已到位。', status: 'active' },
      { time: '11:30 UTC', tag: '离泊申请', content: 'VTS 批准离泊申请。', status: 'completed' }
    ]
  },
  {
    ship: '盛世油轮',
    shipType: '油船',
    cargoType: '原油',
    length: '245m',
    width: '42m',
    draft: '12.8m',
    speed: '2.5kn',
    past: '长江口',
    current: '10号锚地',
    destination: '10号锚地',
    confidence: 88,
    time: '11:52',
    occurrenceTime: '2026-03-19 11:52',
    details: '该船已抵达10号锚地，目前正在减速准备抛锚，等待后续进港指令。',
    path: [
      { label: '长江口', status: 'completed', action: '进港航行' },
      { label: '10号锚地', status: 'active', action: '准备抛锚' },
      { label: '10号锚地', status: 'pending', action: '锚泊' }
    ],
    timeline: [
      { time: '11:50 UTC', tag: '实时监控', content: '航速降至 3 节以下。准备抛锚。', status: 'active' },
      { time: '11:45 UTC', tag: '位置报告', content: '进入10号锚地水域。', status: 'completed' }
    ]
  },
  {
    ship: '东海拖01',
    shipType: '拖船',
    cargoType: '无',
    length: '45m',
    width: '12m',
    draft: '4.2m',
    speed: '8.5kn',
    past: '北槽',
    current: '主航道',
    destination: '南槽',
    confidence: 90,
    time: '12:05',
    occurrenceTime: '2026-03-19 12:05',
    details: '该船正在穿越主航道，从北槽前往南槽执行拖带任务，需注意避让主航道直航船舶。',
    path: [
      { label: '北槽', status: 'completed', action: '航行' },
      { label: '主航道', status: 'active', action: '穿越主航道' },
      { label: '南槽', status: 'pending', action: '执行任务' }
    ],
    timeline: [
      { time: '12:00 UTC', tag: '实时监控', content: '开始穿越主航道。已通报周边船舶。', status: 'active' },
      { time: '11:55 UTC', tag: '穿越申请', content: 'VTS 提醒注意避让进港大船。', status: 'completed' }
    ]
  },
  {
    ship: '运兴96',
    shipType: '货船',
    cargoType: '杂货',
    length: '96m',
    width: '16m',
    draft: '5.5m',
    speed: '9.2kn',
    past: '长江口',
    current: '吴淞口',
    destination: '黄浦江',
    confidence: 90,
    time: '16:32',
    occurrenceTime: '2025-12-17 16:32',
    details: '该船正在吴淞口水域航行，准备划江进入黄浦江。',
    path: [
      { label: '长江口', status: 'completed', action: '进港' },
      { label: '吴淞口', status: 'active', action: '划江' },
      { label: '黄浦江', status: 'pending', action: '靠泊' }
    ],
    timeline: [
      { time: '16:32 UTC', tag: '实时监控', content: '呼叫吴淞中心。', status: 'active' }
    ]
  }
];

const MOCK_VESSEL_DYNAMICS = [
  {
    id: 'vd1',
    name: '远洋99',
    mmsi: '413123456',
    type: '货轮',
    origin: '宁波',
    status: '正在作业',
    startTime: '2026-03-15 08:30',
    endTime: '',
    destination: '黄浦江',
    events: [
      { time: '08:30', type: 'action', label: '进入辖区', desc: '船舶进入吴淞口警戒区', status: 'completed', coords: [121.5, 31.4] },
      { 
        time: '08:45', 
        type: 'comm', 
        label: '申请划江', 
        desc: '向值班员申请由北向南划江', 
        status: 'completed',
        coords: [121.52, 31.38],
        dialogue: [
          { sender: '远洋99', content: '吴淞VTS，远洋99申请由北向南划江。', time: '08:45:10' },
          { sender: '吴淞VTS', content: '远洋99，吴淞VTS，同意划江，请注意避让主航道进港船舶。', time: '08:45:30' },
        ]
      },
      { time: '08:50', type: 'action', label: '开始划江', desc: '开始穿越主航道', status: 'completed', coords: [121.53, 31.37] },
      { time: '09:10', type: 'risk', label: '违规行为', desc: '未按规定航路行驶，偏离航道0.2海里', status: 'warning', coords: [121.55, 31.35] },
      { time: '09:25', type: 'action', label: '抵达锚地', desc: '进入6号锚地等待潮汐', status: 'current', coords: [121.58, 31.32] },
      { time: '10:30', type: 'pending', label: '预计靠泊', desc: '预计前往粮油码头靠泊', status: 'pending' },
    ]
  },
  {
    id: 'vd2',
    name: '海丰国际',
    mmsi: '413789012',
    type: '集装箱船',
    origin: '釜山',
    status: '正在航行',
    startTime: '2026-03-15 09:00',
    endTime: '2026-03-15 11:30',
    destination: '外高桥码头',
    events: [
      { time: '09:00', type: 'action', label: '起锚', desc: '从圆圆沙锚地起锚', status: 'completed', coords: [121.65, 31.3] },
      { time: '09:15', type: 'comm', label: '报告动态', desc: '报告进入南槽航道', status: 'completed', coords: [121.68, 31.28] },
      { time: '09:40', type: 'action', label: '通过报告线', desc: '通过吴淞口报告线', status: 'completed', coords: [121.72, 31.25] },
      { time: '10:15', type: 'action', label: '接近码头', desc: '正在接近外高桥码头', status: 'current', coords: [121.75, 31.22] },
    ]
  },
  {
    id: 'vd3',
    name: '中远海运',
    mmsi: '413456789',
    type: '油轮',
    origin: '新加坡',
    status: '等待中',
    startTime: '2026-03-15 07:30',
    endTime: '',
    destination: '罗泾泊位',
    events: [
      { time: '07:30', type: 'action', label: '进入辖区', desc: '进入长江口区域', status: 'completed', coords: [121.4, 31.5] },
      { 
        time: '08:00', 
        type: 'comm', 
        label: '申请靠泊', 
        desc: '申请罗泾泊位靠泊', 
        status: 'completed',
        coords: [121.42, 31.48],
        dialogue: [
          { sender: '中远海运', content: '吴淞中心，中远海运申请罗泾泊位靠泊。', time: '08:00:05' },
          { sender: '吴淞中心', content: '中远海运，收到，请在锚地等待进一步指令。', time: '08:00:25' },
        ]
      },
      { 
        time: '08:10', 
        type: 'comm', 
        label: '指令接收', 
        desc: '值班员指令：泊位占用，前往泊位外等待', 
        status: 'completed',
        coords: [121.45, 31.45],
        dialogue: [
          { sender: '吴淞中心', content: '中远海运，罗泾泊位目前有船作业，请前往指定水域锚泊等待。', time: '08:10:15' },
          { sender: '中远海运', content: '收到，前往指定水域锚泊。', time: '08:10:40' },
        ]
      },
      { time: '08:30', type: 'action', label: '锚泊等待', desc: '在指定水域抛锚等待', status: 'current', coords: [121.48, 31.42] },
    ]
  }
];

// --- 组件 ---

const SidebarPanel = ({ 
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
  position = 'left',
  showBars,
  onToggleBars,
  children
}: { 
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  isOpen: boolean;
  onToggle: () => void;
  position?: 'left' | 'right';
  showBars: boolean;
  onToggleBars: () => void;
  children: React.ReactNode;
}) => {
  const tabs = [
    { id: 'vhf' as const, icon: Radio, label: 'VHF' },
    { id: 'intent' as const, icon: LocateFixed, label: '意图' },
    { id: 'warning' as const, icon: AlertTriangle, label: '预警' },
    { id: 'anchorage' as const, icon: Anchor, label: '锚地' },
  ];

  const isLeft = position === 'left';
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  return (
    <div className={`flex h-full z-[3000] ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
      {/* Navigation Rail */}
      <div className={`w-12 h-full bg-[#050505] border-${isLeft ? 'r' : 'l'} border-white/10 flex flex-col items-center py-4 gap-4`}>
        {/* Search Icon - Expandable */}
        <div 
          className="relative flex items-center"
          onMouseEnter={() => setIsSearchExpanded(true)}
          onMouseLeave={() => setIsSearchExpanded(false)}
        >
          <button className={`p-2 rounded-lg transition-all ${isSearchExpanded ? 'text-sky-400 bg-sky-500/10' : 'text-white/30 hover:text-white/60'}`}>
            <Search size={18} />
          </button>
          <AnimatePresence>
            {isSearchExpanded && (
              <motion.div
                initial={{ width: 0, opacity: 0, x: isLeft ? -10 : 10 }}
                animate={{ width: 200, opacity: 1, x: 0 }}
                exit={{ width: 0, opacity: 0, x: isLeft ? -10 : 10 }}
                className={`absolute ${isLeft ? 'left-full ml-2' : 'right-full mr-2'} z-[4000]`}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="搜索船名/MMSI..." 
                    className="w-full bg-[#0a0a0a] border border-sky-500/30 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-sky-500 shadow-2xl"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Top/Bottom Bars Toggle - Moved here */}
        <button 
          onClick={onToggleBars}
          className={`p-2 rounded-lg transition-all group relative ${
            !showBars ? 'text-sky-400 bg-sky-500/10' : 'text-white/30 hover:text-white/60'
          }`}
          title={showBars ? "进入全屏监控" : "退出全屏监控"}
        >
          <Maximize2 size={18} className={`transition-transform duration-500 ${!showBars ? 'rotate-180' : 'rotate-0'}`} />
          {!showBars && (
            <motion.div 
              layoutId="activeBars"
              className={`absolute ${isLeft ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 w-0.5 h-4 bg-sky-500 rounded-full`}
            />
          )}
        </button>

        {/* Redesigned Sidebar Toggle Button */}
        <button 
          onClick={onToggle}
          className={`group relative p-2 rounded-xl transition-all duration-300 ${
            isOpen 
              ? 'bg-white/5 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
              : 'bg-sky-500/10 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.15)]'
          } hover:scale-105 active:scale-95`}
        >
          <div className={`absolute inset-0 rounded-xl border transition-colors duration-300 ${
            isOpen ? 'border-white/10' : 'border-sky-500/30'
          }`} />
          <ChevronRight 
            size={18} 
            className={`transition-transform duration-500 ease-out ${
              isOpen 
                ? (isLeft ? 'rotate-180' : 'rotate-0') 
                : (isLeft ? 'rotate-0' : 'rotate-180')
            }`} 
          />
          {!isOpen && (
            <span className="absolute -right-1 -top-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          )}
        </button>

        <div className="w-8 h-px bg-white/10 my-2" />
        
        <div className="flex-1 flex flex-col gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                if (!isOpen) onToggle();
              }}
              className={`p-2 rounded-lg transition-all relative group ${
                activeTab === tab.id ? 'text-sky-400 bg-sky-500/10' : 'text-white/30 hover:text-white/60'
              }`}
            >
              <tab.icon size={20} />
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className={`absolute ${isLeft ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 w-0.5 h-4 bg-sky-500 rounded-full`}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={`h-full transition-colors duration-500 border-${isLeft ? 'r' : 'l'} border-white/10 flex flex-col overflow-hidden ${
              activeTab === 'vhf' 
                ? 'bg-[#0a0a0a]/90 backdrop-blur-md' 
                : 'bg-transparent backdrop-blur-none'
            }`}
          >

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- 浮动面板组件 ---

const IntentConflictPanel = () => (
  <motion.div 
    initial={{ x: 20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    className="absolute top-10 right-10 z-[2000] w-[320px] bg-[#1a0505]/90 backdrop-blur-md border border-red-500/30 rounded-lg overflow-hidden shadow-2xl"
  >
    <div className="bg-red-900/80 px-3 py-2 flex items-center justify-between border-b border-red-500/20">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-red-400" />
        <span className="text-sm font-black text-white tracking-wide uppercase">意图冲突识别 (Intent Conflict)</span>
      </div>
      <AlertTriangle size={16} className="text-red-500 animate-pulse" />
    </div>
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">识别意图:</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <span className="text-xs font-black text-white">非法锚泊行为</span>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest shrink-0">依据:</span>
        <span className="text-xs text-white/80 font-medium leading-relaxed">CPA 0.02nm, 舵角偏离大, 前速 0.1 kn</span>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2">
        <button className="bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-400 text-[10px] font-black uppercase tracking-widest py-2 rounded transition-all">发送 VHF 警告</button>
        <button className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-widest py-2 rounded transition-all">标记为误报</button>
        <button 
          onClick={() => {
            const item = MOCK_RISK_STATS[0];
            (window as any).setDynamicPlaybackSession({
              vessel: { name: item.name, mmsi: item.mmsi, type: item.type },
              event: {
                time: item.time,
                coords: item.coords,
                type: 'risk',
                label: '意图冲突',
                desc: '系统识别到该船存在非法锚泊意图，与当前航道规则冲突。',
                timeline: item.timeline,
                dialogue: [
                  { sender: '系统', content: '识别到意图冲突：非法锚泊。', time: item.time }
                ]
              }
            });
          }}
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest py-2 rounded transition-all"
        >
          查看监控回放
        </button>
      </div>
    </div>
  </motion.div>
);

const CrewApplicationPanel = () => (
  <motion.div 
    initial={{ x: -20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    className="absolute top-[45%] left-10 z-[2000] w-[300px] bg-[#05101a]/90 backdrop-blur-md border border-sky-500/30 rounded-lg overflow-hidden shadow-2xl"
  >
    <div className="bg-sky-900/80 px-3 py-2 flex items-center justify-between border-b border-sky-500/20">
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-white tracking-wide uppercase">船员申请流</span>
      </div>
      <Settings size={14} className="text-white/40 hover:text-white cursor-pointer transition-colors" />
    </div>
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest shrink-0">申请事件:</span>
        <span className="text-xs text-white font-black">⚓ 靠泊 粮油码头 A2泊位</span>
      </div>
      <div className="flex items-start gap-3">
        <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest shrink-0">冲突检测:</span>
        <span className="text-xs text-sky-400 font-black">无冲突 (泊位空闲, 水深满足)</span>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2">
        <button className="bg-sky-500 hover:bg-sky-400 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded shadow-lg shadow-sky-500/20 transition-all">批准排期</button>
        <button className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest py-2 rounded transition-all">驳回申请</button>
        <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest py-2 rounded transition-all">指派拖轮</button>
      </div>
    </div>
  </motion.div>
);

const SystemSuggestionPanel = () => (
  <motion.div 
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[2000] w-[280px] bg-[#051a10]/90 backdrop-blur-md border border-emerald-500/30 rounded-lg overflow-hidden shadow-2xl"
  >
    <div className="bg-emerald-900/80 px-3 py-2 flex items-center justify-between border-b border-emerald-500/20">
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-white tracking-wide uppercase">系统建议</span>
      </div>
      <Settings size={14} className="text-white/40 hover:text-white cursor-pointer transition-colors" />
    </div>
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">意图优化:</span>
        <span className="text-xs text-emerald-400 font-black">💡 船舶分流建议</span>
      </div>
      <div className="flex items-start gap-3">
        <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest shrink-0">建议:</span>
        <span className="text-xs text-white/90 font-medium leading-relaxed">'海巡 01' 前往 B2 区协助引导</span>
      </div>
      <div className="flex gap-2 pt-2">
        <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded shadow-lg shadow-emerald-500/20 transition-all">应用建议</button>
        <button className="px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest py-2 rounded transition-all">忽略</button>
      </div>
    </div>
  </motion.div>
);

// --- 后台管理组件 ---

const AdminPanel = ({ 
  onClose, 
  playbackData, 
  setPlaybackData,
  setDynamicPlaybackSession,
  initialMenu,
  initialStatsTab
}: { 
  onClose: () => void,
  playbackData: any,
  setPlaybackData: (data: any) => void,
  setDynamicPlaybackSession: (data: any) => void,
  initialMenu?: string,
  initialStatsTab?: string
}) => {
  const [activeMenu, setActiveMenu] = useState(initialMenu || '区域设置');
  const [activeSubTab, setActiveSubTab] = useState('值班区域');
  const [activeScenarioTab, setActiveScenarioTab] = useState('VHF船舶会话');
  const [activeStatsTab, setActiveStatsTab] = useState(initialStatsTab || '值班统计');
  const [statsTimeRange, setStatsTimeRange] = useState('今天');
  const [statsArea, setStatsArea] = useState('全部区域');
  const [showVhfDetails, setShowVhfDetails] = useState(false);
  const [selectedVhfSnippet, setSelectedVhfSnippet] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);

  const menus = [
    { name: '个人信息', icon: User },
    { name: '角色管理', icon: Users },
    { name: '权限管理', icon: Lock },
    { name: '账号管理', icon: User },
    { name: '区域设置', icon: MapIcon },
    { name: '船舶动态', icon: Activity },
    { name: '字典管理', icon: BookOpen },
    { name: '语音设置', icon: Volume2 },
    { name: '显示设置', icon: Monitor },
    { name: '业务统计', icon: BarChart3 },
    { name: '预警管理', icon: Shield },
    { name: '场景演示', icon: Presentation },
  ];

  const handleEdit = (area: any) => {
    setEditData({
      ...area,
      category: activeSubTab,
      fields: area.fields || {}
    });
    setIsEditing(true);
  };

  const handleCreate = () => {
    const category = activeSubTab;
    const defaultType = Object.keys(AREA_TYPE_MAPPING[category])[0];
    const defaultFields: Record<string, string> = {};
    AREA_TYPE_MAPPING[category][defaultType].forEach(f => {
      defaultFields[f] = '';
    });
    
    setEditData({ 
      name: '', 
      category, 
      type: defaultType,
      fields: defaultFields 
    });
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="fixed inset-0 z-[7000] bg-[#050a10] flex flex-col overflow-hidden"
      >
        <header className="h-12 border-b border-white/5 bg-[#0a101a] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">名称:</span>
              <input 
                type="text" 
                value={editData?.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="请输入区域名称" 
                className="bg-transparent border-none text-xs text-white focus:outline-none w-48"
              />
            </div>
            <div className="flex gap-2">
              <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all">绘制</button>
              <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all">重绘</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEditing(false)}
              className="bg-white/5 hover:bg-white/10 text-white/60 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
            >
              取消并返回
            </button>
            <button 
              onClick={() => setIsEditing(false)}
              className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-sky-600/20"
            >
              保存并返回
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative bg-[#0a0a0a]">
            {/* 模拟地图视图 */}
            <MapContainer 
              center={[31.40, 121.52]} 
              zoom={13} 
              className="h-full w-full"
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <div className="absolute inset-0 pointer-events-none border-4 border-sky-500/20 z-[1000]" />
            </MapContainer>
            
            {editData?.type !== '值班台' && (
              <div className="absolute top-4 left-4 z-[1000] bg-[#0a101a]/90 backdrop-blur-md border border-white/10 rounded-xl p-4 w-72 shadow-2xl flex flex-col max-h-[calc(100%-2rem)]">
                <h3 className="text-sm font-black text-white/90 mb-4 flex items-center gap-2 shrink-0">
                  <div className="w-1 h-4 bg-sky-500 rounded-full" />
                  区域信息
                </h3>
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">类型</label>
                    <select 
                      value={editData?.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        const newFields: Record<string, string> = {};
                        AREA_TYPE_MAPPING[editData.category][newType].forEach(f => {
                          newFields[f] = '';
                        });
                        setEditData({ ...editData, type: newType, fields: newFields });
                      }}
                      className="w-full bg-[#1a202a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500/50 appearance-none cursor-pointer"
                    >
                      {Object.keys(AREA_TYPE_MAPPING[editData?.category] || {}).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 text-[10px] font-bold text-white/60 transition-all">点</button>
                    <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 text-[10px] font-bold text-white/60 transition-all">线</button>
                    <button className="bg-sky-500/20 border border-sky-500/30 rounded-lg py-2 text-[10px] font-bold text-sky-400 transition-all">面</button>
                    <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 text-[10px] font-bold text-white/60 transition-all">清空</button>
                  </div>
                  
                  {/* 动态字段映射 */}
                  {AREA_TYPE_MAPPING[editData?.category]?.[editData?.type]?.map(field => (
                    <div key={field}>
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">{field}</label>
                      <input 
                        type="text" 
                        value={editData?.fields?.[field] || ''}
                        onChange={(e) => setEditData({ 
                          ...editData, 
                          fields: { ...editData.fields, [field]: e.target.value } 
                        })}
                        placeholder={`请输入${field}`}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500/50" 
                      />
                    </div>
                  ))}

                  {AREA_TYPE_MAPPING[editData?.category]?.[editData?.type]?.length === 0 && (
                    <div className="py-8 text-center border border-dashed border-white/5 rounded-xl">
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">该类型无需额外参数</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[6000] bg-[#050a10] flex flex-col overflow-hidden"
    >
      {/* 顶部栏 */}
      <header className="h-12 border-b border-white/5 bg-[#0a101a] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition-all flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            <span className="text-xs font-bold">返回地图</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        <aside className="w-56 border-r border-white/5 bg-[#0a101a]/50 flex flex-col shrink-0">
          <div className="p-4 flex items-center gap-2 text-white/80 border-b border-white/5 mb-2">
            <Settings size={16} className="text-sky-400" />
            <span className="text-sm font-black tracking-widest">后台管理系统</span>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 custom-scrollbar">
            <div className="px-3 py-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">个人中心</div>
            {menus.map(menu => (
              <button
                key={menu.name}
                onClick={() => setActiveMenu(menu.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${activeMenu === menu.name ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
              >
                <menu.icon size={16} className={activeMenu === menu.name ? 'text-sky-400' : 'text-white/20 group-hover:text-white/40'} />
                <span className="text-xs font-medium">{menu.name}</span>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-white/5">
            <button className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-400/60 hover:text-red-400 transition-all">
              <LogOut size={14} /> 退出系统
            </button>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 bg-[#050a10] p-6 overflow-y-auto">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-white/90 flex items-center gap-3">
              <div className="w-1 h-6 bg-sky-500 rounded-full" />
              {activeMenu}
              {activeMenu === '业务统计' && (
                <div className="flex bg-white/5 rounded-lg p-0.5 ml-4">
                  {['值班统计', '船舶风险统计', '意图统计'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveStatsTab(tab)}
                      className={`px-4 py-1.5 text-[11px] font-bold rounded-md transition-all whitespace-nowrap ${activeStatsTab === tab ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-white/40 hover:text-white/60'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}
            </h2>
            <div className="text-xs text-white/30 font-mono">
              Admin / {activeMenu}
            </div>
          </div>

          {activeMenu === '区域设置' && (
            <div className="space-y-4">
              {/* 区域设置内部导航与搜索 */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="flex bg-white/5 rounded-lg p-0.5">
                    {AREA_CATEGORIES.map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveSubTab(tab)}
                        className={`px-4 py-1 text-xs font-medium rounded-md transition-all ${activeSubTab === tab ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-white/40 hover:text-white/60'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleCreate}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-1"
                  >
                    <Plus size={14} /> 新建区域
                  </button>
                  <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 px-4 py-1.5 rounded-lg text-xs font-bold transition-all">
                    筛选
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="w-12 px-6 py-4"></th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">区域名称</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">创建时间</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">类型</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_AREAS[activeSubTab]?.map((area) => (
                      <React.Fragment key={area.id}>
                        <tr 
                          className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer ${expandedRowId === area.id ? 'bg-white/[0.03]' : ''}`}
                          onClick={() => setExpandedRowId(expandedRowId === area.id ? null : area.id)}
                        >
                          <td className="px-6 py-4">
                            <ChevronRight size={14} className={`text-white/20 transition-transform ${expandedRowId === area.id ? 'rotate-90' : ''}`} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-sky-500" />
                              <span className="text-xs font-bold text-white/90">{area.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-white/40 font-mono">{area.time}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-white/60">{area.type}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="text-[10px] font-bold text-sky-400 hover:text-sky-300 transition-colors">查看</button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEdit(area); }}
                                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                修改
                              </button>
                              <button className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors">删除</button>
                            </div>
                          </td>
                        </tr>
                        <AnimatePresence>
                          {expandedRowId === area.id && (
                            <tr>
                              <td colSpan={5} className="bg-black/20 p-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-6">
                                    <div className="space-y-3">
                                      <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">业务属性</h4>
                                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {Object.entries(area.fields || {}).map(([key, value]) => (
                                          <div key={key} className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-sky-500/30 transition-all">
                                            <span className="text-[9px] text-white/30 block mb-1 uppercase tracking-wider font-bold">{key}</span>
                                            <span className="text-xs font-bold text-white/90">{value as string}</span>
                                          </div>
                                        ))}
                                        {(!area.fields || Object.keys(area.fields).length === 0) && (
                                          <div className="col-span-full py-8 text-center border border-dashed border-white/5 rounded-2xl">
                                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">该区域暂无额外业务属性配置</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                
                <div className="p-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">共 {MOCK_AREAS[activeSubTab]?.length} 条记录</span>
                  <div className="flex gap-2">
                    <button className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white transition-all"><ChevronLeft size={16} /></button>
                    <button className="w-8 h-8 rounded-lg bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20">1</button>
                    <button className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white transition-all"><ChevronRight size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === '船舶动态' && (
            <div className="space-y-4">
              {/* 顶部工具栏 */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                    <input 
                      type="text" 
                      placeholder="搜索船名/MMSI..." 
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-sky-500/50"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                    <Filter size={14} /> 筛选
                  </button>
                  <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                    <History size={14} /> 历史记录
                  </button>
                </div>
              </div>

              {/* 船舶动态列表 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="w-12 px-6 py-4"></th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">船舶信息</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">船舶类型</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">当前状态</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">来源</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">目的地</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">进入时间</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">离开时间</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_VESSEL_DYNAMICS.map((vessel) => (
                      <React.Fragment key={vessel.id}>
                        <tr 
                          className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer ${expandedRowId === vessel.id ? 'bg-white/[0.03]' : ''}`}
                          onClick={() => setExpandedRowId(expandedRowId === vessel.id ? null : vessel.id)}
                        >
                          <td className="px-6 py-4">
                            <ChevronRight size={14} className={`text-white/20 transition-transform ${expandedRowId === vessel.id ? 'rotate-90' : ''}`} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white/90">{vessel.name}</span>
                              <span className="text-[10px] text-white/30 font-mono">{vessel.mmsi}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-white/60">{vessel.type}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              vessel.status === '正在作业' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              vessel.status === '正在航行' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                              'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            }`}>
                              {vessel.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-white/60">{vessel.origin || '未知'}</td>
                          <td className="px-6 py-4 text-xs text-white/60">{vessel.destination}</td>
                          <td className="px-6 py-4 text-xs text-white/40 font-mono">{vessel.startTime}</td>
                          <td className="px-6 py-4 text-xs text-white/40 font-mono">{vessel.endTime || '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentEvent = vessel.events.find((ev: any) => ev.status === 'current') || vessel.events[vessel.events.length - 1];
                                setPlaybackData({ vessel, event: currentEvent });
                              }}
                              className="text-[10px] font-bold text-sky-400 hover:text-sky-300 transition-colors"
                            >
                              定位
                            </button>
                          </td>
                        </tr>
                        <AnimatePresence>
                          {expandedRowId === vessel.id && (
                            <tr>
                              <td colSpan={9} className="bg-black/20 p-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-8">
                                    <div className="flex items-center gap-3 mb-8">
                                      <div className="w-1 h-4 bg-sky-500 rounded-full" />
                                      <h4 className="text-xs font-black text-white/90 uppercase tracking-widest">船舶生命周期 (辖区内)</h4>
                                    </div>
                                    
                                    <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                                      {vessel.events.map((event, idx) => (
                                        <div key={idx} className="relative">
                                          {/* Timeline Dot */}
                                          <div className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-[#0a0a0a] z-10 ${
                                            event.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                            event.status === 'current' ? 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)] animate-pulse' :
                                            event.status === 'warning' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                            'bg-white/20'
                                          }`} />
                                          
                                          <div className="flex items-start gap-6">
                                            <div className="w-16 shrink-0 pt-0.5">
                                              <span className="text-[10px] font-mono font-bold text-white/30">{event.time}</span>
                                            </div>
                                            <div className={`flex-1 p-4 rounded-xl border transition-all ${
                                              event.status === 'warning' ? 'bg-red-500/5 border-red-500/20' :
                                              event.status === 'current' ? 'bg-sky-500/5 border-sky-500/20' :
                                              'bg-white/5 border-white/10'
                                            }`}>
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                  {event.type === 'comm' && <MessageSquare size={12} className="text-sky-400" />}
                                                  {event.type === 'risk' && <AlertTriangle size={12} className="text-red-400" />}
                                                  {event.type === 'action' && <Ship size={12} className="text-emerald-400" />}
                                                  <span className={`text-[11px] font-black uppercase tracking-wider ${
                                                    event.status === 'warning' ? 'text-red-400' :
                                                    event.status === 'current' ? 'text-sky-400' :
                                                    'text-white/80'
                                                  }`}>{event.label}</span>
                                                </div>
                                                {event.status === 'completed' && (
                                                  <div className="flex items-center gap-3">
                                                    <button 
                                                      onClick={() => setPlaybackData({ vessel, event })}
                                                      className="text-[9px] font-bold text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
                                                    >
                                                      <Play size={10} /> 回放定位
                                                    </button>
                                                    <div className="text-[9px] font-bold text-emerald-500/50 uppercase tracking-widest">已完成</div>
                                                  </div>
                                                )}
                                                {event.status === 'current' && (
                                                  <div className="flex items-center gap-3">
                                                    <button 
                                                      onClick={() => setPlaybackData({ vessel, event })}
                                                      className="text-[9px] font-bold text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
                                                    >
                                                      <MapPin size={10} /> 实时定位
                                                    </button>
                                                    <div className="text-[9px] font-bold text-sky-500 uppercase tracking-widest animate-pulse">进行中</div>
                                                  </div>
                                                )}
                                                {event.status === 'warning' && <div className="text-[9px] font-bold text-red-500 uppercase tracking-widest">风险/违规</div>}
                                              </div>
                                              <p className="text-xs text-white/50 leading-relaxed">{event.desc}</p>
                                              
                                              {/* 对话细节 */}
                                              {event.dialogue && event.dialogue.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-1 h-3 bg-sky-500/50 rounded-full" />
                                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">语音/指令记录</span>
                                                  </div>
                                                  {event.dialogue.map((chat: any, cIdx: number) => (
                                                    <div key={cIdx} className="flex flex-col gap-1">
                                                      <div className="flex items-center justify-between">
                                                        <span className={`text-[10px] font-black ${chat.sender.includes('VTS') || chat.sender.includes('中心') ? 'text-sky-400' : 'text-white/60'}`}>
                                                          {chat.sender}
                                                        </span>
                                                        <span className="text-[9px] font-mono text-white/20">{chat.time}</span>
                                                      </div>
                                                      <div className={`text-xs p-2 rounded-lg ${
                                                        chat.sender.includes('VTS') || chat.sender.includes('中心') 
                                                          ? 'bg-sky-500/10 text-sky-100/80 border border-sky-500/10' 
                                                          : 'bg-white/5 text-white/70 border border-white/5'
                                                      }`}>
                                                        {chat.content}
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                
                <div className="p-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">共 {MOCK_VESSEL_DYNAMICS.length} 条记录</span>
                  <div className="flex gap-2">
                    <button className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white transition-all"><ChevronLeft size={16} /></button>
                    <button className="w-8 h-8 rounded-lg bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20">1</button>
                    <button className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white transition-all"><ChevronRight size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === '预警管理' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['进入禁航区', '走锚风险', '超速警报', '碰撞风险', '异常停泊'].map(type => (
                <div key={type} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-sky-500/30 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400">
                      <Shield size={20} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">启用状态</span>
                      <div className="w-8 h-4 bg-sky-500 rounded-full relative">
                        <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white/90 mb-2">{type}设置</h3>
                  <p className="text-xs text-white/40 leading-relaxed mb-4">配置该预警类型的触发阈值、通知对象及响应等级。</p>
                  <button className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all">
                    进入配置
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeMenu === '场景演示' && (
            <div className="space-y-6">
              {/* 场景演示顶部 Tab */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="flex bg-white/5 rounded-lg p-0.5">
                    {['VHF船舶会话', 'VHF船舶意图识别', 'VHF船舶风险预警'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveScenarioTab(tab)}
                        className={`px-6 py-1.5 text-xs font-bold rounded-md transition-all ${activeScenarioTab === tab ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-white/40 hover:text-white/60'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 场景内容区域: 地图展示 */}
              <div className="h-[500px] rounded-3xl overflow-hidden border border-white/10 relative bg-[#0a0a0a]">
                <MapContainer 
                  center={[31.41, 121.52]} 
                  zoom={12} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  attributionControl={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  
                  {/* VHF 会话模式：展示两个主体及其各自的气泡 */}
                  {activeScenarioTab === 'VHF船舶会话' ? (
                    <>
                      {/* 船舶：宝腾8 */}
                      <Marker 
                        position={[31.40, 121.50]}
                        icon={L.divIcon({
                          className: 'scenario-ship-icon',
                          html: `
                            <div class="relative">
                              <!-- 现代科技风格气泡 -->
                              <div class="absolute bottom-[50px] left-1/2 -translate-x-1/2 min-w-[200px] z-[2000]">
                                <div class="bg-[#0a0a0a]/95 backdrop-blur-xl border border-sky-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(14,165,233,0.2)] ring-1 ring-white/10">
                                  <div class="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                    <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span class="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">宝腾8 (VHF)</span>
                                  </div>
                                  <p class="text-[12px] font-bold text-white leading-tight">离泊后，由南向北划江上行！</p>
                                  <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-sky-500/50"></div>
                                </div>
                              </div>
                              <!-- 船舶符号 -->
                              <div class="w-[20px] h-[40px] bg-[#10b981] rounded-full border-2 border-black shadow-lg"></div>
                            </div>
                          `,
                          iconSize: [0, 0],
                          iconAnchor: [10, 20]
                        })}
                      />

                      {/* 交管中心 */}
                      <Marker 
                        position={[31.43, 121.55]}
                        icon={L.divIcon({
                          className: 'scenario-vts-icon',
                          html: `
                            <div class="relative">
                              <!-- 现代科技风格气泡 -->
                              <div class="absolute bottom-[50px] left-1/2 -translate-x-1/2 min-w-[200px] z-[2000]">
                                <div class="bg-[#0a0a0a]/95 backdrop-blur-xl border border-sky-600/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(14,165,233,0.2)] ring-1 ring-white/10">
                                  <div class="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                    <div class="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
                                    <span class="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em]">吴淞交管 (VHF)</span>
                                  </div>
                                  <p class="text-[12px] font-bold text-white leading-tight">收到，宝腾8。请注意避让进港大型船舶，保持VHF16频道守听。</p>
                                  <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-sky-600/50"></div>
                                </div>
                              </div>
                              <!-- 交管中心符号 -->
                              <div class="w-[30px] h-[30px] bg-sky-600 rounded-lg border-2 border-black flex items-center justify-center shadow-lg">
                                <div class="w-4 h-4 text-white">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                </div>
                              </div>
                            </div>
                          `,
                          iconSize: [0, 0],
                          iconAnchor: [15, 15]
                        })}
                      />
                    </>
                  ) : (
                    /* 其他模式：保持单船展示 */
                    <Marker 
                      position={[31.40, 121.50]}
                      icon={L.divIcon({
                        className: 'scenario-ship-icon',
                        html: `
                          <div class="relative">
                            <div class="absolute bottom-[45px] left-1/2 -translate-x-1/2 min-w-[200px] z-[2000]">
                              <div class="bg-[#0a0a0a]/95 backdrop-blur-xl border border-sky-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(14,165,233,0.2)] ring-1 ring-white/10">
                                <div class="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                  <div class="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
                                  <span class="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em]">识别结果</span>
                                </div>
                                
                                <div class="space-y-3">
                                  ${activeScenarioTab === 'VHF船舶意图识别' ? `
                                    <div class="flex flex-wrap gap-2">
                                      <div class="px-2 py-1 bg-sky-500/20 border border-sky-500/30 rounded text-[10px] font-bold text-sky-400">和泰188 (79%)</div>
                                      <div class="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-white/60">东海救118 (67%)</div>
                                    </div>
                                  ` : `
                                    <div class="flex items-center gap-2 text-red-400">
                                      <div class="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                                      <span class="text-[10px] font-black uppercase tracking-widest">高风险警报</span>
                                    </div>
                                    <div class="text-sm font-bold text-white leading-tight">异常偏离预定航线</div>
                                  `}
                                </div>
                                <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-sky-500/50"></div>
                              </div>
                            </div>
                            <div class="w-[24px] h-[48px] bg-[#10b981] rounded-full relative shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-white/20">
                              <div class="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-[#10b981] -translate-y-[2px]"></div>
                            </div>
                          </div>
                        `,
                        iconSize: [0, 0],
                        iconAnchor: [12, 24]
                      })}
                    />
                  )}
                </MapContainer>

                {/* 地图遮罩/装饰 */}
                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-3xl"></div>
                <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white/60 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    实时渲染引擎已就绪
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === '业务统计' && (
            <div className="space-y-6">
              {/* 统一筛选组件 */}
              <div className="flex items-center gap-4 bg-white/5 p-2.5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
                {/* 2. 时间范围 */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">时间范围</span>
                  <div className="flex bg-white/5 rounded-lg p-0.5">
                    {['今天', '昨天', '最近7天', '自定义'].map(range => (
                      <button
                        key={range}
                        onClick={() => setStatsTimeRange(range)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${statsTimeRange === range ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-white/40 hover:text-white/60'}`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-px h-4 bg-white/10 shrink-0"></div>

                {/* 3. 值班区域 - 改为 Select */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">值班区域</span>
                  <select 
                    value={statsArea}
                    onChange={(e) => setStatsArea(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white/80 focus:outline-none focus:border-sky-500/50 min-w-[120px] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    {['全部区域', ...MOCK_AREAS['值班区域'].map(a => a.name)].map(area => (
                      <option key={area} value={area} className="bg-[#1a1c20] text-white">{area}</option>
                    ))}
                  </select>
                </div>

                {/* 4. 业务特定筛选 */}
                {activeStatsTab === '船舶风险统计' && (
                  <>
                    <div className="w-px h-4 bg-white/10 shrink-0"></div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">风险行为</label>
                      <select className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white/80 focus:outline-none focus:border-sky-500/50 min-w-[100px] cursor-pointer hover:bg-white/10 transition-colors">
                        <option value="" className="bg-[#1a1c20] text-white">全部行为</option>
                        <option value="超速航行" className="bg-[#1a1c20] text-white">超速航行</option>
                        <option value="偏离航道" className="bg-[#1a1c20] text-white">偏离航道</option>
                        <option value="非法锚泊" className="bg-[#1a1c20] text-white">非法锚泊</option>
                        <option value="进入禁航区" className="bg-[#1a1c20] text-white">进入禁航区</option>
                        <option value="异常停泊" className="bg-[#1a1c20] text-white">异常停泊</option>
                      </select>
                    </div>
                    <div className="w-px h-4 bg-white/10 shrink-0"></div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">MMSI</label>
                      <input 
                        type="text" 
                        placeholder="MMSI..." 
                        className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white/80 focus:outline-none focus:border-sky-500/50 w-24" 
                      />
                    </div>
                  </>
                )}

                {activeStatsTab === '意图统计' && (
                  <>
                    <div className="w-px h-4 bg-white/10 shrink-0"></div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">意图种类</label>
                      <select className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white/80 focus:outline-none focus:border-sky-500/50 min-w-[100px] cursor-pointer hover:bg-white/10 transition-colors">
                        <option value="" className="bg-[#1a1c20] text-white">全部种类</option>
                        <option value="前往锚地" className="bg-[#1a1c20] text-white">前往锚地</option>
                        <option value="抛锚" className="bg-[#1a1c20] text-white">抛锚</option>
                        <option value="起锚" className="bg-[#1a1c20] text-white">起锚</option>
                        <option value="前往泊位" className="bg-[#1a1c20] text-white">前往泊位</option>
                        <option value="靠泊" className="bg-[#1a1c20] text-white">靠泊</option>
                        <option value="离泊" className="bg-[#1a1c20] text-white">离泊</option>
                        <option value="上引水" className="bg-[#1a1c20] text-white">上引水</option>
                        <option value="下引水" className="bg-[#1a1c20] text-white">下引水</option>
                      </select>
                    </div>
                    <div className="w-px h-4 bg-white/10 shrink-0"></div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">意图状态</label>
                      <select className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white/80 focus:outline-none focus:border-sky-500/50 min-w-[100px] cursor-pointer hover:bg-white/10 transition-colors">
                        <option value="" className="bg-[#1a1c20] text-white">全部状态</option>
                        <option value="批准" className="bg-[#1a1c20] text-white">批准</option>
                        <option value="拒绝" className="bg-[#1a1c20] text-white">拒绝</option>
                        <option value="回复等待" className="bg-[#1a1c20] text-white">回复等待</option>
                      </select>
                    </div>
                    <div className="w-px h-4 bg-white/10 shrink-0"></div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">MMSI</label>
                      <input 
                        type="text" 
                        placeholder="MMSI..." 
                        className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white/80 focus:outline-none focus:border-sky-500/50 w-24" 
                      />
                    </div>
                  </>
                )}

                <div className="flex-1"></div>

                <button className="shrink-0 px-6 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-bold rounded-lg transition-all shadow-lg shadow-sky-500/20">
                  查询
                </button>
              </div>

              {activeStatsTab === '船舶风险统计' && (
                <div className="space-y-4">

                  {/* 数据表格 */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10">
                            <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">船舶信息</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">货物类型</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">风险行为</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">触发时间</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MOCK_RISK_STATS.map((item) => (
                            <React.Fragment key={item.id}>
                              <tr 
                                className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer ${expandedRowId === item.id ? 'bg-white/[0.03]' : ''}`}
                                onClick={() => setExpandedRowId(expandedRowId === item.id ? null : item.id)}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white/90">{item.name}</span>
                                    <span className="text-[10px] text-white/30 font-mono">{item.mmsi}</span>
                                    <span className="text-[10px] text-sky-400/60">{item.type}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-white/60">{item.cargo}</td>
                                <td className="px-6 py-4">
                                  <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] font-bold text-red-400">
                                    {item.risk}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-[10px] text-white/40 font-mono">{item.time}</td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <ChevronDown 
                                      size={14} 
                                      className={`text-white/20 transition-transform duration-300 ${expandedRowId === item.id ? 'rotate-180' : ''}`} 
                                    />
                                  </div>
                                </td>
                              </tr>
                              <AnimatePresence>
                                {expandedRowId === item.id && (
                                  <tr>
                                    <td colSpan={5} className="px-6 py-0 border-b border-white/5 bg-white/[0.01]">
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="py-4 grid grid-cols-12 gap-6">
                                          {/* 左侧：详情 + 时间轴 */}
                                          <div className="col-span-8 space-y-6">
                                            <div className="grid grid-cols-2 gap-6">
                                              {/* 风险详情 */}
                                              <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">风险详情</span>
                                                <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3 h-[130px] flex flex-col justify-center">
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-white/40">风险指数</span>
                                                    <span className="text-sm font-black text-red-400">{item.riskScore}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-white/40">风险行为</span>
                                                    <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] font-bold text-red-400">{item.risk}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-white/40">触发时间</span>
                                                    <span className="text-[10px] font-mono text-white/60">{item.time.split(' ')[1]}</span>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* 船舶详情 */}
                                              <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">船舶详情</span>
                                                <div className="bg-white/5 border border-white/5 rounded-xl p-4 h-[130px] flex flex-col justify-center">
                                                  <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
                                                    <div className="flex justify-between items-center">
                                                      <span className="text-[10px] text-white/40">呼号</span>
                                                      <span className="text-[10px] font-mono text-sky-400">{item.callsign}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                      <span className="text-[10px] text-white/40">MMSI</span>
                                                      <span className="text-[10px] font-mono text-sky-400">{item.mmsi}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                      <span className="text-[10px] text-white/40">船长</span>
                                                      <span className="text-[10px] text-white/80">{item.length}m</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                      <span className="text-[10px] text-white/40">船宽</span>
                                                      <span className="text-[10px] text-white/80">{item.width}m</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                      <span className="text-[10px] text-white/40">吃水</span>
                                                      <span className="text-[10px] text-white/80">{item.draft}m</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                      <span className="text-[10px] text-white/80">船型</span>
                                                      <span className="text-[10px] text-white/40">{item.type}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                      <span className="text-[10px] text-white/40">货物</span>
                                                      <span className="text-[10px] text-white/80 truncate ml-2">{item.cargo}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                      <span className="text-[10px] text-white/40">目的港</span>
                                                      <span className="text-[10px] text-white/80 truncate ml-2">{item.destination}</span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>

                                            {/* 风险演化时间轴 */}
                                            <div className="space-y-1">
                                              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">风险演化时间轴</span>
                                              <div className="bg-white/5 border border-white/5 rounded-xl p-4 h-[112px] flex items-center">
                                                <div className="flex items-center justify-between gap-2 w-full">
                                                  {item.timeline.map((t, idx) => (
                                                    <div key={idx} className="flex-1 relative">
                                                      {idx !== item.timeline.length - 1 && (
                                                        <div className="absolute top-[11px] left-[50%] w-full h-[1px] bg-white/10" />
                                                      )}
                                                      <div className="flex flex-col items-center gap-1.5 relative z-10">
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                                          t.type === 'risk' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                          t.type === 'warning' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                                          'bg-white/10 text-white/40 border border-white/10'
                                                        }`}>
                                                          {idx + 1}
                                                        </div>
                                                        <div className="text-center">
                                                          <div className="text-[9px] font-bold text-white/70 whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">{t.event}</div>
                                                          <div className="text-[7px] font-mono text-white/20">{t.time}</div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* 右侧：预警快照 */}
                                          <div className="col-span-4 space-y-1">
                                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">预警快照</span>
                                            <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden group relative">
                                              <div className="relative aspect-video">
                                                <img 
                                                  src={item.snapshot?.image} 
                                                  alt="Snapshot" 
                                                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" 
                                                  referrerPolicy="no-referrer" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <MapPin size={12} className="text-sky-400" />
                                                    <span className="text-[10px] text-white/90 font-bold truncate">{item.snapshot?.location}</span>
                                                  </div>
                                                  <div className="grid grid-cols-3 gap-2">
                                                    <div className="flex flex-col">
                                                      <span className="text-[8px] text-white/40 uppercase tracking-tighter">实际航速</span>
                                                      <span className="text-[11px] font-bold text-red-400">{item.snapshot?.actualSpeed} kn</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                      <span className="text-[8px] text-white/40 uppercase tracking-tighter">规定限速</span>
                                                      <span className="text-[11px] font-bold text-emerald-400">{item.snapshot?.speedLimit} kn</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                      <span className="text-[8px] text-white/40 uppercase tracking-tighter">超速幅度</span>
                                                      <span className="text-[11px] font-bold text-amber-400">
                                                        {item.snapshot ? (((item.snapshot.actualSpeed - item.snapshot.speedLimit) / item.snapshot.speedLimit) * 100).toFixed(1) : 0}%
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-black rounded uppercase tracking-widest shadow-lg">
                                                  Warning Snapshot
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    </td>
                                  </tr>
                                )}
                              </AnimatePresence>
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 border-t border-white/5 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">共 {MOCK_RISK_STATS.length} 条记录</span>
                      <div className="flex gap-2">
                        <button className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white transition-all"><ChevronLeft size={16} /></button>
                        <button className="w-8 h-8 rounded-lg bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20">1</button>
                        <button className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white transition-all"><ChevronRight size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeStatsTab === '意图统计' && (
                <div className="space-y-4">

                  {/* 数据表格 */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10">
                            <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">船舶信息</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">识别意图</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">置信度</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">发生时间</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">当前状态</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MOCK_INTENT_STATS.map((item) => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-white/90">{item.name}</span>
                                  <span className="text-[10px] text-white/30 font-mono">{item.mmsi}</span>
                                  <span className="text-[10px] text-sky-400/60">{item.type}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs text-white/60">{item.intent}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden max-w-[60px]">
                                    <div 
                                      className="h-full bg-sky-500" 
                                      style={{ width: `${item.confidence}%` }} 
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono text-sky-400">{item.confidence}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-[10px] text-white/40 font-mono">{item.time}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 border rounded text-[10px] font-bold ${
                                  item.status === '批准' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                  item.status === '拒绝' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                  item.status === '回复等待' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                  item.status === '主动询问' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                                  'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 border-t border-white/5 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">共 {MOCK_INTENT_STATS.length} 条记录</span>
                      <div className="flex gap-2">
                        <button className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white transition-all"><ChevronLeft size={16} /></button>
                        <button className="w-8 h-8 rounded-lg bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20">1</button>
                        <button className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white transition-all"><ChevronRight size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeStatsTab === '值班统计' && (
                <div className="space-y-6">
                  {/* 核心指标卡片 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <MessageSquare size={20} className="text-sky-400" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+12%</span>
                      </div>
                      <div className="text-2xl font-black text-white mb-1">1,284</div>
                      <div className="text-[11px] font-bold text-white/30 uppercase tracking-widest">对话次数</div>
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Activity size={20} className="text-blue-400" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+5%</span>
                      </div>
                      <div className="text-2xl font-black text-white mb-1">456</div>
                      <div className="text-[11px] font-bold text-white/30 uppercase tracking-widest">指挥次数</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Check size={20} className="text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+8%</span>
                      </div>
                      <div className="text-2xl font-black text-white mb-1">892</div>
                      <div className="text-[11px] font-bold text-white/30 uppercase tracking-widest">回答次数</div>
                    </div>
                  </div>

                  {/* 详细统计图表占位 */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-sm font-bold text-white/90">值班趋势分析</h3>
                        <p className="text-[11px] text-white/30 mt-1">过去 24 小时值班员交互数据趋势</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-white/10 rounded-md text-[10px] font-bold text-white/60 hover:text-white transition-colors">导出报告</button>
                        <button 
                          onClick={() => setShowVhfDetails(true)}
                          className="px-3 py-1 bg-sky-500 rounded-md text-[10px] font-bold text-white shadow-lg shadow-sky-500/20"
                        >
                          查看详情
                        </button>
                      </div>
                    </div>
                    
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={[
                            { time: '00:00', count: 45 },
                            { time: '02:00', count: 32 },
                            { time: '04:00', count: 28 },
                            { time: '06:00', count: 56 },
                            { time: '08:00', count: 124 },
                            { time: '10:00', count: 189 },
                            { time: '12:00', count: 145 },
                            { time: '14:00', count: 167 },
                            { time: '16:00', count: 210 },
                            { time: '18:00', count: 178 },
                            { time: '20:00', count: 134 },
                            { time: '22:00', count: 89 },
                          ]}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis 
                            dataKey="time" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0a0a0a', 
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                            itemStyle={{ color: '#0ea5e9' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#0ea5e9" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorCount)" 
                            name="对话次数"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMenu !== '区域设置' && activeMenu !== '预警管理' && activeMenu !== '船舶动态' && activeMenu !== '场景演示' && activeMenu !== '业务统计' && (
            <div className="h-[400px] flex flex-col items-center justify-center text-white/20 gap-4">
              <Layout size={64} />
              <span className="text-sm font-medium">功能开发中...</span>
            </div>
          )}
        </main>

        {/* VHF 对话详情弹窗 */}
        <AnimatePresence>
          {showVhfDetails && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowVhfDetails(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-6xl h-[80vh] bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                {/* 弹窗头部 */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center">
                      <MessageSquare className="text-sky-400" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white">VHF 对话详情回放</h2>
                      <p className="text-xs text-white/30 mt-1">船舶：中远海运 123 (MMSI: 413123456) | 时间：2026-03-19 10:05</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowVhfDetails(false)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* 弹窗内容 */}
                <div className="flex-1 flex overflow-hidden">
                  {/* 左侧：对话历史 */}
                  <div className="w-1/2 border-r border-white/10 flex flex-col bg-[#050505]">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">对话记录</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                          <span className="text-[10px] text-white/40">VTS 中心</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-[10px] text-white/40">船舶</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {[
                        { id: 1, time: "10:05:22", sender: "VTS Center", isVts: true, text: "中远海运 123，这里是 VTS 中心，请报告您的当前航向。", lat: 30.123, lng: 122.456 },
                        { id: 2, time: "10:05:45", sender: "COSCO SHIPPING 123", isVts: false, text: "VTS 中心，我是中远海运 123，当前航向 095，航速 12 节。", lat: 30.125, lng: 122.460 },
                        { id: 3, time: "10:06:10", sender: "VTS Center", isVts: true, text: "收到，请保持当前航向，注意避让前方 2 海里处的渔船。", lat: 30.127, lng: 122.465 },
                        { id: 4, time: "10:06:35", sender: "COSCO SHIPPING 123", isVts: false, text: "收到，正在调整航向避让，谢谢提醒。", lat: 30.129, lng: 122.470 },
                      ].map((msg) => (
                        <motion.div
                          key={msg.id}
                          whileHover={{ x: 4 }}
                          onClick={() => setSelectedVhfSnippet(msg)}
                          className={`group cursor-pointer p-4 rounded-2xl transition-all ${selectedVhfSnippet?.id === msg.id ? 'bg-sky-500/10 border border-sky-500/30' : 'bg-white/5 border border-transparent hover:border-white/10'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${msg.isVts ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {msg.sender}
                            </span>
                            <span className="text-[10px] text-white/20 font-mono">{msg.time}</span>
                          </div>
                          <p className="text-sm text-white/80 leading-relaxed mb-3">{msg.text}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Volume2 size={14} />
                              <span className="text-[10px] font-bold uppercase tracking-wider">点击播放音频</span>
                            </div>
                            {selectedVhfSnippet?.id === msg.id && (
                              <div className="flex items-center gap-1 text-emerald-400">
                                <MapPin size={12} />
                                <span className="text-[10px] font-bold">已同步轨迹位置</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* 右侧：历史轨迹地图 */}
                  <div className="w-1/2 relative bg-[#0a0a0a]">
                    <div className="absolute top-4 left-4 z-[4001] bg-[#050505]/80 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <History size={14} className="text-sky-400" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">历史轨迹回放</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-white/40">当前位置：{selectedVhfSnippet ? `${selectedVhfSnippet.lat.toFixed(3)}, ${selectedVhfSnippet.lng.toFixed(3)}` : '请选择对话片段'}</div>
                        <div className="text-[10px] text-white/40">轨迹点数：124 点</div>
                      </div>
                    </div>

                    <div className="h-full w-full">
                      <MapContainer
                        center={[30.125, 122.460]}
                        zoom={14}
                        className="h-full w-full"
                        zoomControl={false}
                      >
                        <TileLayer
                          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />
                        {/* 历史轨迹线 */}
                        <Polyline 
                          positions={[
                            [30.120, 122.450],
                            [30.123, 122.456],
                            [30.125, 122.460],
                            [30.127, 122.465],
                            [30.129, 122.470],
                            [30.132, 122.475]
                          ]}
                          color="#0ea5e9"
                          weight={3}
                          opacity={0.6}
                          dashArray="10, 10"
                        />
                        {/* 船舶当前位置标记 */}
                        {selectedVhfSnippet && (
                          <Marker 
                            position={[selectedVhfSnippet.lat, selectedVhfSnippet.lng]}
                            icon={L.divIcon({
                              className: 'custom-div-icon',
                              html: `
                                <div class="relative">
                                  <div class="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-sky-500 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.8)] border-2 border-white animate-pulse"></div>
                                  <div class="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-sky-500/20 rounded-full animate-ping"></div>
                                </div>
                              `,
                              iconSize: [0, 0]
                            })}
                          />
                        )}
                      </MapContainer>
                    </div>

                    {/* 底部播放控制 */}
                    <div className="absolute bottom-6 left-6 right-6 z-[4001] bg-[#050505]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl">
                      <div className="flex items-center gap-4">
                        <button className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform">
                          <Play size={18} fill="currentColor" />
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-white/60">轨迹回放进度</span>
                            <span className="text-[10px] font-mono text-white/40">10:05:22 / 10:06:35</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: selectedVhfSnippet ? `${(selectedVhfSnippet.id / 4) * 100}%` : '0%' }}
                              className="h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {playbackData && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed top-24 right-6 w-96 z-[8000] pointer-events-auto"
            >
              <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                {/* 头部 */}
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-sky-500/10 to-transparent">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-sky-500 rounded-xl text-white shadow-lg shadow-sky-500/20">
                        <History size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">历史回放定位</h3>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Playback Mode</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setPlaybackData(null)}
                      className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">目标船舶</span>
                      <span className="text-xs font-bold text-white">{playbackData.vessel.name}</span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">定位时间</span>
                      <span className="text-xs font-mono font-bold text-sky-400">{playbackData.event.time}</span>
                    </div>
                  </div>
                </div>

                {/* 内容 */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {/* 船舶上下文事件时间轴 */}
                  {playbackData.event.timeline && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-sky-400" />
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">船舶上下文事件 (最近)</span>
                      </div>
                      <div className="relative pl-4 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                        {playbackData.event.timeline.map((item: any, idx: number) => (
                          <div key={idx} className="relative">
                            {/* 时间轴圆点 */}
                            <div className={`absolute -left-[15px] top-1.5 w-2 h-2 rounded-full border-2 border-[#111] ${
                              item.type === 'risk' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                              item.type === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
                            }`} />
                            
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-mono text-white/30">{item.time}</span>
                              <div className={`text-xs p-2 rounded-lg border ${
                                item.type === 'risk' ? 'bg-red-500/10 border-red-500/20 text-red-200' :
                                item.type === 'warning' ? 'bg-amber-500/5 border-amber-500/10 text-amber-200/80' :
                                'bg-white/5 border-white/5 text-white/70'
                              }`}>
                                {item.event}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 环节细节 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-sky-400" />
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">环节细节</span>
                    </div>
                    <div className={`p-4 rounded-2xl border ${
                      playbackData.event.type === 'risk' ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/5'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold ${
                          playbackData.event.type === 'risk' ? 'text-red-400' : 'text-sky-400'
                        }`}>{playbackData.event.label}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{playbackData.event.desc}</p>
                    </div>
                  </div>

                  {/* 对话记录 */}
                  {playbackData.event.dialogue && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-sky-400" />
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">当时对话记录</span>
                      </div>
                      <div className="space-y-2">
                        {playbackData.event.dialogue.map((chat: any, idx: number) => (
                          <div key={idx} className={`flex flex-col gap-0.5 ${chat.sender.includes('VTS') ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[9px] font-bold text-white/30 uppercase">{chat.sender}</span>
                              <span className="text-[9px] font-mono text-white/20">{chat.time}</span>
                            </div>
                            <div className={`text-xs p-1.5 rounded-2xl max-w-[90%] ${
                              chat.sender.includes('VTS') 
                                ? 'bg-sky-500 text-white rounded-tr-none shadow-lg shadow-sky-500/20' 
                                : 'bg-white/10 text-white/80 rounded-tl-none border border-white/10'
                            }`}>
                              {chat.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 底部操作 */}
                <div className="p-4 bg-white/5 border-t border-white/10 flex gap-3">
                  <button 
                    onClick={() => setDynamicPlaybackSession(playbackData)}
                    className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
                  >
                    <Play size={14} /> 开始动态回放
                  </button>
                  <button 
                    onClick={() => setPlaybackData(null)}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 text-xs font-bold rounded-xl border border-white/10 transition-all"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// --- 动态回放视图组件 ---

const DynamicPlaybackView = ({ 
  session, 
  onClose 
}: { 
  session: any, 
  onClose: () => void 
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(MOCK_AREAS)));
  
  // 生成模拟轨迹数据 (基于原始坐标点)
  const trajectory = useMemo(() => {
    const center = session.event.coords;
    const points: [number, number][] = [];
    const steps = 100;
    
    // 模拟一段带有转弯的轨迹
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const lat = center[0] - 0.02 + 0.04 * t + Math.sin(t * 5) * 0.005;
      const lng = center[1] - 0.02 + 0.04 * t + Math.cos(t * 5) * 0.005;
      points.push([lat, lng]);
    }
    return points;
  }, [session]);

  const currentPos = trajectory[Math.floor((progress / 100) * (trajectory.length - 1))];

  useEffect(() => {
    let interval: any;
    if (isPlaying && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.5 * playbackSpeed, 100));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, progress]);

  const toggleArea = (id: string) => {
    const newSelected = new Set(selectedAreas);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAreas(newSelected);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleAllInCategory = (category: string, areas: any[]) => {
    const newSelected = new Set(selectedAreas);
    const allSelected = areas.every(a => selectedAreas.has(a.id));
    
    areas.forEach(a => {
      if (allSelected) {
        newSelected.delete(a.id);
      } else {
        newSelected.add(a.id);
      }
    });
    setSelectedAreas(newSelected);
  };

  // 为选中的区域生成模拟地图元素
  const areaMapElements = useMemo(() => {
    const elements: any[] = [];
    Object.values(MOCK_AREAS).flat().forEach(area => {
      if (selectedAreas.has(area.id)) {
        // 随机生成一个中心点附近的区域
        const center = session.event.coords;
        const offsetLat = (Math.random() - 0.5) * 0.04;
        const offsetLng = (Math.random() - 0.5) * 0.04;
        const areaCenter: [number, number] = [center[0] + offsetLat, center[1] + offsetLng];
        
        elements.push({
          id: area.id,
          name: area.name,
          type: area.type,
          center: areaCenter,
          // 模拟一个多边形
          bounds: [
            [areaCenter[0] - 0.005, areaCenter[1] - 0.005],
            [areaCenter[0] + 0.005, areaCenter[1] - 0.005],
            [areaCenter[0] + 0.005, areaCenter[1] + 0.005],
            [areaCenter[0] - 0.005, areaCenter[1] + 0.005],
          ] as [number, number][]
        });
      }
    });
    return elements;
  }, [selectedAreas, session.event.coords]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col"
    >
      {/* 顶部控制栏 */}
      <div className="h-20 bg-black/80 backdrop-blur-xl border-b border-white/10 flex flex-col z-[10]">
        <div className="flex-1 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">动态轨迹回放: {session.vessel.name}</h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                事件时间: {session.event.time} | 风险类型: {session.event.label}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-lg ${
                isPlaying 
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 hover:bg-amber-500/30' 
                  : 'bg-sky-500 text-white hover:bg-sky-600 shadow-sky-500/20'
              }`}
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              <span className="uppercase tracking-widest">{isPlaying ? '暂停' : '播放'}</span>
            </button>

            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              {[1, 2, 4, 8].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-3 py-1 text-[10px] font-black rounded transition-all ${
                    playbackSpeed === speed ? 'bg-sky-500 text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {speed}X
                </button>
              ))}
            </div>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all"
            >
              退出回放
            </button>
          </div>
        </div>

        {/* 顶部时间轴 */}
        <div className="h-8 px-6 flex items-center gap-4 border-t border-white/5 bg-white/[0.02]">
          <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">时间轴</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full relative">
            <div 
              className="absolute top-0 left-0 h-full bg-sky-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"
              style={{ width: `${progress}%` }}
            />
            {/* 时间刻度 */}
            {[0, 25, 50, 75, 100].map(p => (
              <div 
                key={p} 
                className="absolute top-[-4px] w-px h-3 bg-white/20"
                style={{ left: `${p}%` }}
              >
                <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-white/20 whitespace-nowrap">
                  {p === 0 ? 'T-15m' : p === 50 ? 'T-0' : p === 100 ? 'T+15m' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧区域面板 - 树形结构 */}
        <div className="w-64 bg-black/40 backdrop-blur-md border-r border-white/10 flex flex-col z-[10]">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapIcon size={16} className="text-sky-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">辖区管理面板</h3>
            </div>
            <span className="text-[9px] font-bold text-sky-400/60 uppercase tracking-widest bg-sky-500/10 px-1.5 py-0.5 rounded">
              已选 {selectedAreas.size}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <div className="space-y-1">
              {Object.entries(MOCK_AREAS).map(([category, areas]) => {
                const isExpanded = expandedCategories.has(category);
                const allSelected = areas.every(a => selectedAreas.has(a.id));
                const someSelected = areas.some(a => selectedAreas.has(a.id)) && !allSelected;

                return (
                  <div key={category} className="space-y-0.5">
                    {/* 分类节点 */}
                    <div className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg transition-all group">
                      <button 
                        onClick={() => toggleCategory(category)}
                        className="p-0.5 hover:bg-white/10 rounded text-white/40 transition-all"
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <div 
                        onClick={() => toggleAllInCategory(category, areas)}
                        className="flex-1 flex items-center gap-2 cursor-pointer"
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                          allSelected ? 'bg-sky-500 border-sky-500' : someSelected ? 'bg-sky-500/40 border-sky-500/60' : 'border-white/20'
                        }`}>
                          {allSelected && <Check size={10} className="text-white" strokeWidth={4} />}
                          {someSelected && <div className="w-1.5 h-0.5 bg-white rounded-full" />}
                        </div>
                        <span className="text-[11px] font-bold text-white/60 group-hover:text-white transition-colors">{category}</span>
                      </div>
                    </div>

                    {/* 子区域列表 */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden ml-6 space-y-0.5"
                        >
                          {areas.map(area => (
                            <div 
                              key={area.id}
                              onClick={() => toggleArea(area.id)}
                              className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer group transition-all"
                            >
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                selectedAreas.has(area.id) ? 'bg-sky-500 border-sky-500' : 'border-white/20'
                              }`}>
                                {selectedAreas.has(area.id) && <Check size={10} className="text-white" strokeWidth={4} />}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-[11px] transition-colors ${selectedAreas.has(area.id) ? 'text-white font-bold' : 'text-white/40 group-hover:text-white/60'}`}>
                                  {area.name}
                                </span>
                                <span className="text-[8px] text-white/20">{area.type}</span>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-4 border-t border-white/10 bg-white/[0.02]">
            <button 
              onClick={() => setSelectedAreas(new Set())}
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/40 hover:text-white text-[10px] font-bold transition-all"
            >
              重置选择
            </button>
          </div>
        </div>

        {/* 地图区域 */}
        <div className="flex-1 relative">
          <MapContainer 
            center={session.event.coords} 
            zoom={14} 
            className="h-full w-full"
            zoomControl={false}
          >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri'
          />
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          />
          
          {/* 渲染选中的辖区 */}
          {areaMapElements.map(element => (
            <React.Fragment key={element.id}>
              <Polygon 
                positions={element.bounds}
                pathOptions={{ 
                  color: '#0ea5e9', 
                  fillColor: '#0ea5e9', 
                  fillOpacity: 0.2, 
                  weight: 2,
                  dashArray: '5, 5'
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="text-xs font-bold text-sky-500 mb-1">{element.name}</h4>
                    <p className="text-[10px] text-gray-500">类型: {element.type}</p>
                  </div>
                </Popup>
              </Polygon>
              <Marker 
                position={element.center}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `
                    <div class="flex flex-col items-center">
                      <div class="px-2 py-1 bg-sky-500/80 backdrop-blur-md border border-white/20 rounded text-[9px] font-bold text-white whitespace-nowrap shadow-lg">
                        ${element.name}
                      </div>
                      <div class="w-2 h-2 bg-sky-500 rotate-45 -mt-1 border-r border-b border-white/20"></div>
                    </div>
                  `,
                  iconSize: [100, 40],
                  iconAnchor: [50, 40]
                })}
              />
            </React.Fragment>
          ))}
          
          {/* 完整轨迹线 */}
          <Polyline 
            positions={trajectory} 
            pathOptions={{ color: '#38bdf8', weight: 3, opacity: 0.3, dashArray: '10, 10' }} 
          />
          
          {/* 已走过的轨迹线 */}
          <Polyline 
            positions={trajectory.slice(0, Math.floor((progress / 100) * (trajectory.length - 1)) + 1)} 
            pathOptions={{ color: '#38bdf8', weight: 4, opacity: 0.8 }} 
          />

          {/* 风险点标记 */}
          <CircleMarker 
            center={session.event.coords} 
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.4 }} 
            radius={15}
          >
            <Popup>
              <div className="p-2 text-xs font-bold text-red-500">
                风险触发点: {session.event.label}
              </div>
            </Popup>
          </CircleMarker>

          {/* 当前船舶位置 */}
          {currentPos && (
            <Marker 
              position={currentPos}
              icon={L.divIcon({
                className: 'custom-div-icon',
                html: `
                  <div class="relative">
                    <div class="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg shadow-sky-500/50">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="3" fill="none" style="transform: rotate(45deg)">
                        <path d="M12 2L19 21L12 17L5 21L12 2Z" />
                      </svg>
                    </div>
                    <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[9px] font-bold text-white whitespace-nowrap">
                      ${session.vessel.name}
                    </div>
                  </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              })}
            />
          )}
        </MapContainer>

        {/* 底部进度条 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[80%] max-w-4xl z-[10]">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-6 shadow-2xl">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 bg-sky-500 hover:bg-sky-400 text-white rounded-full flex items-center justify-center transition-all shadow-lg shadow-sky-500/20"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
            </button>
            
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase tracking-widest">
                <span>回放进度</span>
                <span>{Math.floor(progress)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden relative group cursor-pointer">
                <div 
                  className="h-full bg-sky-500 transition-all duration-100" 
                  style={{ width: `${progress}%` }}
                />
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={progress}
                  onChange={(e) => setProgress(parseFloat(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">实时航速</span>
              <span className="text-xl font-mono font-bold text-white">
                {(12 + Math.sin(progress / 10) * 2).toFixed(1)} <span className="text-xs text-white/40">KN</span>
              </span>
            </div>
          </div>
        </div>

        {/* 右侧事件面板 */}
        <div className="absolute top-24 right-8 w-72 z-[10] space-y-4">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-sky-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">实时状态监控</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-white/40 font-bold uppercase">当前经度</span>
                <span className="text-[10px] font-mono text-white/80">{currentPos?.[1].toFixed(5)}°E</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-white/40 font-bold uppercase">当前纬度</span>
                <span className="text-[10px] font-mono text-white/80">{currentPos?.[0].toFixed(5)}°N</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-white/40 font-bold uppercase">预警状态</span>
                <span className={`text-[10px] font-bold uppercase ${progress > 80 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  {progress > 80 ? '风险触发' : '正常航行'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} className="text-sky-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">历史通讯记录</h4>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {session.event.dialogue.map((chat: any, idx: number) => (
                <div key={idx} className={`space-y-0.5 ${progress < (idx + 1) * 20 ? 'opacity-20' : 'opacity-100 transition-opacity duration-500'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-white/30 uppercase">{chat.sender}</span>
                    <span className="text-[8px] font-mono text-white/20">{chat.time.split(' ')[1]}</span>
                  </div>
                  <p className="text-[10px] text-white/70 leading-relaxed bg-white/5 p-1 rounded-lg border border-white/5">
                    {chat.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </motion.div>
  );
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('left');
  const [showBars, setShowBars] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>('vhf');
  const [vhfViewMode, setVhfViewMode] = useState<'list' | 'flow'>('list');
  const [selectedIntent, setSelectedIntent] = useState<number | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [selectedAnchorage, setSelectedAnchorage] = useState<string | null>(null);
  const [selectedExpiringShip, setSelectedExpiringShip] = useState<string | null>(null);
  const [intents, setIntents] = useState<IntentItem[]>(INTENT_DATA);
  const [intentFilter, setIntentFilter] = useState('全部');
  const [editingIntentIndex, setEditingIntentIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ action: string; details: string }>({ action: '', details: '' });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isControlPanelExpanded, setIsControlPanelExpanded] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [initialAdminMenu, setInitialAdminMenu] = useState<string | undefined>(undefined);
  const [initialAdminStatsTab, setInitialAdminStatsTab] = useState<string | undefined>(undefined);
  const [playbackData, setPlaybackData] = useState<{ vessel: any, event: any } | null>(null);
  const [dynamicPlaybackSession, setDynamicPlaybackSession] = useState<{ vessel: any, event: any } | null>(null);
  const [vhfMessages, setVhfMessages] = useState<VHFMessage[]>(MOCK_VHF_MESSAGES);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-white font-sans overflow-hidden flex flex-col">
      <AnimatePresence>
        {dynamicPlaybackSession && (
          <DynamicPlaybackView 
            session={dynamicPlaybackSession} 
            onClose={() => setDynamicPlaybackSession(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdminView && (
          <AdminPanel 
            onClose={() => {
              setIsAdminView(false);
              setInitialAdminMenu(undefined);
              setInitialAdminStatsTab(undefined);
            }} 
            playbackData={playbackData}
            setPlaybackData={setPlaybackData}
            setDynamicPlaybackSession={setDynamicPlaybackSession}
            initialMenu={initialAdminMenu}
            initialStatsTab={initialAdminStatsTab}
          />
        )}
      </AnimatePresence>

      {/* --- 顶部导航栏 --- */}
      <AnimatePresence>
        {showBars && (
          <motion.header 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 40, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-4 z-[3000] shrink-0"
          >
            <div className="flex items-center gap-4">
              {/* Search moved to rail */}
            </div>

            {/* 中心标题 */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
              <div className="relative">
                <div className="w-1.5 h-3 bg-sky-500 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.6)]" />
                <div className="absolute inset-0 bg-sky-400 blur-sm opacity-50 animate-pulse" />
              </div>
              <h1 className="text-sm font-black uppercase tracking-[0.3em] text-white/90">VTS智能辅助系统</h1>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsAdminView(true)}
                className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition-colors"
              >
                <Settings size={20} />
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`p-2 rounded-full transition-all relative ${showUserMenu ? 'bg-sky-500/20 text-sky-400' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                  <User size={20} />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowUserMenu(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl z-50"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400">
                              <User size={16} />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white/90">管理员</div>
                              <div className="text-[10px] text-white/40">在线</div>
                            </div>
                          </div>
                          
                          <div className="h-px bg-white/5 mx-1" />
                          
                          <div className="px-2 py-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">当前区域</div>
                            <div className="flex items-center gap-2 text-xs text-white/70">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              外高桥区域
                            </div>
                          </div>

                          <button className="w-full flex items-center gap-2 px-2 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <LogOut size={14} />
                            退出登录
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* --- 主内容区 --- */}
      <main className={`flex-1 flex overflow-hidden relative ${sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* 统一侧边栏 */}
        <SidebarPanel 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          position={sidebarPosition}
          showBars={showBars}
          onToggleBars={() => setShowBars(!showBars)}
        >
          {activeTab === 'vhf' && (
            <div className="flex flex-col h-full">
              {/* VHF Header/Toggle */}
              <div className="p-2 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">VHF 实时监控</span>
                </div>
                <div className="flex bg-white/5 p-0.5 rounded-md">
                  <button 
                    onClick={() => setVhfViewMode('list')}
                    className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded transition-all ${
                      vhfViewMode === 'list' ? 'bg-sky-500 text-white' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    列表
                  </button>
                  <button 
                    onClick={() => setVhfViewMode('flow')}
                    className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded transition-all ${
                      vhfViewMode === 'flow' ? 'bg-sky-500 text-white' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    对话流
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {vhfViewMode === 'list' ? (
                  [...vhfMessages].reverse().map((msg, idx) => msg && (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, x: msg.isVTS ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex flex-col ${msg.isVTS ? 'items-end' : 'items-start'}`}
                    >
                      {/* Header */}
                      <div className={`flex items-center gap-2 mb-0.5 ${msg.isVTS ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[10px] font-bold text-white/80">{msg.sender}</span>
                        <div className={`flex items-center gap-1 px-1 py-0.5 rounded text-[9px] font-bold ${msg.isVTS ? 'bg-sky-600/40 text-sky-200' : 'bg-sky-900/40 text-sky-300'}`}>
                          <Radio size={9} className={msg.isVTS ? 'text-sky-300' : 'text-sky-400'} />
                          {msg.duration}
                        </div>
                        <span className="text-[9px] font-mono text-white/30">{msg.date} {msg.time}</span>
                        {msg.isVTS && (
                          <div className="w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center">
                            <User size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Bubble */}
                      <div className={`flex items-center gap-1.5 ${msg.isVTS ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`max-w-[90%] px-2 py-1 rounded-lg text-[11px] leading-tight relative ${
                          msg.isVTS 
                            ? 'bg-sky-500/10 text-sky-100 border border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.05)]' 
                            : 'bg-white/5 text-white/90 border border-white/10'
                        }`}>
                          {msg.content}
                        </div>
                        <button className="p-0.5 text-sky-500/40 hover:text-sky-400 transition-colors">
                          <Settings size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="space-y-3">
                    {/* Grouping logic for flow view by Session */}
                    {(() => {
                      const sessions: { id: string, intent: string, type: 'intent' | 'alert', turns: { sender: string, isVTS: boolean, messages: VHFMessage[] }[] }[] = [];
                      vhfMessages.filter(Boolean).forEach((msg) => {
                        let session = sessions.find(s => s.id === msg.sessionId);
                        if (!session) {
                          session = { 
                            id: msg.sessionId, 
                            intent: msg.sessionIntent || '未知意图', 
                            type: msg.sessionType || 'intent',
                            turns: [] 
                          };
                          sessions.push(session);
                        }
                        
                        const lastTurn = session.turns[session.turns.length - 1];
                        if (lastTurn && lastTurn.sender === msg.sender) {
                          lastTurn.messages.push(msg);
                        } else {
                          session.turns.push({ sender: msg.sender, isVTS: msg.isVTS, messages: [msg] });
                        }
                      });

                      return sessions.reverse().map((session, sIdx) => (
                        <motion.div 
                          key={session.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: sIdx * 0.1 }}
                          className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden shadow-lg"
                        >
                          {/* Session Header - Intent/Alert Based */}
                          <div className="bg-white/[0.03] px-3 py-2 border-b border-white/5 flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {session.type === 'alert' ? (
                                  <AlertTriangle size={12} className="text-red-400" />
                                ) : (
                                  <Ship size={12} className="text-white/40" />
                                )}
                              </div>
                              <div className="flex flex-col gap-1.5">
                                {/* First Line: Intent/Alert Label & Time */}
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5">
                                    <div className={`w-1 h-1 rounded-full ${session.type === 'alert' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]'}`} />
                                    <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${session.type === 'alert' ? 'text-red-400' : 'text-sky-400'}`}>
                                      {session.type === 'alert' ? '预警' : '意图'}: {session.intent}
                                    </span>
                                  </div>
                                  <div className="w-[1px] h-2 bg-white/10" />
                                  <span className="text-[8px] font-mono text-white/30">{session.turns[0].messages[0].time}</span>
                                </div>
                                
                                {/* Second Line: Ship Name & Vessel Details */}
                                <div className="flex items-center gap-3">
                                  <span className="text-[11px] font-bold text-white/90 tracking-tight">
                                    {(() => {
                                      const shipName = session.turns.find(t => t && !t.isVTS)?.sender || '未知船名';
                                      return shipName;
                                    })()}
                                  </span>
                                  <div className="w-[1px] h-2.5 bg-white/10" />
                                  <div className="flex items-center gap-2">
                                    {(() => {
                                      const shipName = session.turns.find(t => t && !t.isVTS)?.sender || '未知船名';
                                      const vesselInfo = INTENT_DATA.find(v => v.ship === shipName) || {
                                        shipType: '货船',
                                        length: '120m',
                                        width: '22m',
                                        speed: '10.5kn',
                                        current: '吴淞口'
                                      };
                                      return (
                                        <div className="flex items-center gap-1.5">
                                          <span className="px-1 py-0.5 bg-white/5 rounded text-[7px] font-bold text-white/40 uppercase">
                                            {vesselInfo.shipType}
                                          </span>
                                          <div className="flex items-center gap-1 text-[7px] font-mono text-white/30">
                                            <span className="bg-white/[0.03] px-1 rounded">{vesselInfo.length}×{vesselInfo.width}</span>
                                            <span className="bg-sky-500/10 text-sky-400/80 px-1 rounded">{vesselInfo.speed}</span>
                                            <span className="bg-emerald-500/10 text-emerald-400/80 px-1 rounded">{vesselInfo.current}</span>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  {/* Additional Alerts Badge if any */}
                                  {(() => {
                                    const shipName = session.turns.find(t => t && !t.isVTS)?.sender || '未知船名';
                                    const vesselAlerts = MOCK_ALERTS.filter(a => a.ship === shipName);
                                    if (vesselAlerts.length > 0 && session.type !== 'alert') {
                                      return (
                                        <div className="flex items-center gap-2">
                                          <div className="w-[1px] h-2 bg-white/10" />
                                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[7px] font-bold text-red-400 uppercase tracking-wider animate-pulse">
                                            <AlertTriangle size={8} className="shrink-0" />
                                            <span>风险</span>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="divide-y divide-white/[0.03] px-2 pt-1.5 pb-0 space-y-1">
                            {session.turns.map((turn, tIdx) => turn && (
                              <div 
                                key={tIdx} 
                                className={`flex flex-col border-0 pt-1 ${turn.isVTS ? 'items-end' : 'items-start'}`}
                              >
                                <div className={`flex flex-col gap-1 max-w-[85%] ${turn.isVTS ? 'items-end' : 'items-start'}`}>
                                  <div className="relative group">
                                    <div className={`px-2 py-1 rounded-lg text-[10px] leading-relaxed ${
                                      turn.isVTS 
                                        ? 'bg-sky-500/10 text-sky-100 border border-sky-500/20 rounded-tr-none' 
                                        : 'bg-white/5 text-white/80 border border-white/10 rounded-tl-none'
                                    }`}>
                                      {turn.messages.map(m => m.content).join('')}
                                    </div>
                                    <div className={`flex items-center gap-2 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${turn.isVTS ? 'justify-end' : 'justify-start'}`}>
                                      <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">
                                        累计时长: {turn.messages.reduce((acc, m) => acc + parseFloat(m.duration || '0'), 0).toFixed(2)}s
                                      </span>
                                      <Play size={8} className="text-sky-500/40" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'intent' && (
            <div className="p-4 flex flex-col h-full space-y-3">
              {/* 顶部操作与统计 */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">意图种类筛选</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-sky-500 animate-pulse" />
                      <span className="text-[7px] font-bold text-sky-500/60 uppercase">分类过滤</span>
                    </div>
                  </div>
                  <div className="relative">
                    <select
                      value={intentFilter}
                      onChange={(e) => setIntentFilter(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-[10px] font-bold text-white/80 focus:outline-none focus:border-sky-500/50 transition-all appearance-none cursor-pointer hover:bg-white/10"
                    >
                      {['全部', '起锚', '划江', '靠泊', '离泊', '抛锚', '穿越', '避让'].map(filter => (
                        <option key={filter} value={filter} className="bg-[#0a0a0a] text-white">
                          {filter === '全部' ? '全部意图种类' : filter}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                      <ChevronDown size={12} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* 意图识别列表 */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {intents
                    .filter(item => {
                      if (intentFilter === '全部') return true;
                      const activeAction = item.path.find(p => p.status === 'active')?.action || '';
                      return activeAction.includes(intentFilter);
                    })
                    .map((item, i) => (
                      <motion.div 
                        key={item.ship + i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        layout
                        onClick={() => {
                          if (editingIntentIndex !== i) {
                            setSelectedIntent(selectedIntent === i ? null : i);
                          }
                        }}
                        className={`bg-[#121212] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all cursor-pointer group relative ${
                          selectedIntent === i ? 'ring-1 ring-sky-500/30' : ''
                        }`}
                      >
                  {/* Header Section */}
                  <div className="p-2 bg-gradient-to-b from-white/[0.02] to-transparent">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center">
                          <Ship size={14} className="text-sky-400" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-[9px] font-bold text-white/40 truncate">{item.ship}</span>
                            <span className="text-[8px] px-1 bg-white/10 rounded uppercase tracking-wider shrink-0">{item.shipType}</span>
                            <div className="flex items-center gap-1 ml-auto">
                              <div className="w-1 h-1 rounded-full bg-sky-500 animate-pulse" />
                              <span className="text-[8px] font-bold text-sky-400 tracking-tighter">S:{item.speed}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-30">
                            <span className="text-[8px] tracking-tighter">L:{item.length}</span>
                            <span className="text-[8px] tracking-tighter">W:{item.width}</span>
                            <span className="text-[8px] tracking-tighter">D:{item.draft}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-black text-white">
                              {item.path.find(p => p.status === 'active')?.action || '正在执行'}
                            </span>
                            <span className="text-[9px] font-mono text-white/30">{item.occurrenceTime.split(' ')[1]}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded-full border border-white/5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/60">实时</span>
                      </div>
                    </div>


                    {/* Progress Bar Section */}
                    <div className="relative px-3 mb-2 mt-1">
                      <div className="absolute top-[5px] left-0 right-0 h-[1px] bg-white/10" />
                      <div 
                        className="absolute top-[5px] left-0 h-[1px] bg-sky-500 transition-all duration-1000" 
                        style={{ width: '50%' }} 
                      />
                      
                      <div className="flex justify-between relative z-10">
                        {/* Last */}
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-2.5 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500/40 border border-sky-500/60" />
                          </div>
                          <div className="text-center">
                            <div className="text-[9px] font-bold text-white/40 whitespace-nowrap">{item.past}</div>
                          </div>
                        </div>
                        {/* Current */}
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-2.5 flex items-center justify-center">
                            <div className="relative">
                              <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)] flex items-center justify-center">
                                <div className="w-1 h-1 bg-white rounded-full" />
                              </div>
                              <div className="absolute inset-0 bg-sky-400 blur-sm opacity-30 animate-pulse" />
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] font-black text-sky-400 whitespace-nowrap">{item.current}</div>
                          </div>
                        </div>
                        {/* Next */}
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-2.5 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/5 border border-white/10" />
                          </div>
                          <div className="text-center">
                            <div className="text-[9px] font-bold text-white/40 whitespace-nowrap">{item.destination}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Section */}
                  <AnimatePresence>
                    {selectedIntent === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/5"
                      >
                        <div className="p-1.5 space-y-1.5">
                          {item.timeline.map((event, idx) => (
                            <div key={idx} className="relative pl-3.5 group/item">
                              {/* Timeline Line */}
                              {idx !== item.timeline.length - 1 && (
                                <div className="absolute left-[1.5px] top-2.5 bottom-[-12px] w-[1px] bg-white/5" />
                              )}
                              
                              {/* Timeline Dot */}
                              <div className={`absolute left-0 top-1 w-1 h-1 rounded-full border transition-all duration-500 ${
                                event.status === 'active' ? 'bg-sky-500 border-sky-400 shadow-[0_0_4px_rgba(14,165,233,0.5)]' :
                                event.status === 'completed' ? 'bg-white/10 border-white/20' :
                                'bg-white/5 border-white/10'
                              }`} />

                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="text-[7px] font-mono text-white/30">{event.time}</span>
                                  <div className={`px-1 py-0.5 rounded text-[6px] font-black uppercase tracking-widest ${
                                    event.status === 'active' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                                    'bg-white/5 text-white/40 border border-white/5'
                                  }`}>
                                    {event.tag}
                                  </div>
                                </div>
                                <p className={`text-[8px] leading-relaxed transition-colors ${
                                  event.status === 'active' ? 'text-white/80' : 'text-white/40'
                                }`}>
                                  {event.content}
                                </p>
                              </div>
                            </div>
                          ))}

                          <div className="pt-2 border-t border-white/5 flex justify-center">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIntent(null);
                              }}
                              className="flex items-center gap-1 text-[7px] font-black uppercase tracking-[0.2em] text-sky-500/60 hover:text-sky-400 transition-colors"
                            >
                              收起详情 <ChevronDown size={6} className="rotate-180" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
                </AnimatePresence>
              </div>
            </div>
        )}

          {activeTab === 'warning' && (
            <div className="p-4 flex flex-col h-full space-y-3">
              {/* 顶部操作与统计 */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">实时预警统计</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[7px] font-bold text-emerald-500/60 uppercase">实时监控</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-md p-1 text-center">
                      <div className="text-sm font-bold text-red-500">{MOCK_ALERTS.filter(a => a.level === 'emergency').length}</div>
                      <div className="text-[6px] font-bold uppercase text-red-500/70">紧急</div>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-1 text-center">
                      <div className="text-sm font-bold text-orange-500">{MOCK_ALERTS.filter(a => a.level === 'alarm').length}</div>
                      <div className="text-[6px] font-bold uppercase text-orange-500/70">警报</div>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-1 text-center">
                      <div className="text-sm font-bold text-yellow-500">{MOCK_ALERTS.filter(a => a.level === 'warning').length}</div>
                      <div className="text-[6px] font-bold uppercase text-yellow-500/70">警告</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-1 text-center">
                      <div className="text-sm font-bold text-blue-500">{MOCK_ALERTS.filter(a => a.level === 'caution').length}</div>
                      <div className="text-[6px] font-bold uppercase text-blue-500/70">注意</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* 预警列表 */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {MOCK_ALERTS.map((alert, i) => (
                    <motion.div 
                      key={alert.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      layout
                      onClick={() => setSelectedAlert(selectedAlert === alert.id ? null : alert.id)}
                      className={`bg-[#121212] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all cursor-pointer group relative ${
                        selectedAlert === alert.id ? 'ring-1 ring-sky-500/30' :
                        alert.level === 'emergency' ? 'ring-1 ring-red-500/20' : 
                        alert.level === 'alarm' ? 'ring-1 ring-orange-500/20' : 
                        alert.level === 'warning' ? 'ring-1 ring-yellow-500/20' : ''
                      }`}
                    >
                    {/* Header Section */}
                    <div className="p-2 bg-gradient-to-b from-white/[0.02] to-transparent">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            alert.level === 'emergency' ? 'bg-red-500/20 text-red-400' : 
                            alert.level === 'alarm' ? 'bg-orange-500/20 text-orange-400' : 
                            alert.level === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {alert.level === 'emergency' ? <AlertCircle size={14} /> : 
                             alert.level === 'alarm' ? <AlertTriangle size={14} /> : 
                             alert.level === 'warning' ? <AlertTriangle size={14} /> : <Info size={14} />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <span className="text-[9px] font-bold text-white/40 truncate">{alert.ship}</span>
                              <span className="text-[8px] px-1 bg-white/10 rounded uppercase tracking-wider shrink-0">{alert.shipType}</span>
                              <div className="flex items-center gap-1 ml-auto">
                                <div className="w-1 h-1 rounded-full bg-sky-500 animate-pulse" />
                                <span className="text-[8px] font-bold text-sky-400 tracking-tighter">S:{alert.speed}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-30">
                              <span className="text-[8px] tracking-tighter">L:{alert.length}</span>
                              <span className="text-[8px] tracking-tighter">W:{alert.width}</span>
                              <span className="text-[8px] tracking-tighter">D:{alert.draft}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs font-black ${
                                alert.level === 'emergency' ? 'text-red-400' : 
                                alert.level === 'alarm' ? 'text-orange-400' : 
                                alert.level === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                              }`}>
                                {alert.type}
                              </span>
                              <span className="text-[9px] font-mono text-white/30">{alert.time}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${
                          alert.level === 'emergency' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                          alert.level === 'alarm' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 
                          alert.level === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        }`}>
                          <div className={`w-1 h-1 rounded-full animate-pulse ${
                            alert.level === 'emergency' ? 'bg-red-500' : 
                            alert.level === 'alarm' ? 'bg-orange-500' : 
                            alert.level === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`} />
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-80">
                            {alert.level === 'emergency' ? '紧急' : alert.level === 'alarm' ? '警报' : alert.level === 'warning' ? '警告' : '注意'}
                          </span>
                        </div>
                      </div>

                      {/* Alert Summary */}
                      <div className="px-1 mb-2">
                        <p className="text-[10px] text-white/60 leading-relaxed line-clamp-2">
                          {alert.summary}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-1.5 px-1 mt-2">
                        <button className="flex-1 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[9px] font-bold text-white/60 transition-colors">
                          定位船舶
                        </button>
                        <button className="flex-1 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[9px] font-bold text-white/60 transition-colors">
                          忽略预警
                        </button>
                      </div>
                    </div>

                    {/* Timeline Section */}
                    <AnimatePresence>
                      {selectedAlert === alert.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-white/5"
                        >
                          <div className="p-3 space-y-4">
                            {/* 风险详情数据 */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                <div className="text-[8px] text-white/30 font-bold uppercase tracking-widest mb-1">呼号 / MMSI</div>
                                <div className="text-[10px] font-mono text-sky-400">{alert.callsign} / {alert.mmsi}</div>
                              </div>
                              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                <div className="text-[8px] text-white/30 font-bold uppercase tracking-widest mb-1">风险指数</div>
                                <div className="text-[10px] font-bold text-red-400">{alert.riskScore}</div>
                              </div>
                              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                <div className="text-[8px] text-white/30 font-bold uppercase tracking-widest mb-1">船长 / 船宽</div>
                                <div className="text-[10px] text-white/80">{alert.length} / {alert.width}</div>
                              </div>
                              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                <div className="text-[8px] text-white/30 font-bold uppercase tracking-widest mb-1">吃水 / 船型</div>
                                <div className="text-[10px] text-white/80">{alert.draft} / {alert.shipType}</div>
                              </div>
                              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                <div className="text-[8px] text-white/30 font-bold uppercase tracking-widest mb-1">目的港</div>
                                <div className="text-[10px] text-white/80">{alert.destination}</div>
                              </div>
                              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                <div className="text-[8px] text-white/30 font-bold uppercase tracking-widest mb-1">货物类型</div>
                                <div className="text-[10px] text-white/80">{alert.cargo}</div>
                              </div>
                            </div>

                            <div className="h-px bg-white/5" />

                            <div className="space-y-1.5">
                              <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-2">预警时间轴</div>
                              {alert.timeline.map((event, idx) => (
                              <div key={idx} className="relative pl-3.5 group/item">
                                {/* Timeline Line */}
                                {idx !== alert.timeline.length - 1 && (
                                  <div className="absolute left-[1.5px] top-2.5 bottom-[-12px] w-[1px] bg-white/5" />
                                )}
                                
                                {/* Timeline Dot */}
                                <div className={`absolute left-0 top-1 w-1 h-1 rounded-full border transition-all duration-500 ${
                                  event.type === 'risk' ? 'bg-red-500 border-red-400 shadow-[0_0_4px_rgba(239,68,68,0.5)]' :
                                  event.type === 'warning' ? 'bg-orange-500 border-orange-400' :
                                  'bg-white/10 border-white/20'
                                }`} />

                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[7px] font-mono text-white/30">{event.time}</span>
                                    <div className={`px-1 py-0.5 rounded text-[6px] font-black uppercase tracking-widest ${
                                      event.type === 'risk' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                      event.type === 'warning' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                      'bg-white/5 text-white/40 border border-white/5'
                                    }`}>
                                      {event.type === 'risk' ? '风险触发' : event.type === 'warning' ? '异常检测' : '常规记录'}
                                    </div>
                                  </div>
                                  <p className={`text-[8px] leading-relaxed transition-colors ${
                                    event.type === 'risk' ? 'text-white/80' : 'text-white/40'
                                  }`}>
                                    {event.event}
                                  </p>
                                </div>
                              </div>
                            ))}
                            </div>

                            <div className="pt-2 border-t border-white/5 flex justify-center">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAlert(null);
                                }}
                                className="flex items-center gap-1 text-[7px] font-black uppercase tracking-[0.2em] text-sky-500/60 hover:text-sky-400 transition-colors"
                              >
                                收起详情 <ChevronDown size={6} className="rotate-180" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {activeTab === 'anchorage' && (
            <div className="p-3 flex flex-col h-full space-y-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">锚地资源监控</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-sky-500 animate-pulse" />
                    <span className="text-[7px] font-bold text-sky-500/60 uppercase">实时状态</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="bg-sky-500/10 border border-sky-500/20 rounded-md p-1 text-center">
                    <div className="text-sm font-bold text-sky-500">{MOCK_ANCHORAGES.length}</div>
                    <div className="text-[6px] font-bold uppercase text-sky-500/70">总锚地</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-md p-1 text-center">
                    <div className="text-sm font-bold text-red-500">
                      {MOCK_ANCHORAGES.filter(a => a.status === '拥挤').length}
                    </div>
                    <div className="text-[6px] font-bold uppercase text-red-500/70">拥挤</div>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-1 text-center">
                    <div className="text-sm font-bold text-orange-500">
                      {MOCK_ANCHORAGES.reduce((acc, curr) => acc + curr.expiringCount, 0)}
                    </div>
                    <div className="text-[6px] font-bold uppercase text-orange-500/70">即将到期</div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <div className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
                {MOCK_ANCHORAGES.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    onClick={() => setSelectedAnchorage(selectedAnchorage === item.id ? null : item.id)}
                    className={`bg-[#121212] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all cursor-pointer group ${
                      selectedAnchorage === item.id ? 'ring-1 ring-sky-500/30' : ''
                    }`}
                  >
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            item.status === '拥挤' ? 'bg-red-500/20' : 
                            item.status === '正常' ? 'bg-sky-500/20' : 'bg-emerald-500/20'
                          }`}>
                            <Anchor size={14} className={
                              item.status === '拥挤' ? 'text-red-400' : 
                              item.status === '正常' ? 'text-sky-400' : 'text-emerald-400'
                            } />
                          </div>
                          <div>
                            <div className="text-xs font-black text-white/90">{item.name}</div>
                            <div className="text-[8px] font-bold text-white/30 uppercase tracking-tighter">
                              容量: {item.capacity} | 已占: {item.occupied}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                            item.status === '拥挤' ? 'bg-red-500/20 text-red-400' : 
                            item.status === '正常' ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {item.status}
                          </div>
                          <ChevronRight size={10} className={`text-white/20 transition-transform duration-300 ${selectedAnchorage === item.id ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-end">
                          <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">拥挤程度</span>
                          <span className="text-[10px] font-mono font-bold text-white">
                            {Math.round((item.occupied / item.capacity) * 100)}%
                          </span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.occupied / item.capacity) * 100}%` }}
                            className={`h-full ${
                              item.status === '拥挤' ? 'bg-red-500' : 
                              item.status === '正常' ? 'bg-sky-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {selectedAnchorage === item.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/5 bg-white/[0.02] overflow-hidden"
                        >
                          <div className="p-2 space-y-2">
                            <div className="space-y-1.5">
                              <div className="text-[7px] font-bold text-white/30 uppercase tracking-widest">船舶类型统计</div>
                              <div className="grid grid-cols-1 gap-1">
                                {item.shipTypes.map((ship, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg p-1.5 border border-white/5">
                                    <div className="flex items-center gap-1.5">
                                      <Ship size={10} className="text-sky-400/60" />
                                      <span className="text-[9px] text-white/80">{ship.type}</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-sky-400">{ship.count} 艘</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {item.expiringCount > 0 && (
                              <div className="pt-2 border-t border-white/5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <Clock size={10} className="text-orange-400" />
                                    <span className="text-[9px] font-bold text-orange-400/80 uppercase tracking-widest">
                                      {item.expiringCount} 艘船舶锚泊即将到期
                                    </span>
                                  </div>
                                  <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                                    限时 48H
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  {item.expiringShips?.map((ship) => (
                                    <div key={ship.id} className="group/ship">
                                      <div 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedExpiringShip(selectedExpiringShip === ship.id ? null : ship.id);
                                        }}
                                        className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                                          selectedExpiringShip === ship.id ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-white/5 border border-white/5 hover:bg-white/10'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className={`w-6 h-6 rounded flex items-center justify-center ${
                                            selectedExpiringShip === ship.id ? 'bg-orange-500/20' : 'bg-white/5'
                                          }`}>
                                            <Ship size={12} className={selectedExpiringShip === ship.id ? 'text-orange-400' : 'text-white/40'} />
                                          </div>
                                          <div>
                                            <div className="text-[10px] font-black text-white/90">{ship.name}</div>
                                            <div className="text-[7px] font-mono text-white/30 uppercase tracking-tighter">到期: {ship.expiryTime}</div>
                                          </div>
                                        </div>
                                        <ChevronRight size={10} className={`text-white/20 transition-transform ${selectedExpiringShip === ship.id ? 'rotate-90 text-orange-400' : ''}`} />
                                      </div>

                                      <AnimatePresence>
                                        {selectedExpiringShip === ship.id && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="mt-1 p-2 bg-black/40 rounded-lg border border-white/5 grid grid-cols-2 gap-2">
                                              <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-[7px] text-white/30 uppercase">MMSI</span>
                                                  <span className="text-[8px] font-mono text-white/70">{ship.mmsi}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                  <span className="text-[7px] text-white/30 uppercase">船型</span>
                                                  <span className="text-[8px] text-white/70">{ship.type}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                  <span className="text-[7px] text-white/30 uppercase">长/宽</span>
                                                  <span className="text-[8px] text-white/70">{ship.details.length}m / {ship.details.width}m</span>
                                                </div>
                                              </div>
                                              <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-[7px] text-white/30 uppercase">吃水</span>
                                                  <span className="text-[8px] text-white/70">{ship.details.draft}m</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                  <span className="text-[7px] text-white/30 uppercase">货物</span>
                                                  <span className="text-[8px] text-white/70">{ship.details.cargo}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                  <span className="text-[7px] text-white/30 uppercase">代理</span>
                                                  <span className="text-[8px] text-white/70">{ship.details.agent}</span>
                                                </div>
                                              </div>
                                              <div className="col-span-2 pt-1 border-t border-white/5 flex justify-between items-center">
                                                <div className="flex items-center gap-1">
                                                  <MapPin size={8} className="text-white/30" />
                                                  <span className="text-[7px] text-white/30 uppercase">目的地:</span>
                                                  <span className="text-[8px] text-sky-400 font-bold">{ship.details.destination}</span>
                                                </div>
                                                <button className="px-2 py-0.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-[6px] font-black uppercase tracking-widest rounded transition-colors">
                                                  发送提醒
                                                </button>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="pt-1 flex justify-center">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAnchorage(null);
                                }}
                                className="flex items-center gap-1 text-[7px] font-black uppercase tracking-[0.2em] text-sky-500/60 hover:text-sky-400 transition-colors"
                              >
                                收起详情 <ChevronDown size={6} className="rotate-180" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </SidebarPanel>

        {/* 中间：海图容器 */}
        <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden">
          <MapContainer 
            center={(() => {
              const saved = localStorage.getItem('vts-map-center');
              return saved ? JSON.parse(saved) : [31.425, 121.565];
            })()} 
            zoom={(() => {
              const saved = localStorage.getItem('vts-map-zoom');
              return saved ? parseInt(saved, 10) : 13;
            })()} 
            className="h-full w-full"
            zoomControl={false}
          >
            <MapStatePersister />
            <MousePositionTracker onMouseMove={setMouseCoords} />
            <PlaybackMapController playbackData={playbackData} />
            {/* ESRI 卫星图层 */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
            
            {/* ESRI 边界与标注叠加层 - 确保在卫星图上能看到地名 */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri'
            />

            {/* OpenSeaMap 叠加层 (航标、灯塔、航道) */}
            <TileLayer
              url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors'
            />

            {/* 冲突船舶与 CPA 锥形区域 (参考图片) */}
            <CircleMarker
              center={[31.43, 121.58]}
              radius={8}
              pathOptions={{
                fillColor: '#ef4444',
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 1
              }}
            />
            <Polygon 
              positions={[
                [31.43, 121.58],
                [31.44, 121.59],
                [31.42, 121.60]
              ]}
              pathOptions={{
                fillColor: '#ef4444',
                color: '#ef4444',
                weight: 1,
                opacity: 0.3,
                fillOpacity: 0.4
              }}
            />

            {/* 申请船舶与 路径规划 (参考图片) */}
            <CircleMarker
              center={[31.41, 121.55]}
              radius={6}
              pathOptions={{
                fillColor: '#0ea5e9',
                color: '#ffffff',
                weight: 1.5,
                opacity: 1,
                fillOpacity: 1
              }}
            />
            <Polyline 
              positions={[
                [31.41, 121.55],
                [31.42, 121.54],
                [31.43, 121.53]
              ]}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                dashArray: '5, 10',
                opacity: 0.6
              }}
            />

            {/* 船舶标记 */}
            {SHIP_POSITIONS.map((ship) => (
              <CircleMarker
                key={ship.id}
                center={[ship.lat, ship.lng]}
                radius={ship.status === 'warning' ? 6 : 4}
                pathOptions={{
                  fillColor: ship.status === 'warning' ? '#ef4444' : '#22c55e',
                  color: ship.status === 'warning' ? '#ef4444' : '#22c55e',
                  weight: 1,
                  opacity: 1,
                  fillOpacity: 0.8
                }}
              />
            ))}
          </MapContainer>

          {/* 地图控制叠加层 */}
          <div className="absolute top-4 left-4 flex flex-col gap-4 z-[1500]">
            {/* 这里可以放置地图控制按钮 */}
          </div>
        </div>
      </main>

      {/* --- 底部状态栏 --- */}
      <AnimatePresence>
        {showBars && (
          <motion.footer 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 40, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 bg-[#0a0a0a] flex items-center justify-between px-4 z-[3000] shrink-0"
          >
            <div className="flex-1" />

            <div className="flex items-center gap-8 relative">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">比例尺</span>
                <div className="w-16 h-1 bg-white/10 relative rounded-full overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-white/30" />
                </div>
                <span className="text-[10px] font-mono text-white/50">2.5 NM</span>
              </div>

              {/* 实时经纬度显示 */}
              <div className="flex items-center gap-4 border-l border-white/5 pl-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">经度</span>
                  <span className="text-[10px] font-mono text-sky-400 w-[80px]">
                    {mouseCoords ? mouseCoords.lng.toFixed(6) : '---.------'}°E
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">纬度</span>
                  <span className="text-[10px] font-mono text-sky-400 w-[80px]">
                    {mouseCoords ? mouseCoords.lat.toFixed(6) : '--.------'}°N
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 border-l border-white/5 pl-4">
                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">数据同步: 0.2s</span>
              </div>

              <AnimatePresence>
                {isControlPanelExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full right-0 mb-2 w-64 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl z-[5000]"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white/70">面板位置 (左/右)</span>
                        <button 
                          onClick={() => setSidebarPosition(sidebarPosition === 'left' ? 'right' : 'left')}
                          className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 hover:bg-white/10 transition-all"
                        >
                          <span className={`text-[10px] font-bold ${sidebarPosition === 'left' ? 'text-sky-400' : 'text-white/30'}`}>左</span>
                          <div className="w-px h-2 bg-white/10" />
                          <span className={`text-[10px] font-bold ${sidebarPosition === 'right' ? 'text-sky-400' : 'text-white/30'}`}>右</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={() => setIsControlPanelExpanded(!isControlPanelExpanded)}
                className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${isControlPanelExpanded ? 'text-sky-500' : 'text-white/40 hover:text-white'}`}
              >
                展开控制面板 <ChevronRight size={12} className={`transition-transform duration-300 ${isControlPanelExpanded ? 'rotate-[90deg]' : 'rotate-[-90deg]'}`} />
              </button>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* 全局滚动条样式 */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />

      {/* 辖区船舶分布 - 浮动面板 */}
      <AnimatePresence>
      </AnimatePresence>

      {/* 锚地态势 - 浮动面板 */}
      <AnimatePresence>
      </AnimatePresence>
    </div>
  );
}
