// overlay.js
import loongship from 'loongship-web';

export default class OverlayManager {
    constructor(layer) {
        this._layer = layer;
        this._map = null;
        this._overlays = {};
        this._overlayMarkers = new Map();
    }

    init(overlaysConfig, map) {
        this._overlays = overlaysConfig || {};
        this._map = map;
        this._createAllOverlayMarkers();
    }

    _createAllOverlayMarkers() {
        const overlayKeys = Object.keys(this._overlays);
        if (!this._map || overlayKeys.length === 0) return;

        const ships = this._layer._getShips();
        ships.forEach(ship => {
            overlayKeys.forEach((overlayKey) => {
                const config = this._overlays[overlayKey];
                if (ship[overlayKey]) {
                    this._createSingleOverlayMarker(ship, overlayKey, config);
                }
            });
        });
    }

    _createSingleOverlayMarker(ship, overlayKey, config) {
        // 🌟 优先使用数据层的经纬度缓存
        const latLng = ship._latLng || loongship.latLng(ship.lat, ship.lng);

        const overlayIcon = loongship.icon(config);

        const marker = loongship.marker(latLng, {
            icon: overlayIcon,
        }).addTo(this._map);

        const markerEl = marker.getElement();
        if (markerEl) {
            markerEl.style.pointerEvents = 'none';
        }

        if (!this._overlayMarkers.has(ship.mmsi)) {
            this._overlayMarkers.set(ship.mmsi, new Map());
        }
        this._overlayMarkers.get(ship.mmsi).set(overlayKey, marker);
    }

    clearOverlay() {
        if (!this._map) return;

        this._overlayMarkers.forEach((markerMap) => {
            markerMap.forEach((marker) => {
                this._map.removeLayer(marker);
            });
        });
        this._overlayMarkers.clear();
    }

    updateOverlay() {
        const overlayKeys = Object.keys(this._overlays);
        if (!this._map || overlayKeys.length === 0) return;

        const ships = this._layer._getShips();
        // 🌟 将这句配置读取提取到 O(n) 循环的外面！
        const overlayConfig = this._layer._getOverlayConfig();

        ships.forEach(ship => {
            const mmsi = ship?.mmsi;
            overlayKeys.forEach(overlayKey => {
                const isUpdate = ship[overlayKey];
                if (!isUpdate) {
                    this.clearOverlayByMmsiAndKey(mmsi, overlayKey);
                } else {
                    const markerMap = this._overlayMarkers.get(mmsi);
                    if (!markerMap || markerMap.size === 0 || !markerMap.has(overlayKey)) {
                        // 使用提出来的 overlayConfig
                        this._createSingleOverlayMarker(ship, overlayKey, overlayConfig[overlayKey]);
                    }
                    else {
                        // 🌟 极速更新：直接使用 ship._latLng
                        const latLng = ship._latLng || loongship.latLng(ship.lat, ship.lng);
                        const marker = markerMap.get(overlayKey);
                        marker.setLatLng(latLng);
                    }
                }
            })
        });
    }

    clearOverlayByMmsiAndKey(mmsi, overlayKey) {
        const markerMap = this._overlayMarkers.get(mmsi);
        if (!markerMap || !markerMap.has(overlayKey)) return;

        const marker = markerMap.get(overlayKey);
        this._map.removeLayer(marker);
        markerMap.delete(overlayKey);

        if (markerMap.size === 0) {
            this._overlayMarkers.delete(mmsi);
        }
    }

    removeOverlaysByMmsiList(mmsiList) {
        if (!this._map || !Array.isArray(mmsiList)) return;

        mmsiList.forEach(mmsi => {
            const markerMap = this._overlayMarkers.get(mmsi);
            if (markerMap) {
                // 移除这艘船绑定的所有 DOM 覆盖物
                markerMap.forEach(marker => {
                    this._map.removeLayer(marker);
                });
                // 从缓存字典中彻底抹除
                this._overlayMarkers.delete(mmsi);
            }
        });
    }
}