// ShipMarkerCanvasLayer/render-pipeline.js

export default class RenderPipeline {
  constructor(layer) {
    this._layer = layer;
    this._visibleScreenPoints = new Map();
  }

  render(state, managers) {
    const { isDirty, currentBlinkColor } = state;
    const {
      map,
      canvasManager,
      dataManager,
      renderer,
      overlayManager,
      eventHandler,
      config,
    } = managers;

    const staticCtx = canvasManager.getStaticCtx();
    const dynamicCtx = canvasManager.getDynamicCtx();
    if (!staticCtx || !dynamicCtx) return;

    const predictConfig = config.predictionLine;

    // =========================================================
    // 自定义亚像素转换器 (🌟 引入坐标缓存机制)
    // =========================================================
    let topLeft = map.containerPointToLayerPoint([0, 0]);
    if (map._rotate) {
      topLeft = map.rotatedPointToMapPanePoint(topLeft);
    }
    const origin = map.getPixelOrigin();
    const currentZoom = map.getZoom();

    const getSubPixel = (ship, latLng, isPrediction = false) => {
      // 🌟 对主船体的坐标进行缓存，避免每次渲染都调用昂贵的 map.project
      if (!isPrediction) {
        if (
          !ship._cachedLayerPt ||
          ship._cachedZoom !== currentZoom ||
          ship._cachedLatLng !== latLng
        ) {
          const projected = map.project(latLng);
          let layerPt = projected.subtract(origin);
          if (map._rotate && map.rotatedPointToMapPanePoint) {
            layerPt = map.rotatedPointToMapPanePoint(layerPt);
          }
          ship._cachedLayerPt = layerPt;
          ship._cachedZoom = currentZoom;
          ship._cachedLatLng = latLng;
        }
        return {
          x: ship._cachedLayerPt.x - topLeft.x,
          y: ship._cachedLayerPt.y - topLeft.y,
        };
      } else {
        // 对于预到线等动态点的常规转换
        const projected = map.project(latLng);
        let layerPt = projected.subtract(origin);
        if (map._rotate && map.rotatedPointToMapPanePoint) {
          layerPt = map.rotatedPointToMapPanePoint(layerPt);
        }
        return {
          x: layerPt.x - topLeft.x,
          y: layerPt.y - topLeft.y,
        };
      }
    };
    // =========================================================

    if (isDirty) {
      canvasManager.updateTransform();
      canvasManager.clearStatic();
      canvasManager.clearDynamic();

      const bounds = map.getBounds();
      const renderShips = dataManager.getRenderShips();

      this._visibleScreenPoints.clear();
      const visibleScreenPoints = this._visibleScreenPoints;

      renderShips.forEach((ship) => {
        if (bounds.contains(ship._latLng)) {
          // 🌟 传入 ship 和 latLng，触发缓存
          const point = getSubPixel(ship, ship._latLng);
          ship._screenPoint = point;
          visibleScreenPoints.set(ship.mmsi, point);

          if (predictConfig && ship._renderShowPrediction) {
            const sog = Number(ship.sog) || 0;

            if (sog > 0) {
              ship._predictLatLngs = dataManager.generateTrajectory(
                ship,
                predictConfig,
              );
            } else {
              ship._predictLatLngs = null;
            }
          } else {
            ship._predictLatLngs = null;
          }

          if (ship._predictLatLngs) {
            ship._predictScreenPoints = ship._predictLatLngs.map((latLng) =>
              getSubPixel(ship, latLng, true),
            );
          } else {
            ship._predictScreenPoints = null;
          }
        } else {
          ship._screenPoint = null;
          ship._predictScreenPoints = null;
          ship._predictLatLngs = null;
          ship._lastPredictState = null;
        }
      });

      renderShips.forEach((ship) => {
        const point = visibleScreenPoints.get(ship.mmsi);
        if (!point) return;

        const targetShips = dataManager.getCollisionTargets(ship.mmsi);
        const targetPoints = [];

        for (let i = 0; i < targetShips.length; i++) {
          const tShip = targetShips[i];
          let tPoint = visibleScreenPoints.get(tShip.mmsi);
          // 🌟 同步更新这处的调用方式
          if (!tPoint) tPoint = getSubPixel(tShip, tShip._latLng);
          targetPoints.push(tPoint);
        }

        ship._targetPoints = targetPoints;
        const isDynamic = ship._renderBlink;

        if (isDynamic) {
          renderer.drawShip(
            dynamicCtx,
            point,
            ship,
            currentBlinkColor,
            targetPoints,
          );
        } else {
          renderer.drawShip(
            staticCtx,
            point,
            ship,
            currentBlinkColor,
            targetPoints,
          );
        }
      });

      overlayManager.updateOverlay();
      eventHandler.updateSelectedMarkerPosition();
    } else {
      canvasManager.clearDynamic();

      const renderShips = dataManager.getRenderShips();
      renderShips.forEach((ship) => {
        const isDynamic = ship._renderBlink;

        if (isDynamic && ship._screenPoint) {
          let realtimeTargetPoints = [];
          if (ship._renderBlinkMode === "quadrant") {
            const targetShips = dataManager.getCollisionTargets(ship.mmsi);
            for (let i = 0; i < targetShips.length; i++) {
              const tShip = targetShips[i];
              let tPoint = tShip._screenPoint;
              // 🌟 同步更新调用方式
              if (!tPoint) tPoint = getSubPixel(tShip, tShip._latLng);
              realtimeTargetPoints.push(tPoint);
            }
          } else {
            realtimeTargetPoints = ship._targetPoints || [];
          }

          renderer.drawShip(
            dynamicCtx,
            ship._screenPoint,
            ship,
            currentBlinkColor,
            realtimeTargetPoints,
          );
        }
      });
    }
  }
}
