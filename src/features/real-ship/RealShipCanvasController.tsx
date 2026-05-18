import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import loongship from 'loongship-web';
import { useRealShips } from './useRealShips';

const SHIP_CANVAS_OPTIONS = {
  predictionLine: {
    show: true,
    timeMinutes: 1,
  },
  lod: {
    enable: false,
  },
  blink: {
    frequency: 2,
  },
};

export default function RealShipCanvasController() {
  const map = useMap();
  const layerRef = useRef<any>(null);
  const { error, ships } = useRealShips();

  useEffect(() => {
    const layer = loongship.shipCanvasLayer([], SHIP_CANVAS_OPTIONS);
    layer.addTo(map as any);
    layerRef.current = layer;

    return () => {
      layerRef.current = null;
      map.removeLayer(layer);
    };
  }, [map]);

  useEffect(() => {
    layerRef.current?.updateShips?.(ships);
  }, [ships]);

  useEffect(() => {
    if (error) {
      console.error('[real-ship] failed to load area ship list:', error);
    }
  }, [error]);

  return null;
}
