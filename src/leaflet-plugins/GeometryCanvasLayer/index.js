// index-geometry.js
import loongship from 'loongship-web';
import CanvasManager from './canvas-manager.js';
import GeometryAnimationManager from './geometry-animation.js';
import GeometryDataManager from './geometry-data.js';
import GeometryDrawer from './geometry-drawer.js';

class GeometryCanvasLayer extends loongship.Layer {
    constructor(options = {}) {
        super();
        this._config = options;
        this._dataManager = new GeometryDataManager();
        this._drawer = new GeometryDrawer();

        this._map = null;
        this._canvasManager = null;
        this._animationManager = null;

        this._handleResize = this._handleResize.bind(this);
        this._handleMove = this._handleMove.bind(this); // 🌟 新增实时拖拽和旋转的监听函数
        this._handleMoveEnd = this._handleMoveEnd.bind(this);
    }

    onAdd(map) {
        this._map = map;
        this._canvasManager = new CanvasManager(map);

        const dynamicCanvas = this._canvasManager.getDynamicCanvas();
        if (dynamicCanvas) {
            dynamicCanvas.style.pointerEvents = 'none';
        }
        this._animationManager = new GeometryAnimationManager(this._config);

        this._animationManager.start((state) => {
            this._renderFrame(state);
        }, this._dataManager);

        this._map.on('resize', this._handleResize);
        // 🌟 修复3：补齐拖拽和旋转实时监听
        this._map.on('move', this._handleMove);
        this._map.on('rotate', this._handleMove);
        this._map.on('moveend', this._handleMoveEnd);
        this._map.on('zoomend', this._handleMoveEnd);
    }

    onRemove() {
        this._map.off('resize', this._handleResize);
        this._map.off('move', this._handleMove);
        this._map.off('rotate', this._handleMove);
        this._map.off('moveend', this._handleMoveEnd);
        this._map.off('zoomend', this._handleMoveEnd);

        this._animationManager.stop();
        this._canvasManager.destroy();
        this._dataManager.clear();
    }

    _handleResize() {
        this._canvasManager.resize();
        this._animationManager.setDirty();
    }

    _handleMove() {
        // 拖拽和旋转中，疯狂触发脏值检测
        this._animationManager.setDirty();
    }

    _handleMoveEnd() {
        this._animationManager.setDirty();
    }

    _renderFrame(state) {
        const { isDirty, time } = state;
        const staticCtx = this._canvasManager.getStaticCtx();
        const dynamicCtx = this._canvasManager.getDynamicCtx();
        if (!staticCtx || !dynamicCtx) return;

        const geometries = this._dataManager.getGeometries();
        const globalFreq = this._animationManager.getGlobalFrequency();

        // 1. 如果视角改变，重算印章，并重绘静态层
        if (isDirty) {
            // 🌟 修复4：必须将 updateTransform 放在绘制之前，确保每一帧画布对齐屏幕！
            this._canvasManager.updateTransform();

            this._canvasManager.clearStatic();
            this._dataManager.updateScreenPoints(this._map);

            geometries.forEach(geo => {
                if (!geo._path2d || geo.isBlink) return;

                if (geo.type === 'polygon') {
                    this._drawer.drawPolygon(staticCtx, geo);
                } else if (geo.type === 'polyline') {
                    this._drawer.drawPolyline(staticCtx, geo);
                }
            });
        }

        // 2. 动态层：每一帧都独立计算每个图形的 Alpha
        this._canvasManager.clearDynamic();

        geometries.forEach(geo => {
            if (!geo._path2d || !geo.isBlink) return;

            const freq = geo.frequency ?? globalFreq;
            const pulseAlpha = 0.5 + Math.sin(time * 0.001 * Math.PI * 2 * freq) * 0.3;

            if (geo.type === 'polygon') {
                this._drawer.drawPolygon(dynamicCtx, geo, pulseAlpha);
            } else if (geo.type === 'polyline') {
                this._drawer.drawPolyline(dynamicCtx, geo, pulseAlpha);
            }
        });
    }

    // ...下面供外部业务侧调用的 API 保持不变
    addGeometry(data) {
        const id = this._dataManager.addGeometry(data);
        this._animationManager?.setDirty();
        return id;
    }

    updateGeometry(id, partialData) {
        const success = this._dataManager.updateGeometry(id, partialData);
        if (success) this._animationManager?.setDirty();
    }

    removeGeometry(id) {
        const success = this._dataManager.removeGeometry(id);
        if (success) this._animationManager?.setDirty();
    }

    clearGeometries() {
        this._dataManager.clear();
        this._animationManager?.setDirty();
    }
}

loongship.geometryCanvasLayer = function (options = {}) {
    return new GeometryCanvasLayer(options);
};

export default GeometryCanvasLayer;