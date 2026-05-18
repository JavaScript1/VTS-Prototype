import { clearRealShipToken, getRealShipToken, setRealShipToken } from './token';
import { encryptPassword } from './crypto';

const DEFAULT_BASE_URL = 'https://test.shipdt.com/vts-gateway';
const LOGIN_USERNAME = 'vts-prototype';
const LOGIN_PASSWORD = 'P-0p-0p-0!';

const getViteEnv = () =>
  (import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env;

const getBaseUrl = () =>
  (getViteEnv()?.VITE_APP_INTELLIGENT_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');

const buildUrl = (path: string) => `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

let loginPromise: Promise<string> | null = null;

const readJsonSafely = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`接口返回了非 JSON 数据: ${text.slice(0, 120)}`);
  }
};

const extractToken = (payload: any) => {
  const token =
    payload?.token ??
    payload?.data?.token ??
    payload?.data?.accessToken ??
    payload?.accessToken;

  return typeof token === 'string' && token.trim() ? token : null;
};

const loginSilently = async () => {
  const encryptedPassword = await encryptPassword(LOGIN_PASSWORD);
  const response = await fetch(buildUrl('/vts-intelligent-assistance-server/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
    body: JSON.stringify({
      username: LOGIN_USERNAME,
      password: encryptedPassword,
      code: '',
      uuid: '',
    }),
  });

  const payload = await readJsonSafely(response);
  if (!response.ok) {
    throw new Error(payload?.msg || `静默登录失败(${response.status})`);
  }

  if (payload?.code && payload.code !== 200) {
    throw new Error(payload?.msg || `静默登录失败(${payload.code})`);
  }

  const token = extractToken(payload);
  if (!token) {
    throw new Error('静默登录成功，但响应中未找到 token。');
  }

  setRealShipToken(token);
  return token;
};

export const ensureRealShipToken = async () => {
  const storedToken = getRealShipToken();
  if (storedToken) {
    return storedToken;
  }

  if (!loginPromise) {
    loginPromise = loginSilently().finally(() => {
      loginPromise = null;
    });
  }

  return loginPromise;
};

type RequestOptions = {
  headers?: Record<string, string>;
  method?: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  retryOnUnauthorized?: boolean;
};

const withQuery = (
  path: string,
  params: RequestOptions['params'],
) => {
  const url = new URL(buildUrl(path));

  if (!params || Object.keys(params).length === 0) {
    return url.toString();
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
};

export const requestJson = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const {
    headers,
    method = 'GET',
    params,
    retryOnUnauthorized = true,
  } = options;

  const token = await ensureRealShipToken();
  const response = await fetch(withQuery(path, params), {
    method,
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      Authorization: `Bearer ${token}`,
      ...headers,
    },
  });

  if (response.status === 401 && retryOnUnauthorized) {
    clearRealShipToken();
    await ensureRealShipToken();
    return requestJson<T>(path, {
      ...options,
      retryOnUnauthorized: false,
    });
  }

  const payload = await readJsonSafely(response);

  if (payload?.code === 401 && retryOnUnauthorized) {
    clearRealShipToken();
    await ensureRealShipToken();
    return requestJson<T>(path, {
      ...options,
      retryOnUnauthorized: false,
    });
  }

  if (!response.ok) {
    throw new Error(payload?.msg || `接口请求失败(${response.status})`);
  }

  if (payload?.code && payload.code !== 200) {
    throw new Error(payload?.msg || `接口返回异常(${payload.code})`);
  }

  return payload as T;
};
