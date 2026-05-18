// animation-manager.js
/**
 * 动画管理器 - 独立的动画时钟模块
 */

export default class AnimationManager {
    constructor(finalConfig) {
        this._config = finalConfig;
        this._isDirty = true;
        this._isBlinkActive = true;
        this._frequency = this._config.blink.frequency || 1;
        this._animationFrameId = null;
        this._lastBlinkTime = 0;
    }

    setDirty(flag = true) {
        this._isDirty = flag;
    }

    getCurrentBlinkColor() {
        const blinkConfig = this._config.blink;
        return this._isBlinkActive
            ? (blinkConfig.activeColor || 'rgba(255,0,0,1)')
            : (blinkConfig.inactiveColor || 'rgba(255,0,0,0)');
    }

    start(renderCallback, dataManager) {
        const interval = 1000 / this._frequency;

        const animate = () => {
            const now = performance.now();
            const renderShips = dataManager.getRenderShips();

            let hasBlinkShip = false;

            for (const ship of renderShips.values()) {
                if (ship._renderBlink) {
                    hasBlinkShip = true;
                    break;
                }
            }

            let isBlinkUpdate = false;
            if (hasBlinkShip && (now - this._lastBlinkTime >= interval)) {
                this._isBlinkActive = !this._isBlinkActive;
                this._lastBlinkTime = now;
                isBlinkUpdate = true;
            }

            // 🌟 核心优化：如果没有任何变动（没拖拽，也没船需要切换闪烁状态），直接下一帧，避免渲染层空转！
            if (!this._isDirty && !isBlinkUpdate) {
                this._animationFrameId = requestAnimationFrame(animate);
                return;
            }

            if (this._isDirty || isBlinkUpdate) {
                const currentBlinkColor = this.getCurrentBlinkColor();

                renderCallback({
                    isDirty: this._isDirty,
                    currentBlinkColor: currentBlinkColor
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