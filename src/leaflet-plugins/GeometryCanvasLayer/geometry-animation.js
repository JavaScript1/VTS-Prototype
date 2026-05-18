// geometry-animation.js
export default class GeometryAnimationManager {
    constructor(config = {}) {
        const blinkConfig = config.blink || {};
        // 保存全局兜底频率
        this._globalFrequency = config.frequency ?? blinkConfig.frequency ?? 1;

        this._isDirty = true;
        this._animationFrameId = null;
    }

    setDirty(flag = true) {
        this._isDirty = flag;
    }

    // 提供给外部获取全局兜底频率
    getGlobalFrequency() {
        return this._globalFrequency;
    }

    setFrequency(freq) {
        if (typeof freq === 'number' && freq > 0) {
            this._globalFrequency = freq;
        }
    }

    start(renderCallback, dataManager) {
        const animate = () => {
            const time = performance.now();
            const geometries = dataManager.getGeometries();

            let hasBlink = false;
            for (const geo of geometries.values()) {
                if (geo.isBlink) {
                    hasBlink = true;
                    break;
                }
            }

            // 只要有闪烁对象，或者由于拖拽触发了重绘，就把当前时间抛给渲染管线
            if (this._isDirty || hasBlink) {
                renderCallback({
                    isDirty: this._isDirty,
                    time: time // 🌟 核心变化：只传时间戳，不传算好的 Alpha
                });
                this._isDirty = false;
            }

            this._animationFrameId = requestAnimationFrame(animate);
        };

        this._animationFrameId = requestAnimationFrame(animate);
    }

    stop() {
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
    }
}