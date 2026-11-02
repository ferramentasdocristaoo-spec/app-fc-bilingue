import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { journeyBaseMap } from "@/features/bible-journey/map/base-map";
import { MAP_PX_PER_KM, fitViewBox, projectLonLat, type MapViewBox } from "@/features/bible-journey/map/projection";
import { journeyMapLabels, journeyPlaces, type JourneyPlace } from "@/features/bible-journey/places";
import type { JourneyStop } from "@/features/bible-journey/genesis-interactive";
import type { JourneyLanguage } from "@/features/bible-journey/types";

interface Props {
  stops: JourneyStop[];
  activeIndex: number;
  onSelect: (index: number) => void;
  language: JourneyLanguage;
  label: string;
}

interface MapPoint { index: number; place: JourneyPlace; x: number; y: number }

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Caixa a mostrar: o movimento inteiro se couber; senão aproxima na paragem atual e na anterior. */
function focusFor(points: MapPoint[], activeIndex: number): MapViewBox {
  const all = points.map(p => [p.x, p.y] as [number, number]);
  const whole = fitViewBox(all, 260);
  if (whole.width <= 720) return whole;
  const active = points.find(p => p.index === activeIndex) ?? points.filter(p => p.index < activeIndex).pop();
  if (!active) return whole;
  // Junta a paragem anterior (de onde se vem); na primeira, a seguinte (para onde se vai).
  const neighbour = points.filter(p => p.index < activeIndex && p.place.id !== active.place.id).pop()
    ?? points.find(p => p.index > activeIndex && p.place.id !== active.place.id);
  const focus: [number, number][] = [[active.x, active.y]];
  if (neighbour) focus.push([neighbour.x, neighbour.y]);
  return fitViewBox(focus, 140, 0.35);
}

export function JourneyMap({ stops, activeIndex, onSelect, language, label }: Props) {
  const { t } = useTranslation();
  const points = useMemo<MapPoint[]>(() => stops.flatMap((stop, index) => {
    const place = stop.placeId ? journeyPlaces[stop.placeId] : undefined;
    if (!place) return [];
    const [x, y] = projectLonLat(place.lon, place.lat);
    return [{ index, place, x, y }];
  }), [stops]);

  // Um marcador por lugar (paragens repetidas no mesmo sítio partilham o ponto).
  const markers = useMemo(() => {
    const byPlace = new Map<string, MapPoint[]>();
    points.forEach(point => byPlace.set(point.place.id, [...(byPlace.get(point.place.id) ?? []), point]));
    return [...byPlace.values()];
  }, [points]);

  const target = useMemo(() => focusFor(points, activeIndex), [points, activeIndex]);
  const [view, setView] = useState<MapViewBox>(target);
  const frame = useRef<number>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [renderedWidth, setRenderedWidth] = useState(600);
  useEffect(() => {
    const element = svgRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(entries => setRenderedWidth(entries[0].contentRect.width || 600));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    if (reducedMotion()) { setView(target); return; }
    const from = view; const start = performance.now(); const duration = 520;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / duration); const e = 1 - Math.pow(1 - k, 3);
      setView({ x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, width: from.width + (target.width - from.width) * e, height: from.height + (target.height - from.height) * e });
      if (k < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- anima a partir da vista atual
  }, [target]);

  // Escala: 1 unidade de texto = 1 px no ecrã, qualquer que seja o zoom e a largura do mapa.
  const s = view.width / Math.max(240, renderedWidth);
  const route = points.filter((point, i) => i === 0 || point.place.id !== points[i - 1].place.id);
  const legs = route.slice(1).map((point, i) => ({ from: route[i], to: point }));
  const activePoint = points.find(p => p.index === activeIndex);

  // Nomes: o ativo sempre; os outros só se não colidirem (≈ 26 px no ecrã) com um nome já posto.
  const named = new Set<string>();
  const placed: [number, number][] = [];
  const order = [...markers].sort((a, b) => Number(b.some(p => p.index === activeIndex)) - Number(a.some(p => p.index === activeIndex)) || a[0].index - b[0].index);
  for (const group of order) {
    const { x, y, place } = group[0];
    const free = placed.every(([px, py]) => Math.abs(px - x) > 70 * s || Math.abs(py - y) > 26 * s);
    if (free || group.some(p => p.index === activeIndex)) { named.add(place.id); placed.push([x, y]); }
  }

  const onKey = (event: KeyboardEvent, index: number) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(index); }
    if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); onSelect(Math.min(stops.length - 1, activeIndex + 1)); }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); onSelect(Math.max(0, activeIndex - 1)); }
  };

  return <svg ref={svgRef} className="jmap" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} role="group" aria-label={label} preserveAspectRatio="xMidYMid meet">
    <rect className="jmap-sea" x={0} y={0} width={journeyBaseMap.width} height={journeyBaseMap.height} />
    <path className="jmap-land" d={journeyBaseMap.land} fillRule="evenodd" />
    <path className="jmap-lake" d={journeyBaseMap.lakes} />
    {Object.entries(journeyBaseMap.rivers).map(([id, d]) => <path key={id} className="jmap-river" d={d} />)}

    <g aria-hidden>
      {journeyMapLabels.map(item => {
        const [x, y] = projectLonLat(item.lon, item.lat);
        return <text key={item.id} className={`jmap-label jmap-label-${item.kind}`} x={x} y={y} fontSize={12 * s} textAnchor="middle">{item.names[language]}</text>;
      })}
    </g>

    {markers.filter(group => group[0].place.areaKm).map(group => {
      const { place, x, y } = group[0];
      const r = (place.areaKm ?? 0) * MAP_PX_PER_KM;
      return <circle key={`area-${place.id}`} className={`jmap-area${place.confidence === "unknown" ? " is-unknown" : ""}`} cx={x} cy={y} r={r} />;
    })}

    <g aria-hidden>
      {legs.map(({ from, to }) => {
        const current = Boolean(activePoint) && to.index === activeIndex;
        const visited = !current && to.index <= activeIndex;
        return <line key={`${from.index}-${to.index}-${current ? "now" : ""}`} className={`jmap-leg${visited ? " is-visited" : ""}${current ? " is-current" : ""}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} pathLength={current ? 1 : undefined} strokeWidth={current ? 2.6 * s : undefined} />;
      })}
    </g>

    {markers.map(group => {
      const { place, x, y } = group[0];
      const indexes = group.map(p => p.index);
      const isActive = indexes.includes(activeIndex);
      const visited = indexes.some(i => i < activeIndex);
      const first = isActive ? activeIndex : indexes[0];
      const r = (isActive ? 9 : 7) * s;
      return <g key={place.id} className={`jmap-stop${isActive ? " is-active" : visited ? " is-visited" : ""}`}
        role="button" tabIndex={isActive || (!activePoint && group === markers[0]) ? 0 : -1} aria-label={`${indexes.map(i => i + 1).join(", ")}. ${place.names[language]} — ${t(`journey.confidence.${place.confidence}`)}`}
        aria-current={isActive ? "step" : undefined}
        onClick={() => onSelect(first)} onKeyDown={event => onKey(event, first)}>
        <circle cx={x} cy={y} r={r * 2.2} className="jmap-hit" />
        <circle cx={x} cy={y} r={r} className="jmap-dot" strokeDasharray={place.confidence === "debated" || place.confidence === "unknown" ? `${2 * s} ${1.5 * s}` : undefined} />
        <text x={x} y={y + 3.6 * s} fontSize={(isActive ? 10 : 9) * s} textAnchor="middle" className="jmap-dot-num">{first + 1}</text>
        {named.has(place.id) && <text x={x + r + 4 * s} y={y + 4 * s} fontSize={(isActive ? 14 : 12) * s} className="jmap-name">{place.names[language]}</text>}
      </g>;
    })}
  </svg>;
}
