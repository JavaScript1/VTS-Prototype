export type RealShipApiRecord = {
  mmsi: string | number;
  lat?: string | number | null;
  lon?: string | number | null;
  lng?: string | number | null;
  sog?: string | number | null;
  cog?: string | number | null;
  heading?: string | number | null;
  rot?: string | number | null;
  length?: string | number | null;
  width?: string | number | null;
  toBow?: string | number | null;
  toStern?: string | number | null;
  toPort?: string | number | null;
  toStarboard?: string | number | null;
  name?: string | null;
  nameCn?: string | null;
  shipTypeName?: string | null;
  shipType?: string | null;
  posTime?: string | number | null;
  receiveTime?: string | number | null;
  [key: string]: unknown;
};

export type RealShipRenderConfigApiRecord = {
  id?: string | number | null;
  shipTypeName?: string | null;
  shipType?: string | number | null;
  shipColor?: string | null;
  shipSymbol?: string | null;
  enabled?: boolean | null;
  [key: string]: unknown;
};

export type RealShipRenderConfigRecord = {
  id: string | number | null;
  shipTypeName: string;
  shipTypes: number[];
  shape: string;
  renderColor: string;
  fillColor: string;
  strokeColor: string;
  enabled: boolean;
};

export type RealShipCanvasRecord = RealShipApiRecord & {
  mmsi: string | number;
  lat: number;
  lon: number;
  lng: number;
  sog: number;
  speed: number;
  heading?: number;
  cog?: number;
  rot?: number;
  length?: number;
  width?: number;
  toBow?: number;
  toStern?: number;
  toPort?: number;
  toStarboard?: number;
  shape?: string;
  renderColor?: string;
  fillColor?: string;
  strokeColor?: string;
  outlineColor?: string;
  renderConfigState?: string;
  renderConfigMatched?: boolean;
  renderConfigId?: string | number | null;
  renderConfigShipTypeName?: string;
  renderConfigSource?: string;
};
