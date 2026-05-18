import { getShipSymbolList } from './api';
import type {
  RealShipRenderConfigApiRecord,
  RealShipRenderConfigRecord,
} from './types';

export const SHIP_RENDER_CONFIG_STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  EMPTY: 'empty',
  ERROR: 'error',
} as const;

const DEFAULT_RENDER_COLOR = 'rgba(9,181,18,1)';

let shipRenderConfigs: RealShipRenderConfigRecord[] = [];
let shipRenderConfigIndex = new Map<number, RealShipRenderConfigRecord>();
let shipRenderConfigState: string = SHIP_RENDER_CONFIG_STATE.IDLE;
let shipRenderConfigLoadPromise: Promise<RealShipRenderConfigRecord[]> | null = null;
let shipRenderConfigLastLoadedAt = 0;
let shipRenderConfigLastError: unknown = null;

const resolveListPayload = (res: unknown) => {
  if (Array.isArray((res as { data?: { list?: unknown[] } })?.data?.list)) {
    return (res as { data: { list: RealShipRenderConfigApiRecord[] } }).data.list;
  }
  if (Array.isArray((res as { data?: unknown[] })?.data)) {
    return (res as { data: RealShipRenderConfigApiRecord[] }).data;
  }
  if (Array.isArray((res as { rows?: unknown[] })?.rows)) {
    return (res as { rows: RealShipRenderConfigApiRecord[] }).rows;
  }
  if (Array.isArray((res as { list?: unknown[] })?.list)) {
    return (res as { list: RealShipRenderConfigApiRecord[] }).list;
  }

  return [];
};

const parseShipTypes = (value: unknown) => {
  if (!value && value !== 0) {
    return [];
  }

  return String(value)
    .split(',')
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 99);
};

const normalizeRenderColor = (value: unknown) => {
  if (!value) {
    return DEFAULT_RENDER_COLOR;
  }

  return String(value).trim();
};

const normalizeRemoteConfig = (
  item: RealShipRenderConfigApiRecord,
): RealShipRenderConfigRecord => {
  const renderColor = normalizeRenderColor(item?.shipColor);

  return {
    id: item?.id ?? null,
    shipTypeName: item?.shipTypeName || '',
    shipTypes: parseShipTypes(item?.shipType),
    shape: item?.shipSymbol || 'default',
    renderColor,
    fillColor: renderColor,
    strokeColor: renderColor,
    enabled: item?.enabled === true,
  };
};

const rebuildShipRenderConfigIndex = (configs: RealShipRenderConfigRecord[]) => {
  const index = new Map<number, RealShipRenderConfigRecord>();

  configs.forEach((config) => {
    if (config.enabled !== true) {
      return;
    }

    config.shipTypes.forEach((shipType) => {
      if (!index.has(shipType)) {
        index.set(shipType, config);
      }
    });
  });

  return index;
};

const hasUsableCache = (
  configs: RealShipRenderConfigRecord[],
  index: Map<number, RealShipRenderConfigRecord>,
) => configs.length > 0 || index.size > 0;

export const getShipRenderConfigSnapshot = () => ({
  state: shipRenderConfigState,
  configs: shipRenderConfigs,
  index: shipRenderConfigIndex,
  lastLoadedAt: shipRenderConfigLastLoadedAt,
  lastError: shipRenderConfigLastError,
});

export const loadShipRenderConfigs = async (options: { force?: boolean } = {}) => {
  const { force = false } = options;

  if (shipRenderConfigLoadPromise) {
    return shipRenderConfigLoadPromise;
  }

  if (
    !force &&
    (shipRenderConfigState === SHIP_RENDER_CONFIG_STATE.READY ||
      shipRenderConfigState === SHIP_RENDER_CONFIG_STATE.EMPTY)
  ) {
    return shipRenderConfigs;
  }

  const previousConfigs = shipRenderConfigs;
  const previousIndex = shipRenderConfigIndex;
  const previousState = shipRenderConfigState;

  shipRenderConfigState = SHIP_RENDER_CONFIG_STATE.LOADING;
  shipRenderConfigLastError = null;

  shipRenderConfigLoadPromise = (async () => {
    try {
      const res = await getShipSymbolList();
      const nextConfigs = resolveListPayload(res).map(normalizeRemoteConfig);
      const nextIndex = rebuildShipRenderConfigIndex(nextConfigs);

      shipRenderConfigs = nextConfigs;
      shipRenderConfigIndex = nextIndex;
      shipRenderConfigLastLoadedAt = Date.now();
      shipRenderConfigState =
        nextConfigs.length > 0
          ? SHIP_RENDER_CONFIG_STATE.READY
          : SHIP_RENDER_CONFIG_STATE.EMPTY;

      return nextConfigs;
    } catch (error) {
      shipRenderConfigLastError = error;

      if (hasUsableCache(previousConfigs, previousIndex)) {
        shipRenderConfigs = previousConfigs;
        shipRenderConfigIndex = previousIndex;
        shipRenderConfigState = previousState;
      } else {
        shipRenderConfigs = [];
        shipRenderConfigIndex = new Map();
        shipRenderConfigState = SHIP_RENDER_CONFIG_STATE.ERROR;
      }

      console.error('[real-ship] failed to load ship render configs:', error);
      return shipRenderConfigs;
    } finally {
      shipRenderConfigLoadPromise = null;
    }
  })();

  return shipRenderConfigLoadPromise;
};
