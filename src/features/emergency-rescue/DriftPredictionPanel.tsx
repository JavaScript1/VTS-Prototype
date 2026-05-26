/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 漂移预测面板
 * 对应需求文档 3.2: 漂移预测模型
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Navigation, Wind, Waves, Clock, AlertTriangle, 
  Activity, Target, TrendingDown
} from 'lucide-react';
import { MOCK_DRIFT_PREDICTION, type DriftPrediction } from './emergencyData';

export default function DriftPredictionPanel() {
  const [prediction] = useState<DriftPrediction>(MOCK_DRIFT_PREDICTION);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentTimeIndex(prev => {
        if (prev >= prediction.predictedPath.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [isPlaying, prediction.predictedPath.length]);

  const currentPoint = prediction.predictedPath[currentTimeIndex];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
            <Navigation size={16} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            AI漂移预测模型
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 text-[10px] font-black text-rose-600 border border-rose-100">
          <Activity size={10} className="animate-pulse" />
          {prediction.modelType === 'hybrid' ? '混合模型' : prediction.modelType === 'monte_carlo' ? '蒙特卡洛' : 'Leeway'}
        </div>
      </div>

      {/* 船舶信息 */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-black">{prediction.vesselName}</div>
            <div className="text-[10px] font-bold text-slate-400">主机故障 · 失控漂流中</div>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-[10px] font-black border border-rose-500/30">
            DISTRESS
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-[9px] font-bold text-slate-500">吃水</div>
            <div className="text-xs font-black text-white">{prediction.vesselDraft}m</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-bold text-slate-500">排水量</div>
            <div className="text-xs font-black text-white">{(prediction.vesselDisplacement / 1000).toFixed(0)}k吨</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-bold text-slate-500">漂移速度</div>
            <div className="text-xs font-black text-amber-400">{currentPoint.speed} kn</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-bold text-slate-500">漂移方向</div>
            <div className="text-xs font-black text-amber-400">{currentPoint.heading}°</div>
          </div>
        </div>
      </div>

      {/* 环境参数 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-sky-50 border border-sky-100 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Wind size={14} className="text-sky-500" />
            <span className="text-[10px] font-black text-sky-700">风场</span>
          </div>
          <div className="text-lg font-black text-sky-600">{prediction.windSpeed} m/s</div>
          <div className="text-[9px] font-bold text-sky-500">方向 {prediction.windDirection}° (NE)</div>
        </div>
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Waves size={14} className="text-blue-500" />
            <span className="text-[10px] font-black text-blue-700">流场</span>
          </div>
          <div className="text-lg font-black text-blue-600">{prediction.currentSpeed} kn</div>
          <div className="text-[9px] font-bold text-blue-500">方向 {prediction.currentDirection}° (S)</div>
        </div>
      </div>

      {/* 预测时间轴 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
            <Clock size={10} />
            预测轨迹时间轴
          </div>
          <button
            onClick={() => { setIsPlaying(!isPlaying); if (currentTimeIndex >= prediction.predictedPath.length - 1) setCurrentTimeIndex(0); }}
            className="text-[9px] font-black text-indigo-600 hover:text-indigo-800"
          >
            {isPlaying ? '暂停' : '播放'}
          </button>
        </div>

        {/* 进度条 */}
        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full"
            animate={{ width: `${(currentTimeIndex / (prediction.predictedPath.length - 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* 时间点列表 */}
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {prediction.predictedPath.map((point, i) => (
            <motion.div
              key={i}
              onClick={() => setCurrentTimeIndex(i)}
              className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all ${
                i === currentTimeIndex ? 'bg-indigo-50 border border-indigo-200 shadow-sm' :
                i < currentTimeIndex ? 'bg-slate-50 border border-slate-100' : 'bg-white border border-slate-100 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  i === currentTimeIndex ? 'bg-indigo-500 animate-pulse' :
                  i < currentTimeIndex ? 'bg-slate-400' : 'bg-slate-200'
                }`} />
                <span className="text-[10px] font-black text-slate-700">T+{point.time}min</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-slate-500">{point.speed}kn / {point.heading}°</span>
                <div className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                  point.confidence > 80 ? 'bg-emerald-50 text-emerald-600' :
                  point.confidence > 60 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {point.confidence}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 不确定性区域 */}
      <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Target size={12} className="text-amber-600" />
          <span className="text-[10px] font-black text-amber-700">PoD概率分布区域</span>
        </div>
        <div className="text-[9px] font-bold text-amber-600 leading-relaxed">
          当前不确定性半径: {prediction.uncertaintyRadius[currentTimeIndex].toFixed(2)} nm
          <br />
          T+120min最大扩散范围: {prediction.uncertaintyRadius[prediction.uncertaintyRadius.length - 1]} nm
        </div>
      </div>

      {/* 更新时间 */}
      <div className="text-[9px] font-bold text-slate-400 text-right">
        模型最后更新: {prediction.lastUpdated}
      </div>
    </div>
  );
}
