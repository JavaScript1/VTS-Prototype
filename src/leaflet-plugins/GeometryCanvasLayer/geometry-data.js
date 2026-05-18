// geometry-data.js
import loongship from 'loongship-web';

export default class GeometryDataManager {
    constructor() {
        this._geometries = new Map();
        this._idCounter = 0;
    }

    _generateId() {
        this._idCounter++;
        return `geo_${Date.now().toString(36)}_${this._idCounter}`;
    }

    addGeometry(data) {
        if (!data) return null;

        const id = data.id || this._generateId();

        const points = (data.latLngs || []).map(p => {
            return Array.isArray(p) ? loongship.latLng(p[0], p[1]) : loongship.latLng(p.lat, p.lng);
        });

        this._geometries.set(id, {
            ...data,
            id: id,
            _latLngs: points,
            _screenPoints: null,
            _path2d: null
        });

        return id;
    }

    updateGeometry(id, partialData) {
        if (!id || !this._geometries.has(id)) {
            return false;
        }

        const existing = this._geometries.get(id);

        let newLatLngs = existing._latLngs;
        let newScreenPoints = existing._screenPoints;
        let newPath2d = existing._path2d;

        // 如果经纬度改变，才清空缓存
        if (partialData.latLngs) {
            newLatLngs = partialData.latLngs.map(p => {
                return Array.isArray(p) ? loongship.latLng(p[0], p[1]) : loongship.latLng(p.lat, p.lng);
            });
            newScreenPoints = null;
            newPath2d = null;
        }

        const mergedStyle = partialData.style
            ? { ...existing.style, ...partialData.style }
            : existing.style;

        this._geometries.set(id, {
            ...existing,
            ...partialData,
            id: id,
            style: mergedStyle,
            _latLngs: newLatLngs,
            _screenPoints: newScreenPoints,
            _path2d: newPath2d
        });

        return true;
    }

    removeGeometry(id) {
        if (this._geometries.has(id)) {
            this._geometries.delete(id);
            return true;
        }
        return false;
    }

    clear() {
        this._geometries.clear();
    }

    getGeometries() {
        return this._geometries;
    }

    /**
     * 地图拖拽/缩放结束时触发
     * 抛弃所有复杂的视野判断逻辑，直接全量算坐标，全量刻印章！
     */
    updateScreenPoints(map) {
        if (!map) return;

        this._geometries.forEach(geo => {
            // 直接将经纬度转换为屏幕像素
            geo._screenPoints = geo._latLngs.map(latLng => map.latLngToContainerPoint(latLng));

            // 直接生成 Path2D 印章
            const path = new Path2D();
            if (geo._screenPoints.length > 0) {
                path.moveTo(geo._screenPoints[0].x, geo._screenPoints[0].y);
                for (let i = 1; i < geo._screenPoints.length; i++) {
                    path.lineTo(geo._screenPoints[i].x, geo._screenPoints[i].y);
                }
                if (geo.type === 'polygon') {
                    path.closePath();
                }
            }
            geo._path2d = path;
        });
    }
}