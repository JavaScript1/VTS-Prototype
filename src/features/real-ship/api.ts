import { requestJson } from './request';
import type { RealShipApiRecord, RealShipRenderConfigApiRecord } from './types';

type AreaShipListResponse = {
  code?: number;
  data?: RealShipApiRecord[];
  msg?: string;
};

type ShipSymbolListResponse = {
  code?: number;
  data?: RealShipRenderConfigApiRecord[] | { list?: RealShipRenderConfigApiRecord[] };
  rows?: RealShipRenderConfigApiRecord[];
  list?: RealShipRenderConfigApiRecord[];
  msg?: string;
};

export const getAreaShipList = async (areaId: number) => {
  const response = await requestJson<AreaShipListResponse>(
    '/vts-intelligent-assistance-server/ship/areaShipList',
    {
      params: { areaId },
    },
  );

  return Array.isArray(response?.data) ? response.data : [];
};

export const getShipSymbolList = () =>
  requestJson<ShipSymbolListResponse>(
    '/vts-intelligent-assistance-server/shipSymbol/config/list',
    {
      params: {},
    },
  );
