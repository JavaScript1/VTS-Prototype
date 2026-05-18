const REAL_SHIP_TOKEN_KEY = 'vts-prototype-token';

export const getRealShipToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = window.localStorage.getItem(REAL_SHIP_TOKEN_KEY);
  return token && token.trim() ? token : null;
};

export const setRealShipToken = (token: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(REAL_SHIP_TOKEN_KEY, token);
};

export const clearRealShipToken = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(REAL_SHIP_TOKEN_KEY);
};
