import { useEffect, useState } from 'react';
import { getAreaShipList } from './api';
import { adaptRealShipsToCanvasShips } from './adapters';
import { loadShipRenderConfigs } from './shipRenderConfigRepository';
import type { RealShipCanvasRecord } from './types';

const HOME_REAL_SHIP_AREA_ID = 142;
const HOME_REAL_SHIP_REFRESH_INTERVAL = 1000;

type UseRealShipsState = {
  error: string | null;
  loading: boolean;
  ships: RealShipCanvasRecord[];
};

export const useRealShips = () => {
  const [state, setState] = useState<UseRealShipsState>({
    error: null,
    loading: true,
    ships: [],
  });

  useEffect(() => {
    let active = true;
    let timerId: number | null = null;

    const loadShips = async (isInitial = false) => {
      if (isInitial) {
        setState((current) => ({
          ...current,
          error: null,
          loading: true,
        }));
      }

      try {
        const rawShips = await getAreaShipList(HOME_REAL_SHIP_AREA_ID);
        if (!active) return;

        setState({
          error: null,
          loading: false,
          ships: adaptRealShipsToCanvasShips(rawShips),
        });
      } catch (error) {
        if (!active) return;

        const message = error instanceof Error ? error.message : '接口船舶加载失败';
        setState((current) => ({
          ...current,
          error: message,
          loading: false,
          ships: isInitial ? [] : current.ships,
        }));
      }
    };

    const bootstrap = async () => {
      try {
        await loadShipRenderConfigs();
        if (!active) return;

        await loadShips(true);
        if (!active) return;

        timerId = window.setInterval(() => {
          void loadShips(false);
        }, HOME_REAL_SHIP_REFRESH_INTERVAL);
      } catch (error) {
        if (!active) return;

        const message =
          error instanceof Error ? error.message : '船型配置加载失败';
        setState((current) => ({
          ...current,
          error: message,
          loading: false,
        }));
      }
    };

    void bootstrap();

    return () => {
      active = false;
      if (timerId !== null) {
        window.clearInterval(timerId);
      }
    };
  }, []);

  return state;
};
