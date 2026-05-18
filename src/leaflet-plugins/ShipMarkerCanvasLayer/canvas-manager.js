// canvas-manager.js
import loongship from 'loongship-web';

export default class CanvasManager {
    constructor(map) {
        this._map = map;
        // 🌟 修复 1：将 Canvas 挂载到不随底图旋转的 norotatePane，避免画布被扭曲裁剪
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
        this._dynamicCanvas.style.pointerEvents = 'none';
        this._dynamicCtx = this._dynamicCanvas.getContext('2d');
        pane.appendChild(this._dynamicCanvas);

        this.resize();
    }

    resize() {
        if (!this._map) return;
        const size = this._map.getSize();
        const dpr = window.devicePixelRatio || 1;
        const width = size.x * dpr;
        const height = size.y * dpr;

        this._staticCanvas.width = width;
        this._staticCanvas.height = height;
        this._staticCanvas.style.width = size.x + 'px';
        this._staticCanvas.style.height = size.y + 'px';
        this._staticCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this._dynamicCanvas.width = width;
        this._dynamicCanvas.height = height;
        this._dynamicCanvas.style.width = size.x + 'px';
        this._dynamicCanvas.style.height = size.y + 'px';
        this._dynamicCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this._staticCtx.imageSmoothingEnabled = true;
        this._staticCtx.imageSmoothingQuality = 'high';
        this._dynamicCtx.imageSmoothingEnabled = true;
        this._dynamicCtx.imageSmoothingQuality = 'high';
    }

    updateTransform() {
        if (!this._map) return;

        // 获取屏幕正左上角 [0, 0] 在基础图层中的坐标
        let topLeft = this._map.containerPointToLayerPoint([0, 0]);

        // 如果地图旋转了，基础图层（rotatePane）是歪的。
        if (this._map._rotate) {
            topLeft = this._map.rotatedPointToMapPanePoint(topLeft);
        }

        // 🌟 修复：直接使用模板字符串拼凑浮点数，强制开启亚像素定位！
        const pos = `translate3d(${topLeft.x}px, ${topLeft.y}px, 0px)`;
        this._staticCanvas.style.transform = pos;
        this._dynamicCanvas.style.transform = pos;
    }

    clearStatic() {
        const size = this._map.getSize();
        this._staticCtx.clearRect(0, 0, size.x, size.y);
    }

    clearDynamic() {
        const size = this._map.getSize();
        this._dynamicCtx.clearRect(0, 0, size.x, size.y);
    }

    getStaticCtx() { return this._staticCtx; }
    getDynamicCtx() { return this._dynamicCtx; }
    getDynamicCanvas() { return this._dynamicCanvas; }

    destroy() {
        [this._staticCanvas, this._dynamicCanvas].forEach(c => {
            if (c && c.parentNode) c.parentNode.removeChild(c);
        });
        this._map = null;
    }
}