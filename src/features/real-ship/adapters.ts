import type { RealShipApiRecord, RealShipCanvasRecord } from './types';
import { resolveShipRenderConfig } from './shipRenderConfigResolver';

const COORDINATE_SCALE = 600000;

const toFiniteNumber = (value: unknown) => {
  const next = typeof value === 'string' && value.trim() === '' ? Number.NaN : Number(value);
  return Number.isFinite(next) ? next : null;
};

const toOptionalNumber = (value: unknown) => {
  const next = toFiniteNumber(value);
  return next === null ? undefined : next;
};

export const adaptRealShipToCanvasShip = (
  rawShip: RealShipApiRecord,
): RealShipCanvasRecord | null => {
  const rawLat = toFiniteNumber(rawShip.lat);
  const rawLon = toFiniteNumber(rawShip.lon ?? rawShip.lng);
  const mmsi = rawShip.mmsi;

  if (
    rawLat === null ||
    rawLon === null ||
    mmsi === null ||
    mmsi === undefined ||
    mmsi === ''
  ) {
    return null;
  }

  const lat = rawLat / COORDINATE_SCALE;
  const lon = rawLon / COORDINATE_SCALE;
  const heading = toOptionalNumber(rawShip.heading) ?? toOptionalNumber(rawShip.cog);
  const sog = toFiniteNumber(rawShip.sog) ?? 0;
  const renderConfig = resolveShipRenderConfig(rawShip.shipType);

  return {
    ...rawShip,
    mmsi,
    lat,
    lon,
    lng: lon,
    sog,
    speed: sog,
    heading,
    cog: toOptionalNumber(rawShip.cog),
    rot: toOptionalNumber(rawShip.rot) ?? 0,
    length: toOptionalNumber(rawShip.length),
    width: toOptionalNumber(rawShip.width),
    toBow: toOptionalNumber(rawShip.toBow),
    toStern: toOptionalNumber(rawShip.toStern),
    toPort: toOptionalNumber(rawShip.toPort),
    toStarboard: toOptionalNumber(rawShip.toStarboard),
    shape: renderConfig.shape,
    renderColor: renderConfig.renderColor,
    fillColor: renderConfig.fillColor ?? renderConfig.renderColor,
    strokeColor: renderConfig.strokeColor ?? renderConfig.renderColor,
    outlineColor: renderConfig.outlineColor,
    renderConfigState: renderConfig.configState,
    renderConfigMatched: renderConfig.configMatched,
    renderConfigId: renderConfig.configId,
    renderConfigShipTypeName: renderConfig.shipTypeName,
    renderConfigSource: renderConfig.source,
  };
};

export const adaptRealShipsToCanvasShips = (ships: RealShipApiRecord[]) =>
  ships
    .map(adaptRealShipToCanvasShip)
    .filter((ship): ship is RealShipCanvasRecord => ship !== null);
