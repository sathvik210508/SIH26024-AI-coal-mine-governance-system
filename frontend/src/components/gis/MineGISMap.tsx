import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface GISLayerData {
  mine: {
    id: number;
    name: string;
    center: [number, number];
    risk_tier: string;
    risk_score: number;
  };
  layers: {
    boundary: any;
    zones: any[];
    machinery: any[];
    incidents: any[];
    environmental: any[];
  };
}

export const MineGISMap: React.FC<{ data: GISLayerData; height?: string }> = ({
  data,
  height = "550px",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [activeLayers, setActiveLayers] = useState({
    boundary: true,
    zones: true,
    machinery: true,
    incidents: true,
    environmental: true,
  });

  useEffect(() => {
    if (!mapContainerRef.current || !data?.mine) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: data.mine.center || [24.1992, 82.6645],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old layers except tile layer
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) return;
      map.removeLayer(layer);
    });

    // 1. Mine Statutory Boundary
    if (activeLayers.boundary && data.layers.boundary) {
      L.geoJSON(data.layers.boundary, {
        style: {
          color: "#0F172A",
          weight: 2,
          dashArray: "6, 6",
          fillOpacity: 0.04,
          fillColor: "#0F172A",
        },
      })
        .bindPopup(`<b>Statutory Boundary:</b> ${data.mine.name}`)
        .addTo(map);
    }

    // 2. High-Risk / Working Zones
    if (activeLayers.zones && data.layers.zones) {
      data.layers.zones.forEach((z: any) => {
        const color = z.risk_tier === "HIGH" ? "#DC2626" : z.risk_tier === "MEDIUM" ? "#D97706" : "#16A34A";
        L.polygon(z.coordinates, {
          color,
          weight: 1.5,
          fillOpacity: 0.15,
          fillColor: color,
        })
          .bindPopup(
            `<b>Operational Zone:</b> ${z.name}<br/><b>Risk Tier:</b> ${z.risk_tier}<br/><b>Risk Index:</b> ${z.risk_score}`
          )
          .addTo(map);
      });
    }

    // 3. Heavy Machinery Telemetry
    if (activeLayers.machinery && data.layers.machinery) {
      data.layers.machinery.forEach((m: any) => {
        const iconColor = m.status === "ACTIVE" ? "#16A34A" : "#D97706";
        const customIcon = L.divIcon({
          className: "custom-gis-machinery",
          html: `<div style="background-color: ${iconColor}; width: 14px; height: 14px; border-radius: 3px; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
          iconSize: [14, 14],
        });

        L.marker(m.coordinates, { icon: customIcon })
          .bindPopup(
            `<b>Equipment:</b> ${m.name} (${m.code})<br/><b>Status:</b> ${m.status}<br/><b>Speed:</b> ${m.speed_kmh} km/h`
          )
          .addTo(map);
      });
    }

    // 4. Hazardous Incidents
    if (activeLayers.incidents && data.layers.incidents) {
      data.layers.incidents.forEach((inc: any) => {
        const customIcon = L.divIcon({
          className: "custom-gis-incident",
          html: `<div style="background-color: #DC2626; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">!</div>`,
          iconSize: [16, 16],
        });

        L.marker(inc.coordinates, { icon: customIcon })
          .bindPopup(
            `<b>Incident:</b> ${inc.title}<br/><b>Severity:</b> ${inc.severity}<br/><b>Date:</b> ${inc.date}`
          )
          .addTo(map);
      });
    }

    // 5. Environmental Sensors
    if (activeLayers.environmental && data.layers.environmental) {
      data.layers.environmental.forEach((env: any) => {
        const markerColor = env.is_breach ? "#DC2626" : "#2563EB";
        const customIcon = L.divIcon({
          className: "custom-gis-env",
          html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>`,
          iconSize: [12, 12],
        });

        L.marker(env.coordinates, { icon: customIcon })
          .bindPopup(
            `<b>Sensor:</b> ${env.node_id}<br/><b>CH4 (Methane):</b> ${env.ch4_pct}%<br/><b>CO:</b> ${env.co_ppm} ppm<br/><b>Breach:</b> ${env.is_breach ? "YES" : "NO"}`
          )
          .addTo(map);
      });
    }
  }, [data, activeLayers]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
      {/* Top Map Toolbar */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">GIS Operational Layers:</span>
          <span className="text-[11px] text-slate-500">Toggle spatial overlays</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveLayers((p) => ({ ...p, boundary: !p.boundary }))}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              activeLayers.boundary
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Lease Boundary
          </button>
          <button
            onClick={() => setActiveLayers((p) => ({ ...p, zones: !p.zones }))}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              activeLayers.zones
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Risk Zones
          </button>
          <button
            onClick={() => setActiveLayers((p) => ({ ...p, machinery: !p.machinery }))}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              activeLayers.machinery
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Heavy Machinery
          </button>
          <button
            onClick={() => setActiveLayers((p) => ({ ...p, incidents: !p.incidents }))}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              activeLayers.incidents
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Incidents
          </button>
          <button
            onClick={() => setActiveLayers((p) => ({ ...p, environmental: !p.environmental }))}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              activeLayers.environmental
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Sensors
          </button>
        </div>
      </div>

      {/* Map Element */}
      <div className="relative">
        <div ref={mapContainerRef} style={{ height, width: "100%" }} className="z-10" />

        {/* Floating Legend */}
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-2.5 shadow-md text-[11px] space-y-1.5 font-medium">
          <div className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
            Map Legend
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-600" />
            <span>High Risk Zone / Incident</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-600" />
            <span>Medium Risk / Warning</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
            <span>Active Machinery / Safe</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Telemetry Sensor Node</span>
          </div>
        </div>
      </div>
    </div>
  );
};
