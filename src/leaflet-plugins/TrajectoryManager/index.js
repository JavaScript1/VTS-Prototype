// TrajectoryManager.js
import loongship from 'loongship-web'; // 如果使用原生 Leaflet 请替换为 import L from 'leaflet'

class TrajectoryManager {
    /**
     * @param {Object} mapInstance - 地图实例
     * @param {Object} globalOptions - 全局动效配置
     */
    constructor(mapInstance, globalOptions = {}) {
        this.map = mapInstance;
        // 核心管理器：Map<id, trackData>
        this.tracks = new Map();

        // 生成实例唯一 ID，防止页面有多个管家时 CSS 动画互相污染
        this.instanceId = Math.random().toString(36).substring(2, 9);
        this.flowClassName = `trajectory-flow-line-${this.instanceId}`;

        // 默认动效与样式配置
        this.config = {
            baseColor: 'rgba(24, 144, 255, 0.4)', // 底层实线颜色（半透明）
            baseWeight: 6,                        // 底层实线宽度
            flowColor: '#ffffff',                 // 顶层流光线颜色
            flowWeight: 2,                        // 顶层流光线宽度

            flowDuration: 1.5,                    // 流动动画跑完一个周期的时间(秒)，数值越小跑得越快
            flowDashArray: '5, 15',               // 流光虚线的 [实线长度, 空白长度]

            showPoints: true,                     // 是否开启交互圆点
            pointRadius: 3,                       // 圆点半径
            pointColor: '#1890ff',                // 圆点边框色
            pointFill: '#ffffff',                 // 圆点填充色

            // 像素级 LOD 抽稀控制
            pointMinSpacing: 40,                  // 屏幕上任意两个交互点，至少间隔 40px

            maxPoints: 2000,                      // 内存保护：单条轨迹最大点数

            tooltipFormatter: null,               // 外部自定义气泡 HTML 内容的格式化函数

            ...globalOptions
        };

        // 注入依赖的动态 CSS 样式
        this._injectFlowCSS();
        this._injectTooltipCSS();

        // 绑定地图缩放事件，触发 LOD 重新计算
        this._onZoomEnd = this._updateAllPointsLOD.bind(this);
        this.map.on('zoomend', this._onZoomEnd);
    }

    // ==========================================
    // 样式注入
    // ==========================================

    _injectFlowCSS() {
        const styleId = `trajectory-flow-style-${this.instanceId}`;
        if (document.getElementById(styleId)) return;

        const dashSum = this.config.flowDashArray.split(',').reduce((a, b) => parseFloat(a) + parseFloat(b), 0);

        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .${this.flowClassName} {
                animation: flow-anim-${this.instanceId} ${this.config.flowDuration}s linear infinite;
                will-change: stroke-dashoffset; 
            }
            @keyframes flow-anim-${this.instanceId} {
                from { stroke-dashoffset: ${dashSum}; } 
                to { stroke-dashoffset: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    _injectTooltipCSS() {
        if (document.getElementById('trajectory-tooltip-style')) return;
        const style = document.createElement('style');
        style.id = 'trajectory-tooltip-style';
        style.innerHTML = `
            /* 气泡主体样式 */
            .track-point-tooltip {
                background: rgba(0, 0, 0, 0.75);
                border: 1px solid rgba(255,255,255,0.2);
                color: #fff;
                border-radius: 4px;
                padding: 8px 12px;
                font-size: 13px;
                line-height: 1.6;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                pointer-events: none;
                backdrop-filter: blur(2px);
            }
            
            /* 👇 核心修改：恢复下方的指示三角，并把颜色改成和背景相同的半透明黑 */
            .leaflet-tooltip-top.track-point-tooltip::before {
                border-top-color: rgba(0, 0, 0, 0.75);
            }
        `;
        document.head.appendChild(style);
    }

    // ==========================================
    // 业务对外 API
    // ==========================================

    /**
     * 1. 判断是否存在指定 ID 的轨迹
     * @param {string|number} id - 轨迹标识
     * @returns {boolean}
     */
    hasTrack(id) {
        return this.tracks.has(id);
    }

    /**
     * 2. 初始化单条轨迹
     * @param {string|number} id - 轨迹唯一标识 (如 MMSI)
     * @param {Array} points - 初始业务数据数组
     */
    setTrack(id, points = []) {
        this.clearTrack(id);
        if (!points) points = [];

        const latLngs = points.map(p => loongship.latLng(p.lat, p.lng));

        const baseLine = loongship.polyline(latLngs, {
            color: this.config.baseColor,
            weight: this.config.baseWeight,
            interactive: false,
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(this.map);

        const flowLine = loongship.polyline(latLngs, {
            color: this.config.flowColor,
            weight: this.config.flowWeight,
            interactive: false,
            dashArray: this.config.flowDashArray,
            className: this.flowClassName
        }).addTo(this.map);

        const pointGroup = loongship.layerGroup().addTo(this.map);

        const trackData = {
            baseLine,
            flowLine,
            pointGroup,
            pointMarkers: [],
            latLngs,
            rawData: [...points] // 缓存完整的原始业务数据
        };

        this.tracks.set(id, trackData);

        if (this.config.showPoints && points.length > 0) {
            points.forEach(pointData => {
                this._createPointMarker(trackData, pointData);
            });
            this._updateTrackPointsLOD(trackData);
        }
    }

    /**
     * 3. 动态追加点位（内置 FIFO 队列管理）
     * @param {string|number} id - 轨迹标识
     * @param {Object} pointData - 完整的业务对象(lat, lng, sog, timestamp...)
     */
    appendPoint(id, pointData) {
        let track = this.tracks.get(id);

        if (!track) {
            this.setTrack(id, []);
            track = this.tracks.get(id);
        }

        const newPoint = loongship.latLng(pointData.lat, pointData.lng);

        track.latLngs.push(newPoint);
        track.rawData.push(pointData); // 业务数据入队

        track.baseLine.setLatLngs(track.latLngs);
        track.flowLine.setLatLngs(track.latLngs);

        if (this.config.showPoints) {
            this._createPointMarker(track, pointData);
        }

        if (track.latLngs.length > this.config.maxPoints) {
            track.latLngs.shift();
            track.rawData.shift(); // 业务数据出队

            track.baseLine.setLatLngs(track.latLngs);
            track.flowLine.setLatLngs(track.latLngs);

            if (this.config.showPoints && track.pointMarkers.length > 0) {
                const oldestMarker = track.pointMarkers.shift();
                track.pointGroup.removeLayer(oldestMarker);
            }
        }

        if (this.config.showPoints) {
            this._updateTrackPointsLOD(track);
        }
    }

    /**
     * 4. 清空单条轨迹
     */
    clearTrack(id) {
        const track = this.tracks.get(id);
        if (track) {
            this.map.removeLayer(track.baseLine);
            this.map.removeLayer(track.flowLine);
            this.map.removeLayer(track.pointGroup);
            this.tracks.delete(id);
        }
    }

    /**
     * 5. 清空所有轨迹
     */
    clearAll() {
        this.tracks.forEach((_, id) => this.clearTrack(id));
    }

    /**
     * 6. 销毁管理器
     */
    destroy() {
        if (this.map) {
            this.map.off('zoomend', this._onZoomEnd);
        }

        const styleEl = document.getElementById(`trajectory-flow-style-${this.instanceId}`);
        if (styleEl && styleEl.parentNode) {
            styleEl.parentNode.removeChild(styleEl);
        }

        this.clearAll();
    }

    // ==========================================
    // 数据获取 API
    // ==========================================

    /**
     * 获取指定船舶的完整轨迹数据（包含业务字段）
     */
    getTrackData(id) {
        const track = this.tracks.get(id);
        return track ? track.rawData : [];
    }

    /**
     * 仅获取指定船舶的经纬度坐标点集合
     */
    getTrackLatLngs(id) {
        const track = this.tracks.get(id);
        if (!track) return [];
        return track.latLngs.map(ll => ({ lat: ll.lat, lng: ll.lng }));
    }

    /**
     * 获取当前地图上正在绘制的所有船舶 ID 列表
     */
    getActiveTrackIds() {
        return Array.from(this.tracks.keys());
    }

    // ==========================================
    // 内部私有方法
    // ==========================================

    _updateAllPointsLOD() {
        if (!this.config.showPoints) return;
        this.tracks.forEach(track => {
            this._updateTrackPointsLOD(track);
        });
    }

    /**
     * 像素级 LOD 距离抽稀算法
     */
    _updateTrackPointsLOD(track) {
        if (!track || track.pointMarkers.length === 0) return;

        const minDistSq = this.config.pointMinSpacing * this.config.pointMinSpacing;
        const lastIdx = track.pointMarkers.length - 1;

        let lastVisibleLayerPoint = null;

        track.pointMarkers.forEach((marker, idx) => {
            const isLast = (idx === lastIdx);
            let shouldShow = false;

            const currentLayerPoint = this.map.latLngToLayerPoint(marker.getLatLng());

            if (idx === 0) {
                shouldShow = true;
                lastVisibleLayerPoint = currentLayerPoint;
            } else {
                const dx = currentLayerPoint.x - lastVisibleLayerPoint.x;
                const dy = currentLayerPoint.y - lastVisibleLayerPoint.y;

                if ((dx * dx + dy * dy) >= minDistSq) {
                    shouldShow = true;
                    lastVisibleLayerPoint = currentLayerPoint;
                }
            }

            if (isLast) {
                shouldShow = true;
            }

            if (shouldShow) {
                if (!track.pointGroup.hasLayer(marker)) {
                    track.pointGroup.addLayer(marker);
                }
            } else {
                if (track.pointGroup.hasLayer(marker)) {
                    track.pointGroup.removeLayer(marker);
                }
            }
        });
    }

    _createPointMarker(trackData, pointData) {
        const latLng = loongship.latLng(pointData.lat, pointData.lng);

        const marker = loongship.circleMarker(latLng, {
            radius: this.config.pointRadius,
            color: this.config.pointColor,
            weight: 2,
            fillColor: this.config.pointFill,
            fillOpacity: 1,
            interactive: true
        });

        let tooltipContent = '';
        if (typeof this.config.tooltipFormatter === 'function') {
            tooltipContent = this.config.tooltipFormatter(pointData);
        } else {
            const sog = pointData.sog !== undefined ? `${pointData.sog} 节` : '--';
            const cog = pointData.cog !== undefined ? `${pointData.cog}°` : '--';

            let timeStr = '--';
            if (pointData.timestamp) {
                const date = new Date(pointData.timestamp);
                timeStr = date.toTimeString().split(' ')[0];
            }

            tooltipContent = `
                <div>
                    <div>航速：${sog}</div>
                </div>
            `;
        }

        marker.bindTooltip(tooltipContent, {
            direction: 'top',
            offset: [0, -this.config.pointRadius],
            className: 'track-point-tooltip',
            opacity: 1
        });

        marker.on('mouseover', function () {
            this.setRadius(6);
        });
        marker.on('mouseout', () => {
            marker.setRadius(this.config.pointRadius);
        });

        trackData.pointMarkers.push(marker);
    }
}

loongship.trajectoryManager = function (mapView, options = {}) {
    return new TrajectoryManager(mapView, options);
};

export default TrajectoryManager;