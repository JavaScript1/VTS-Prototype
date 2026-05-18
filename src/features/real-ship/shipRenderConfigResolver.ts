import {
  getShipRenderConfigSnapshot,
  SHIP_RENDER_CONFIG_STATE,
} from './shipRenderConfigRepository';

const DEFAULT_RENDER_COLOR = 'rgba(9,181,18,1)';

export const DEFAULT_SHIP_RENDER_CONFIG = {
  shape: 'default',
  renderColor: DEFAULT_RENDER_COLOR,
  fillColor: DEFAULT_RENDER_COLOR,
  strokeColor: DEFAULT_RENDER_COLOR,
  configState: SHIP_RENDER_CONFIG_STATE.IDLE,
  configMatched: false,
  source: 'default',
};

const createResolvedConfig = (
  baseConfig: Partial<typeof DEFAULT_SHIP_RENDER_CONFIG> & {
    outlineColor?: string;
    id?: string | number | null;
    shipTypeName?: string;
  },
  extras: {
    configState?: string;
    configMatched?: boolean;
    configId?: string | number | null;
    shipTypeName?: string;
    source?: string;
  } = {},
) => ({
  shape: baseConfig.shape ?? DEFAULT_SHIP_RENDER_CONFIG.shape,
  renderColor: baseConfig.renderColor ?? DEFAULT_SHIP_RENDER_CONFIG.renderColor,
  fillColor:
    baseConfig.fillColor ??
    baseConfig.renderColor ??
    DEFAULT_SHIP_RENDER_CONFIG.fillColor,
  strokeColor:
    baseConfig.strokeColor ??
    baseConfig.renderColor ??
    DEFAULT_SHIP_RENDER_CONFIG.strokeColor,
  outlineColor: baseConfig.outlineColor,
  configState: extras.configState ?? SHIP_RENDER_CONFIG_STATE.IDLE,
  configMatched: extras.configMatched ?? false,
  configId: extras.configId ?? null,
  shipTypeName: extras.shipTypeName ?? '',
  source: extras.source ?? 'default',
});

const buildDefaultResolvedConfig = (
  overrides: Parameters<typeof createResolvedConfig>[1] = {},
) =>
  createResolvedConfig(DEFAULT_SHIP_RENDER_CONFIG, {
    configMatched: false,
    source: 'default',
    ...overrides,
  });

export const resolveShipRenderConfig = (shipType: unknown) => {
  const { state, index } = getShipRenderConfigSnapshot();
  const typeNum = Number.parseInt(String(shipType ?? ''), 10);
  const normalizedType = Number.isInteger(typeNum) ? typeNum : 90;
  const match = index.get(normalizedType);

  if (match) {
    return createResolvedConfig(match, {
      configState: state,
      configMatched: true,
      configId: match.id,
      shipTypeName: match.shipTypeName,
      source: 'remote',
    });
  }

  return buildDefaultResolvedConfig({
    configState: state,
  });
};
