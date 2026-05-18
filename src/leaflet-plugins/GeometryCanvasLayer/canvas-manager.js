// canvas-manager.js
import loongship from 'loongship-web';

export default class CanvasManager {
    constructor(map) {
        this._map = map;
        // 🌟 修复1：将 Canvas 挂载到不随底图旋转的 norotatePane，避免画布被双重旋转和裁剪
        const pane = this._map.getPane('norotatePane') || this._map.getPane('overlayPane') || this._map.getPanes().overlayPane;

        this._staticCanvas = document.createElement('canvas');
        this._staticCanvas.style.position = 'absolute';
        this._staticCanvas.style.top = '0';
        this._staticCanvas.style.left = '0';
        this._staticCanvas.style.pointerEvents = 'none';
        this._staticCtx = this._staticCanvas.getContext('2d');
        pane.appendChild(this._staticCanvas);

        this._dynamicCanvas = document.createElement('canvas');
        this._dynamicCanvas.style.position = 'absolute';
        this._dynamicCanvas.style.top = '0';
        this._dynamicCanvas.style.left = '0';
        this._dynamicCtx = this._dynamicCanvas.getContext('2d');
        pane.appendChild(this._dynamicCanvas);

        this.resize();
    }

    resize() {
        if (!this._map || !this._staticCanvas || !this._dynamicCanvas) return;

        const size = this._map.getSize();
        const dpr = window.devicePixelRatio || 1;
        const width = size.x * dpr;
        const height = size.y * dpr;
        const cssWidth = size.x + 'px';
        const cssHeight = size.y + 'px';

        this._staticCanvas.width = width;
        this._staticCanvas.height = height;
        this._staticCanvas.style.width = cssWidth;
        this._staticCanvas.style.height = cssHeight;
        this._staticCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this._dynamicCanvas.width = width;
        this._dynamicCanvas.height = height;
        this._dynamicCanvas.style.width = cssWidth;
        this._dynamicCanvas.style.height = cssHeight;
        this._dynamicCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    updateTransform() {
        if (!this._map || !this._staticCanvas || !this._dynamicCanvas) return;

        // 1. 获取地图容器屏幕左上角 [0, 0] 在底层坐标系中的相对坐标
        let topLeft = this._map.containerPointToLayerPoint([0, 0]);

        // 🌟 修复2：如果地图旋转了，必须把底层坐标逆向投射到不旋转面板的坐标系上
        if (this._map._rotate) {
            topLeft = this._map.rotatedPointToMapPanePoint(topLeft);
        }

        // 2. 将画布精准对齐屏幕左上角
        loongship.DomUtil.setPosition(this._staticCanvas, topLeft);
        loongship.DomUtil.setPosition(this._dynamicCanvas, topLeft);
    }

    clearStatic() {
        if (!this._map || !this._staticCtx) return;
        const size = this._map.getSize();
        this._staticCtx.clearRect(0, 0, size.x, size.y);
    }

    clearDynamic() {
        if (!this._map || !this._dynamicCtx) return;
        const size = this._map.getSize();
        this._dynamicCtx.clearRect(0, 0, size.x, size.y);
    }

    getStaticCtx() { return this._staticCtx; }
    getDynamicCtx() { return this._dynamicCtx; }
    getDynamicCanvas() { return this._dynamicCanvas; }

    destroy() {
        if (this._staticCanvas && this._staticCanvas.parentNode) {
            this._staticCanvas.parentNode.removeChild(this._staticCanvas);
        }
        if (this._dynamicCanvas && this._dynamicCanvas.parentNode) {
            this._dynamicCanvas.parentNode.removeChild(this._dynamicCanvas);
        }
        this._staticCanvas = null;
        this._staticCtx = null;
        this._dynamicCanvas = null;
        this._dynamicCtx = null;
        this._map = null;
    }
}