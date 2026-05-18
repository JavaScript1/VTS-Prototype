// drawer.js
import { DEG_TO_RAD } from "./utils.js";

export default class ShipRenderer {
  constructor(layer) {
    this._layer = layer;
    this._config = layer._getFinalConfig();
    this._defaultDash = [4, 4];
  }

  drawShip(ctx, point, ship, currentBlinkColor, targetPoints) {
    const shipConfig = this._config.ship;
    const predictConfig = this._config.predictionLine;
    const blinkConfig = this._config.blink;
    const width = ship._renderWidth;
    const length = ship._renderLength;

    const rawHeading = ship.heading;
    const isInvalidHeading =
      rawHeading === undefined || rawHeading === null || rawHeading === "";
    const heading = isInvalidHeading ? 0 : Number(rawHeading);

    const map = this._layer._getMap();
    const mapBearing = (map && map.getBearing && map.getBearing()) || 0;
    const angle = (heading + mapBearing) * DEG_TO_RAD;

    const bow = Number(ship.toBow) || 0;
    const stern = Number(ship.toStern) || 0;
    const port = Number(ship.toPort) || 0;
    const starboard = Number(ship.toStarboard) || 0;

    const shipLength = Number(ship.length) || bow + stern || 0;
    const shipWidth = Number(ship.width) || port + starboard || 0;

    let ratioX = 0;
    let ratioY = 0;

    const hasValidY = bow > 0 || stern > 0;
    const hasValidX = port > 0 || starboard > 0;

    if (hasValidY && shipLength > 0) {
      if (bow > 0) {
        ratioY = 0.5 - bow / shipLength;
      } else if (stern > 0) {
        ratioY = stern / shipLength - 0.5;
      }
    }

    if (hasValidX && shipWidth > 0) {
      if (port > 0) {
        ratioX = 0.5 - port / shipWidth;
      } else if (starboard > 0) {
        ratioX = starboard / shipWidth - 0.5;
      }
    }

    const offsetX = ratioX * width;
    const offsetY = ratioY * length;

    const shapeName = ship._renderShape;
    const shapeConfig =
      this._config.shapeTemplates[shapeName] ||
      this._config.shapeTemplates.default;

    const fillColor =
      ship.renderColor ?? ship.fillColor ?? shipConfig.fillColor;

    // =========================================================
    // 绘制轨迹预测线 (画在船体下面)
    // =========================================================
    if (
      predictConfig &&
      ship._renderShowPrediction &&
      ship._predictScreenPoints &&
      ship._predictScreenPoints.length > 0
    ) {
      ctx.save();

      const localHeadX = offsetX;
      const localHeadY = offsetY - length / 2;
      const headOffsetX =
        localHeadX * Math.cos(angle) - localHeadY * Math.sin(angle);
      const headOffsetY =
        localHeadX * Math.sin(angle) + localHeadY * Math.cos(angle);

      ctx.setLineDash(predictConfig.dashArray || this._defaultDash);
      ctx.lineWidth = predictConfig.lineWidth || 1;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      const points = ship._predictScreenPoints;
      const startX = point.x + headOffsetX;
      const startY = point.y + headOffsetY;

      const rotValue = parseFloat(ship.rot);
      const isStraight = isNaN(rotValue) || Math.abs(rotValue) < 0.001;

      // 预到线颜色优先级：
      // 1. 闪烁中的船，统一使用告警闪烁色
      // 2. 正常情况下，优先跟随当前船舶自身的填充色，保持视觉一致
      // 3. 如果船舶未显式配置颜色，再退回 predictionLine 的全局默认色
      const predictionColor = ship._renderBlink
        ? blinkConfig.activeColor
        : (ship.renderColor ?? ship.fillColor ?? fillColor ?? predictConfig.color);
      ctx.strokeStyle = predictionColor;
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.moveTo(startX, startY);

      if (isStraight) {
        const lastP = points[points.length - 1];
        ctx.lineTo(lastP.x + headOffsetX, lastP.y + headOffsetY);
      } else {
        for (let i = 0; i < points.length; i++) {
          ctx.lineTo(points[i].x + headOffsetX, points[i].y + headOffsetY);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // =========================================================
    // 绘制船体
    // =========================================================
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle);
    ctx.translate(offsetX, offsetY);

    const absCenterX =
      point.x + offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
    const absCenterY =
      point.y + offsetX * Math.sin(angle) + offsetY * Math.cos(angle);
    const centerPoint = { x: absCenterX, y: absCenterY };

    this._drawShipShape(
      ctx,
      width,
      length,
      fillColor,
      ship,
      targetPoints,
      centerPoint,
      angle,
      currentBlinkColor,
    );
    this._drawShipOutline(ctx, width, length, ship, currentBlinkColor);
    ctx.restore();
  }

  _calculateActiveQuadrants(targetPoints, centerPoint, angle) {
    let q1 = false,
      q2 = false,
      q3 = false,
      q4 = false;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const TOLERANCE = Math.PI / 12;

    for (let i = 0; i < targetPoints.length; i++) {
      const targetPoint = targetPoints[i];
      const dx = targetPoint.x - centerPoint.x;
      const dy = targetPoint.y - centerPoint.y;
      if (dx !== 0 || dy !== 0) {
        const localDx = dx * cosA + dy * sinA;
        const localDy = -dx * sinA + dy * cosA;
        const theta = Math.atan2(localDy, localDx);
        if (Math.abs(theta) <= TOLERANCE) {
          q1 = true;
          q4 = true;
        } else if (
          Math.abs(theta - Math.PI) <= TOLERANCE ||
          Math.abs(theta + Math.PI) <= TOLERANCE
        ) {
          q2 = true;
          q3 = true;
        } else if (Math.abs(theta - -Math.PI / 2) <= TOLERANCE) {
          q1 = true;
          q2 = true;
        } else if (Math.abs(theta - Math.PI / 2) <= TOLERANCE) {
          q3 = true;
          q4 = true;
        } else {
          if (localDx > 0 && localDy < 0) q1 = true;
          else if (localDx < 0 && localDy < 0) q2 = true;
          else if (localDx < 0 && localDy > 0) q3 = true;
          else if (localDx > 0 && localDy > 0) q4 = true;
        }
      }
    }
    return { q1, q2, q3, q4 };
  }

  _drawShipShape(
    ctx,
    width,
    length,
    fillColor,
    ship,
    targetPoints,
    centerPoint,
    angle,
    currentBlinkColor,
  ) {
    const shapeConfig =
      this._config.shapeTemplates[ship._renderShape] ||
      this._config.shapeTemplates.default;

    if (!shapeConfig) return;

    if (shapeConfig.body) {
      this._drawBody(
        ctx,
        width,
        length,
        fillColor,
        shapeConfig,
        ship,
        targetPoints,
        centerPoint,
        angle,
        currentBlinkColor,
      );
    }

    const decorations = shapeConfig.decorations || [];
    for (let i = 0; i < decorations.length; i++) {
      this._drawShapePart(
        ctx,
        width,
        length,
        fillColor,
        decorations[i],
        ship,
        targetPoints,
        centerPoint,
        angle,
        currentBlinkColor,
      );
    }
  }

  _drawBody(
    ctx,
    width,
    length,
    defaultFillColor,
    shapeConfig,
    ship,
    targetPoints,
    centerPoint,
    angle,
    currentBlinkColor,
  ) {
    const bodyConfig = shapeConfig?.body;
    if (!bodyConfig) return;

    const buildPath = () => {
      this._buildBodyPath(ctx, bodyConfig, width, length);
    };

    const isBlinking = ship._renderBlink;
    const blinkMode = ship._renderBlinkMode;
    const shouldUseBlinkColor =
      isBlinking &&
      (blinkMode === "whole" || !targetPoints || targetPoints.length === 0);
    const resolvedFillColor =
      ship.renderColor ??
      ship.fillColor ??
      bodyConfig.fillColor ??
      defaultFillColor;
    let actualColor = resolvedFillColor;

    if (shouldUseBlinkColor) {
      actualColor = currentBlinkColor;
    }

    const commonStrokeWidth =
      bodyConfig.strokeWidth ??
      ship.strokeWidth ??
      this._config.ship.strokeWidth;
    const paintMode = bodyConfig.paintMode || "fill";
    const shouldFill = paintMode === "fill";
    const shouldStroke = paintMode === "stroke";
    const fillRule = bodyConfig.fillRule || "evenodd";
    const strokeColor = shouldUseBlinkColor
      ? currentBlinkColor
      : (ship.renderColor ??
        ship.strokeColor ??
        bodyConfig.strokeColor ??
        this._config.ship.strokeColor);

    buildPath();

    if (shouldFill && actualColor) {
      ctx.fillStyle = actualColor;
      ctx.fill(fillRule);
    }

    if (
      isBlinking &&
      blinkMode === "quadrant" &&
      targetPoints &&
      targetPoints.length > 0
    ) {
      const { q1, q2, q3, q4 } = this._calculateActiveQuadrants(
        targetPoints,
        centerPoint,
        angle,
      );
      if (q1 || q2 || q3 || q4) {
        ctx.save();
        ctx.clip(fillRule);
        ctx.beginPath();
        ctx.fillStyle = currentBlinkColor;
        if (q1) ctx.rect(0, -length, width, length);
        if (q2) ctx.rect(-width, -length, width, length);
        if (q3) ctx.rect(-width, 0, width, length);
        if (q4) ctx.rect(0, 0, width, length);
        ctx.fill();
        ctx.restore();
      }
    }

    if (shouldStroke && commonStrokeWidth > 0 && strokeColor) {
      buildPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = commonStrokeWidth;
      ctx.stroke();
    }
  }

  _drawShapePart(
    ctx,
    width,
    length,
    defaultFillColor,
    partConfig,
    ship,
    targetPoints,
    centerPoint,
    angle,
    currentBlinkColor,
  ) {
    if (!partConfig) return;

    const buildPath = () => {
      this._buildCanvasPath(ctx, partConfig, width, length);
    };

    const isBlinking = ship._renderBlink;
    const blinkMode = ship._renderBlinkMode;
    const shouldUseBlinkColor =
      isBlinking &&
      (blinkMode === "whole" || !targetPoints || targetPoints.length === 0);
    const resolvedFillColor =
      ship.renderColor ??
      ship.fillColor ??
      partConfig.fillColor ??
      defaultFillColor;
    let actualColor = resolvedFillColor;

    if (shouldUseBlinkColor) {
      actualColor = currentBlinkColor;
    }

    const commonStrokeWidth =
      partConfig.strokeWidth ??
      ship.strokeWidth ??
      this._config.ship.strokeWidth;
    const paintMode = partConfig.paintMode || "fill";
    const shouldFill = paintMode === "fill";
    const shouldStroke = paintMode === "stroke";
    // 主图形描边颜色优先级：
    // 1. 闪烁命中时统一使用当前闪烁色
    // 2. 正常情况下优先使用船舶实例自己的 strokeColor
    // 3. 再退回局部 part 配置和 shape 模板配置
    // 4. 最后使用全局 ship.strokeColor
    const strokeColor = shouldUseBlinkColor
      ? currentBlinkColor
      : (ship.renderColor ??
        ship.strokeColor ??
        partConfig.strokeColor ??
        this._config.ship.strokeColor);
    const fillRule = partConfig.fillRule || "evenodd";

    buildPath();

    if (shouldFill) {
      if (actualColor) {
        ctx.fillStyle = actualColor;
        ctx.fill(fillRule);
      }
    }

    // 象限闪烁逻辑
    if (
      isBlinking &&
      blinkMode === "quadrant" &&
      targetPoints &&
      targetPoints.length > 0
    ) {
      const { q1, q2, q3, q4 } = this._calculateActiveQuadrants(
        targetPoints,
        centerPoint,
        angle,
      );
      if (q1 || q2 || q3 || q4) {
        ctx.save();
        ctx.clip(fillRule);
        ctx.beginPath();
        ctx.fillStyle = currentBlinkColor;
        if (q1) ctx.rect(0, -length, width, length);
        if (q2) ctx.rect(-width, -length, width, length);
        if (q3) ctx.rect(-width, 0, width, length);
        if (q4) ctx.rect(0, 0, width, length);
        ctx.fill();
        ctx.restore();
      }
    }

    // 常规描边
    if (shouldStroke) {
      if (commonStrokeWidth > 0 && strokeColor) {
        buildPath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = commonStrokeWidth;
        ctx.stroke();
      }
    }
  }

  _drawShipOutline(ctx, width, length, ship, currentBlinkColor) {
    const outlineConfig = this._config.shipOutline;
    if (!outlineConfig?.enable) return;

    const shapeConfig =
      this._config.shapeTemplates[ship._renderShape] ||
      this._config.shapeTemplates.default;
    const outlinePath = this._resolveBodyOuterPath(shapeConfig?.body);
    if (!outlinePath || outlinePath.length === 0) return;

    const strokeWidth = outlineConfig.lineWidth ?? 0.75;
    if (strokeWidth <= 0) return;

    // 外轮廓颜色优先级：
    // 1. 闪烁船舶统一使用当前闪烁色
    // 2. 正常情况下优先读取船舶实例自己的 outlineColor
    // 3. 再退回 shape 模板里 outline 的默认描边色
    // 4. 最后使用全局 shipOutline.color
    // 5. 如果以上都没有，则不绘制外轮廓
    const strokeColor = ship._renderBlink
      ? currentBlinkColor
      : (ship.outlineColor ?? outlineConfig.color);

    if (!strokeColor) return;

    this._buildCanvasPath(ctx, { path: outlinePath }, width, length);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }

  _resolveBodyOuterPath(bodyConfig) {
    if (!bodyConfig) return null;

    if (bodyConfig.outerPath && bodyConfig.outerPath.length > 0) {
      return bodyConfig.outerPath;
    }

    return null;
  }

  _buildBodyPath(ctx, bodyConfig, width, length) {
    const outerPath = this._resolveBodyOuterPath(bodyConfig);
    if (!outerPath || outerPath.length === 0) {
      ctx.beginPath();
      return;
    }

    this._buildCanvasPath(ctx, { path: outerPath }, width, length);

    const cutouts = bodyConfig.cutouts || [];
    for (let i = 0; i < cutouts.length; i++) {
      const cutout = cutouts[i];
      if (cutout?.path?.length > 0) {
        this._appendPathCommands(ctx, cutout.path, width, length);
      }
    }
  }

  _buildCanvasPath(ctx, shapeLikeConfig, width, length) {
    ctx.beginPath();
    if (shapeLikeConfig.path && shapeLikeConfig.path.length > 0) {
      this._appendPathCommands(ctx, shapeLikeConfig.path, width, length);
    }
    if (shapeLikeConfig.circles && shapeLikeConfig.circles.length > 0) {
      for (let i = 0; i < shapeLikeConfig.circles.length; i++) {
        const c = shapeLikeConfig.circles[i];
        const cx = c[0] * width,
          cy = c[1] * length,
          r = c[2] * width;
        ctx.moveTo(cx + r, cy);
        ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
      }
    }
    if (shapeLikeConfig.dynamicCircles) {
      const dc = shapeLikeConfig.dynamicCircles;
      const r = dc.radiusRatio * width,
        startY = dc.startYRatio * length,
        endY = dc.endYRatio * length;
      const availableLen = endY - startY;
      const step = r * 2 + dc.gapRatio * width;
      let count = Math.floor((availableLen + dc.gapRatio * width) / step);
      if (count < 1) count = 0;
      const actualTotalLen =
        count * r * 2 + Math.max(0, count - 1) * (dc.gapRatio * width);
      const offsetY = startY + (availableLen - actualTotalLen) / 2;
      for (let i = 0; i < count; i++) {
        const cx = 0,
          cy = offsetY + r + i * step;
        ctx.moveTo(cx + r, cy);
        ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
      }
    }
  }

  _appendPathCommands(ctx, path, width, length) {
    const firstElement = path[0];
    if (typeof firstElement[0] === "number") {
      ctx.moveTo(firstElement[0] * width, firstElement[1] * length);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i][0] * width, path[i][1] * length);
      }
      ctx.closePath();
      return;
    }

    for (let i = 0; i < path.length; i++) {
      const cmd = path[i];
      const type = cmd[0];
      if (type === "M") ctx.moveTo(cmd[1] * width, cmd[2] * length);
      else if (type === "L") ctx.lineTo(cmd[1] * width, cmd[2] * length);
      else if (type === "Q")
        ctx.quadraticCurveTo(
          cmd[1] * width,
          cmd[2] * length,
          cmd[3] * width,
          cmd[4] * length,
        );
      else if (type === "C")
        ctx.bezierCurveTo(
          cmd[1] * width,
          cmd[2] * length,
          cmd[3] * width,
          cmd[4] * length,
          cmd[5] * width,
          cmd[6] * length,
        );
      else if (type === "Z") ctx.closePath();
    }
  }
}
