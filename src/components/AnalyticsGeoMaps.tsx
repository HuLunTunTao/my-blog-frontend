import type { AnalyticsLocationStat } from "@/lib/api";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { feature } from "topojson-client";
import worldAtlas from "world-atlas/countries-110m.json";
import chinaMapGeo from "china-map-geojson/lib/china";
import type { Feature, FeatureCollection, Geometry } from "geojson";

type MapFeature = Feature<Geometry, { name?: string; id?: string | number }>;
type MapFeatureCollection = FeatureCollection<Geometry, { name?: string; id?: string | number }>;

const worldGeographies = feature(
  worldAtlas as unknown as {
    type: "Topology";
    objects: { countries: { type: string } };
    arcs: number[][][];
    transform: { scale: [number, number]; translate: [number, number] };
  },
  (worldAtlas as unknown as { objects: { countries: { type: string } } }).objects.countries,
) as MapFeatureCollection;

function clampOpacity(value: number) {
  return Math.max(0.18, Math.min(0.92, value));
}

function normalizeCountryName(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
}

function normalizeChinaRegionName(raw: string): string {
  const value = raw.trim();
  const map: Record<string, string> = {
    Beijing: "北京",
    Shanghai: "上海",
    Guangdong: "广东",
    Zhejiang: "浙江",
    Jiangsu: "江苏",
    Sichuan: "四川",
    Fujian: "福建",
    Hubei: "湖北",
    Hunan: "湖南",
    Shandong: "山东",
    Henan: "河南",
    Hebei: "河北",
    Shaanxi: "陕西",
    Liaoning: "辽宁",
    InnerMongolia: "内蒙古",
  };
  return map[value] || value.replace(/省|市|自治区|特别行政区/g, "");
}

const countryNameAliases: Record<string, string[]> = {
  US: ["united states", "united states of america", "usa"],
  GB: ["united kingdom", "uk", "great britain"],
  RU: ["russia", "russian federation"],
  KR: ["south korea", "republic of korea"],
  KP: ["north korea", "democratic people's republic of korea"],
  TW: ["taiwan", "taiwan province of china"],
  VN: ["vietnam", "viet nam"],
  SY: ["syria", "syrian arab republic"],
  LA: ["laos", "lao people's democratic republic"],
  TZ: ["tanzania", "united republic of tanzania"],
  VE: ["venezuela", "venezuela, bolivarian republic of"],
  BO: ["bolivia", "bolivia, plurinational state of"],
  IR: ["iran", "iran, islamic republic of"],
  MD: ["moldova", "moldova, republic of"],
  BN: ["brunei", "brunei darussalam"],
  CZ: ["czechia", "czech republic"],
};

function buildWorldLocationMap(items: AnalyticsLocationStat[]) {
  const byCode = new Map(items.map((item) => [item.code.toUpperCase(), item]));
  const byName = new Map<string, AnalyticsLocationStat>();
  for (const item of items) {
    const normalized = normalizeCountryName(item.name || item.code);
    byName.set(normalized, item);
    for (const alias of countryNameAliases[item.code.toUpperCase()] || []) {
      byName.set(normalizeCountryName(alias), item);
    }
  }
  return { byCode, byName };
}

function LegendList({ items, formatter }: { items: AnalyticsLocationStat[]; formatter?: (item: AnalyticsLocationStat) => string }) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {items.slice(0, 10).map((item) => (
        <div key={`${item.code}-${item.name}`} className="flex items-center justify-between border border-stone-200 bg-stone-50/70 px-3 py-2 text-sm">
          <span className="truncate pr-4">{formatter ? formatter(item) : item.name}</span>
          <span className="font-medium text-stone-700">{item.totalRequests}</span>
        </div>
      ))}
    </div>
  );
}

export function WorldMap({ items }: { items: AnalyticsLocationStat[] }) {
  const { byCode, byName } = buildWorldLocationMap(items);
  const maxValue = Math.max(1, ...items.map((item) => item.totalRequests), 1);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden border border-stone-200 bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.10),transparent_35%),linear-gradient(180deg,#fafaf9_0%,#f5f5f4_100%)]">
        <ComposableMap projection="geoMercator" projectionConfig={{ scale: 135 }} width={860} height={400} style={{ width: "100%", height: "auto" }}>
          <Geographies geography={worldGeographies}>
            {({ geographies }: { geographies: MapFeature[] }) =>
              geographies.map((geo: MapFeature, index: number) => {
                const rawId = String(geo.id ?? geo.properties?.id ?? "").trim();
                const geoName = String(geo.properties?.name ?? "").trim();
                const item = byCode.get(rawId.toUpperCase()) || byName.get(normalizeCountryName(geoName));
                const fill = item ? `rgba(180, 83, 9, ${clampOpacity(item.totalRequests / maxValue)})` : "#f5f5f4";
                return (
                  <Geography
                    key={`world-${rawId || geoName || index}`}
                    geography={geo}
                    style={{
                      default: { fill, stroke: item?.code === "CN" ? "#7c2d12" : "#d6d3d1", strokeWidth: item?.code === "CN" ? 1.2 : 0.7, outline: "none" },
                      hover: { fill, stroke: "#7c2d12", strokeWidth: 1.2, outline: "none" },
                      pressed: { fill, stroke: "#7c2d12", strokeWidth: 1.2, outline: "none" },
                    }}
                  >
                    <title>{item ? `${item.name}: ${item.totalRequests}` : (geoName || rawId)}</title>
                  </Geography>
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
      <LegendList items={items} />
    </div>
  );
}

export function ChinaMap({ items }: { items: AnalyticsLocationStat[] }) {
  const normalized = items.map((item) => ({ ...item, normalizedName: normalizeChinaRegionName(item.name || item.code) }));
  const valueMap = new Map(normalized.map((item) => [item.normalizedName, item]));
  const maxValue = Math.max(1, ...normalized.map((item) => item.totalRequests), 1);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden border border-stone-200 bg-stone-50/80 p-3">
        <ComposableMap projection="geoMercator" projectionConfig={{ center: [104, 36], scale: 540 }} width={700} height={430} style={{ width: "100%", height: "auto" }}>
          <Geographies geography={chinaMapGeo as unknown as MapFeatureCollection}>
            {({ geographies }: { geographies: MapFeature[] }) =>
              geographies.map((geo: MapFeature, index: number) => {
                const name = normalizeChinaRegionName(String(geo.properties?.name ?? geo.id ?? ""));
                const item = valueMap.get(name);
                const fill = item ? `rgba(180, 83, 9, ${clampOpacity(item.totalRequests / maxValue)})` : "#f5f5f4";
                return (
                  <Geography
                    key={`china-${name || index}`}
                    geography={geo}
                    style={{
                      default: { fill, stroke: item ? "#92400e" : "#d6d3d1", strokeWidth: 0.8, outline: "none" },
                      hover: { fill, stroke: "#7c2d12", strokeWidth: 1.1, outline: "none" },
                      pressed: { fill, stroke: "#7c2d12", strokeWidth: 1.1, outline: "none" },
                    }}
                  >
                    <title>{`${name}: ${item?.totalRequests ?? 0}`}</title>
                  </Geography>
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
      <LegendList items={normalized} formatter={(item) => item.name} />
    </div>
  );
}

export default function AnalyticsGeoMapsSection({
  countryLocations,
  chinaLocations,
}: {
  countryLocations: AnalyticsLocationStat[];
  chinaLocations: AnalyticsLocationStat[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="border border-stone-200/70 bg-white/88 p-5 shadow-[0_24px_80px_rgba(120,113,108,0.09)]">
        <div className="mb-4">
          <h2 className="text-lg font-serif text-stone-900">Global IP Origins</h2>
          <p className="mt-1 text-sm text-stone-500">Country-level concentration, with full country-name matching instead of a partial hardcoded code list.</p>
        </div>
        <WorldMap items={countryLocations} />
      </section>
      <section className="border border-stone-200/70 bg-white/88 p-5 shadow-[0_24px_80px_rgba(120,113,108,0.09)]">
        <div className="mb-4">
          <h2 className="text-lg font-serif text-stone-900">China Region Origins</h2>
          <p className="mt-1 text-sm text-stone-500">Province-level heat map, lazily loaded so it no longer blocks the rest of the dashboard.</p>
        </div>
        <ChinaMap items={chinaLocations} />
      </section>
    </div>
  );
}
