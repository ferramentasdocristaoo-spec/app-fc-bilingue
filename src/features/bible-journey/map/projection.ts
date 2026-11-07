import { journeyBaseMap } from "./base-map";

/** Mesma projeção de scripts/journey-map/build_base_map.py (equirretangular com cos da latitude central). */
const { lonMin, lonMax, latMin, latMax } = journeyBaseMap.bounds;
const k = Math.cos(((latMin + latMax) / 2) * Math.PI / 180);
const scale = journeyBaseMap.width / ((lonMax - lonMin) * k);

export const MAP_WIDTH = journeyBaseMap.width;
export const MAP_HEIGHT = journeyBaseMap.height;
/** Pixels do mapa-base por quilómetro (aprox.: 1° de latitude ≈ 111 km). */
export const MAP_PX_PER_KM = scale / 111;

export function projectLonLat(lon: number, lat: number): [number, number] {
  return [(lon - lonMin) * k * scale, (latMax - lat) * scale];
}

export interface MapViewBox { x: number; y: number; width: number; height: number }

/** Caixa que enquadra os pontos com margem, na proporção do mapa e dentro dos limites. */
export function fitViewBox(points: [number, number][], minWidth = 220, padding = 0.28): MapViewBox {
  const ratio = MAP_HEIGHT / MAP_WIDTH;
  if (!points.length) return { x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT };
  const xs = points.map(p => p[0]); const ys = points.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  let width = Math.max(minWidth, (maxX - minX) * (1 + padding * 2), ((maxY - minY) * (1 + padding * 2)) / ratio);
  width = Math.min(width, MAP_WIDTH);
  const height = width * ratio;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const x = Math.min(Math.max(cx - width / 2, 0), MAP_WIDTH - width);
  const y = Math.min(Math.max(cy - height / 2, 0), MAP_HEIGHT - height);
  return { x, y, width, height };
}

export interface LabelBox { x1: number; y1: number; x2: number; y2: number }

/** Retângulo aproximado do nome à direita do ponto (largura média de 0,56 em por letra). */
export function labelBox(x: number, y: number, text: string, fontSize: number, radius: number, gap: number): LabelBox {
  const start = x + radius + gap;
  return { x1: start, x2: start + text.length * fontSize * 0.56, y1: y - fontSize * 0.75, y2: y + fontSize * 0.75 };
}

export const dotBox = (x: number, y: number, radius: number): LabelBox => ({ x1: x - radius, x2: x + radius, y1: y - radius, y2: y + radius });

export const boxesTouch = (a: LabelBox, b: LabelBox) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
