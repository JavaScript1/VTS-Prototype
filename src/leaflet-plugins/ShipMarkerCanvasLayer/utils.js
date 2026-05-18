// utils.js
const EPSILON = 1e-10;

export const DEG_TO_RAD = Math.PI / 180;

export function computeDestinationPoint(
  lat,
  lng,
  distanceMeters,
  bearingDegrees,
) {
  const R = 6378137;
  const brng = bearingDegrees * DEG_TO_RAD;
  const lat1 = lat * DEG_TO_RAD;
  const lon1 = lng * DEG_TO_RAD;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceMeters / R) +
      Math.cos(lat1) * Math.sin(distanceMeters / R) * Math.cos(brng),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(distanceMeters / R) * Math.cos(lat1),
      Math.cos(distanceMeters / R) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    lat: lat2 / DEG_TO_RAD,
    lng: lon2 / DEG_TO_RAD,
  };
}

function isPlainObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

export function deepMerge(target, source) {
  if (!isPlainObject(target)) return source;
  if (!isPlainObject(source)) return target;

  const merged = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (isPlainObject(source[key])) {
        merged[key] = deepMerge(merged[key] || {}, source[key]);
      } else {
        merged[key] = source[key];
      }
    }
  }
  return merged;
}

/**
 * 判断鼠标屏幕坐标是否落在某艘船舶的多边形区域内
 * 🌟 补上 mapBearing 参数进行拾取修正
 */
export function isPointInShip(
  px,
  py,
  ship,
  point,
  finalConfig,
  mapBearing = 0,
) {
  const rawHeading = ship.heading;
  const isInvalidHeading =
    rawHeading === undefined || rawHeading === null || rawHeading === "";
  const heading = isInvalidHeading ? 0 : Number(rawHeading);

  // 🌟 角度补偿
  const angle = (heading + mapBearing) * DEG_TO_RAD;

  const width = ship._renderWidth;
  const length = ship._renderLength;

  // ==========================================
  // 🌟 同步偏移比率计算
  // ==========================================
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

  const template =
    finalConfig.shapeTemplates[ship._renderShape] ||
    finalConfig.shapeTemplates.default;
  const path = getHitPath(template, finalConfig);
  if (!path) return false;

  const hitPolygon = [];
  let currentX = 0,
    currentY = 0;

  for (let i = 0; i < path.length; i++) {
    const cmd = path[i];

    if (cmd[0] === "Z") {
      break;
    }

    if (typeof cmd[0] === "number") {
      hitPolygon.push([cmd[0], cmd[1]]);
      currentX = cmd[0];
      currentY = cmd[1];
    } else {
      const type = cmd[0];
      if (type === "M" || type === "L") {
        hitPolygon.push([cmd[1], cmd[2]]);
        currentX = cmd[1];
        currentY = cmd[2];
      } else if (type === "Q") {
        const midX = 0.25 * currentX + 0.5 * cmd[1] + 0.25 * cmd[3];
        const midY = 0.25 * currentY + 0.5 * cmd[2] + 0.25 * cmd[4];
        hitPolygon.push([midX, midY]);
        hitPolygon.push([cmd[3], cmd[4]]);
        currentX = cmd[3];
        currentY = cmd[4];
      } else if (type === "C") {
        hitPolygon.push([cmd[5], cmd[6]]);
        currentX = cmd[5];
        currentY = cmd[6];
      }
    }
  }

  // 将偏移比率传递进入
  return isPointInRotatedPolygon(
    px,
    py,
    point.x,
    point.y,
    hitPolygon,
    width,
    length,
    angle,
    ratioX,
    ratioY,
  );
}

function getHitPath(template, finalConfig) {
  if (!template) return null;
  const body = template.body;
  if (!body) return null;
  if (Array.isArray(body.outerPath) && body.outerPath.length > 0) {
    return body.outerPath;
  }
  return null;
}

function isPointInRotatedPolygon(
  px,
  py,
  cx,
  cy,
  hitPolygon,
  width,
  height,
  angle,
  ratioX = 0,
  ratioY = 0,
) {
  const dx = px - cx;
  const dy = py - cy;
  const rotatedX = dx * Math.cos(-angle) - dy * Math.sin(-angle);
  const rotatedY = dx * Math.sin(-angle) + dy * Math.cos(-angle);

  // 将鼠标映射进偏移后的坐标系内进行抵消
  const localX = rotatedX / width - ratioX;
  const localY = rotatedY / height - ratioY;

  return isPointInPolygon(localX, localY, hitPolygon);
}

function isPointInPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];

    if (Math.abs(yi - py) < EPSILON) py += EPSILON;

    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + EPSILON) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

export function getCanvasLocalPoint(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  return {
    x: (e.clientX - rect.left) * dpr,
    y: (e.clientY - rect.top) * dpr,
  };
}

export function _throttle(func, limit) {
  let inThrottle;
  let lastArgs;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}
