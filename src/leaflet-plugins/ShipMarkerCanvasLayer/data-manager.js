// data-manager.js
import loongship from "loongship-web";
import { computeDestinationPoint, DEG_TO_RAD } from "./utils.js";

export default class DataManager {
  constructor(finalConfig) {
    this._config = finalConfig;
    this._ships = new Map();
    this._collisionMap = new Map();
  }

  setShips(shipsArr) {
    this._ships.clear();
    shipsArr.forEach((ship) => {
      this.updateShip(ship);
    });
  }

  generateTrajectory(ship, predictConfig) {
    const lat = Number(ship.lat);
    const lng = Number(ship.lng);
    const sog = Number(ship.sog) || 0;
    const rot = Number(ship.rot) || 0;

    // ==========================================
    // 🌟 核心逻辑替换：优先 COG，其次 Heading，没有则阻断
    // ==========================================
    const rawCog = ship.cog;
    const rawHeading = ship.heading;
    const isValid = (val) =>
      val !== undefined && val !== null && val !== "" && !isNaN(Number(val));

    let baseDirection = null;
    if (isValid(rawCog)) {
      baseDirection = Number(rawCog); // 首选：对地航向
    } else if (isValid(rawHeading)) {
      baseDirection = Number(rawHeading); // 备选：船首向
    }

    // 如果都没有，直接返回 null，拒绝生成预测线
    if (baseDirection === null) {
      return null;
    }
    // ==========================================

    // 🌟 更新缓存校验逻辑，使用 baseDirection 代替 heading
    if (
      ship._predictLatLngs &&
      ship._lastPredictState &&
      ship._lastPredictState.lat === lat &&
      ship._lastPredictState.lng === lng &&
      ship._lastPredictState.sog === sog &&
      ship._lastPredictState.baseDirection === baseDirection &&
      ship._lastPredictState.rot === rot
    ) {
      return ship._predictLatLngs;
    }

    const predictLatLngs = [];
    const timeMinutes = predictConfig.timeMinutes || 5;
    const pointCount = predictConfig.pointCount || 50;
    const stepMin = timeMinutes / pointCount;

    const distPerStep = sog * 30.8667 * stepMin;

    let currentLat = lat;
    let currentLng = lng;

    // 🌟 初始方向设为推算出来的 baseDirection
    let currentHeading = baseDirection;

    let accumulatedTurn = 0;
    const MAX_TURN = 90;

    for (let i = 0; i < pointCount; i++) {
      let effectiveRot = rot;

      if (accumulatedTurn >= MAX_TURN) {
        effectiveRot = 0;
      } else {
        const turnThisStep = Math.abs(effectiveRot * stepMin);
        if (accumulatedTurn + turnThisStep > MAX_TURN) {
          const remainingTurn = MAX_TURN - accumulatedTurn;
          effectiveRot = Math.sign(rot) * (remainingTurn / stepMin);
          accumulatedTurn = MAX_TURN;
        } else {
          accumulatedTurn += turnThisStep;
        }
      }

      const avgHeading =
        effectiveRot === 0
          ? currentHeading
          : currentHeading + (effectiveRot * stepMin) / 2;
      const dest = computeDestinationPoint(
        currentLat,
        currentLng,
        distPerStep,
        avgHeading,
      );

      currentLat = dest.lat;
      currentLng = dest.lng;

      if (effectiveRot !== 0) {
        currentHeading += effectiveRot * stepMin;
      }

      predictLatLngs.push(loongship.latLng(currentLat, currentLng));
    }

    // 🌟 更新缓存记录
    ship._lastPredictState = { lat, lng, sog, baseDirection, rot };
    return predictLatLngs;
  }

  updateShip(ship) {
    if (!ship.lat || !ship.lng) return;
    const oldShip = this._ships.get(ship.mmsi) || {};

    let newLatLng = oldShip._latLng;
    if (!newLatLng || oldShip.lat !== ship.lat || oldShip.lng !== ship.lng) {
      newLatLng = loongship.latLng(Number(ship.lat), Number(ship.lng));
    }

    const merged = {
      ...oldShip,
      ...ship,
      _latLng: newLatLng,
      rot: Number(ship.rot) || 0,
    };
    this._ships.set(ship.mmsi, merged);
  }

  processData(zoom) {
    this._collisionMap.clear();

    const shipConfig = this._config.ship;
    const lodConfig = this._config.lod;
    const predictConfig = this._config.predictionLine;
    const { isRealShip, minIconSize } = shipConfig;

    const [minPixelWidth, minPixelLength] = minIconSize || [6, 12];
    const zoomScaleBase = 156543.03392 / Math.pow(2, zoom);
    const MAX_SHIP_LENGTH = 600;

    let currentLod = {};
    if (lodConfig && lodConfig.enable && lodConfig.levels) {
      currentLod = lodConfig.levels.find((l) => zoom < l.maxZoom) || {};
    }

    this._ships.forEach((ship) => {
      if (ship.isCollisionWarning) {
        let targets = ship.collisionTargetMmsis || ship.collisionTargetMmsi;
        if (targets) {
          if (!Array.isArray(targets)) targets = [targets];
          if (!this._collisionMap.has(ship.mmsi))
            this._collisionMap.set(ship.mmsi, new Set());
          targets.forEach((targetMmsi) => {
            this._collisionMap.get(ship.mmsi).add(targetMmsi);
            if (!this._collisionMap.has(targetMmsi))
              this._collisionMap.set(targetMmsi, new Set());
            this._collisionMap.get(targetMmsi).add(ship.mmsi);
          });
        }
      }
    });

    this._ships.forEach((ship) => {
      if (currentLod.forceSize) {
        ship._renderWidth = currentLod.forceSize[0];
        ship._renderLength = currentLod.forceSize[1];
      } else if (isRealShip && ship.width && ship.length) {
        const latRad = Number(ship.lat) * DEG_TO_RAD;
        const metersPerPixel = zoomScaleBase * Math.cos(latRad);
        const shouldScale = MAX_SHIP_LENGTH / metersPerPixel >= minPixelLength;
        ship._renderWidth = shouldScale
          ? Math.max(ship.width / metersPerPixel, minPixelWidth)
          : minPixelWidth;
        ship._renderLength = shouldScale
          ? Math.max(ship.length / metersPerPixel, minPixelLength)
          : minPixelLength;
      } else {
        ship._renderWidth = minPixelWidth;
        ship._renderLength = minPixelLength;
      }

      ship._renderShape = currentLod.shape || ship.shape || shipConfig.shape;

      const baseShowPredict =
        ship.showPredictionLine !== undefined
          ? ship.showPredictionLine
          : predictConfig?.show;

      const meetZoomCondition =
        predictConfig?.minZoom === undefined || zoom >= predictConfig.minZoom;
      const sog = Number(ship.sog) || 0;
      const meetSpeedCondition =
        predictConfig?.minSpeed === undefined || sog >= predictConfig.minSpeed;
      const currentRot = Math.abs(Number(ship.rot) || 0);
      const meetRotCondition =
        predictConfig?.maxRot === undefined ||
        currentRot <= predictConfig.maxRot;

      ship._renderShowPrediction =
        baseShowPredict &&
        meetZoomCondition &&
        meetSpeedCondition &&
        meetRotCondition;

      ship._renderBlink = ship.blink || false;
      let baseBlinkMode = ship.blinkMode || this._config.blink?.mode || "whole";

      if (
        this._collisionMap.has(ship.mmsi) &&
        this._collisionMap.get(ship.mmsi).size > 0
      ) {
        ship._renderBlink = true;
        baseBlinkMode = "quadrant";
      }

      if (currentLod.simplifyBlink && baseBlinkMode === "quadrant") {
        baseBlinkMode = "whole";
      }
      ship._renderBlinkMode = baseBlinkMode;
    });
  }

  getRenderShips() {
    return this._ships;
  }

  removeShips(mmsiList) {
    mmsiList.forEach((mmsi) => {
      this._ships.delete(mmsi);
    });
  }

  getCollisionTargets(mmsi) {
    const targetShips = [];
    if (this._collisionMap.has(mmsi)) {
      this._collisionMap.get(mmsi).forEach((targetMmsi) => {
        const targetShip = this._ships.get(targetMmsi);
        if (targetShip) targetShips.push(targetShip);
      });
    }
    return targetShips;
  }

  clear() {
    this._ships.clear();
    this._collisionMap.clear();
  }
}
