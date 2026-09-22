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

    // 1. Boundary Polygon
    if (activeLayers.boundary && data.layers?.boundary?.geometry) {
      const coords = data.layers.boundary.geometry.coordinates[0].map((c: [number, number]) => [c[1], c[0]]);
      const boundaryPoly = L.polygon(coords, {
        color: "#F59E0B",
        weight: 2,
        fillColor: "#F59E0B",
        fillOpacity: 0.08,
        dashArray: "5, 5",
      }).addTo(map);

      boundaryPoly.bindPopup(`
        <div style="font-family: Inter, sans-serif; padding: 4px;">
          <b style="color: #D97706; font-size: 13px;">${data.layers.boundary.properties.name}</b>
          <p style="margin: 4px 0 0; font-size: 11px; color: #64748B;">Official Statutory Mining Lease Boundary</p>
          <span style="display:inline-block; margin-top:6px; font-size: 10px; font-weight: bold; padding: 2px 6px; background:#FEF3C7; color:#92400E; border-radius:4px;">STATUS: ACTIVE LEASE</span>
        </div>
      `);
    }

    // 2. Zone Polygons
    if (activeLayers.zones && data.layers?.zones) {
      data.layers.zones.forEach((z: any) => {
        if (!z.geometry) return;
        const coords = z.geometry.coordinates[0].map((c: [number, number]) => [c[1], c[0]]);
        const poly = L.polygon(coords, {
          color: z.properties.risk_tier === "HIGH" ? "#EF4444" : "#38BDF8",
          weight: 1.5,
          fillColor: z.properties.risk_tier === "HIGH" ? "#EF4444" : "#38BDF8",
          fillOpacity: 0.18,
        }).addTo(map);

        poly.bindPopup(`
          <div style="font-family: Inter, sans-serif;">
            <b style="color: #0F172A; font-size: 13px;">${z.properties.name}</b>
            <p style="margin: 4px 0; font-size: 11px; color: #475569;">Zone Type: <b>${z.properties.zone_type}</b></p>
            <p style="margin: 0; font-size: 11px; color: ${z.properties.risk_tier === 'HIGH' ? '#DC2626' : '#059669'}; font-weight: bold;">
              Risk Assessment: ${z.properties.risk_tier}
            </p>
          </div>
        `);
      });
    }

    // 3. Machinery
    if (activeLayers.machinery && data.layers?.machinery) {
      data.layers.machinery.forEach((m: any) => {
        const [lng, lat] = m.geometry.coordinates;
        const marker = L.circleMarker([lat, lng], {
          radius: 7,
          fillColor: m.properties.status === "CRITICAL" ? "#EF4444" : "#F59E0B",
          color: "#FFFFFF",
          weight: 1.5,
          fillOpacity: 0.9,
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: Inter, sans-serif;">
            <span style="font-size: 10px; font-weight: bold; color: #D97706;">MACHINE • ${m.properties.machine_id}</span>
            <h4 style="margin: 2px 0 4px; font-size: 13px; color: #0F172A;">${m.properties.name}</h4>
            <p style="margin: 0; font-size: 11px; color: #475569;">Status: <b>${m.properties.status}</b></p>
            <p style="margin: 2px 0 0; font-size: 11px; color: #475569;">Type: ${m.properties.type}</p>
          </div>
        `);
      });
    }

    // 4. Incidents
    if (activeLayers.incidents && data.layers?.incidents) {
      data.layers.incidents.forEach((inc: any) => {
        const [lng, lat] = inc.geometry.coordinates;
        const marker = L.circleMarker([lat, lng], {
          radius: 8,
          fillColor: "#DC2626",
          color: "#FFFFFF",
          weight: 2,
          fillOpacity: 0.95,
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: Inter, sans-serif;">
            <span style="font-size: 10px; font-weight: bold; color: #DC2626;">INCIDENT • ${inc.properties.incident_id}</span>
            <h4 style="margin: 2px 0 4px; font-size: 12px; color: #0F172A;">${inc.properties.type}</h4>
            <p style="margin: 0; font-size: 11px; color: #475569;">${inc.properties.description}</p>
            <span style="display:inline-block; margin-top:4px; font-size: 10px; font-weight: bold; padding: 2px 5px; background:#FEE2E2; color:#B91C1C; border-radius:3px;">
              SEVERITY: ${inc.properties.severity}
            </span>
          </div>
        `);
      });
    }

    // 5. Environmental Sensors
    if (activeLayers.environmental && data.layers?.environmental) {
      data.layers.environmental.forEach((s: any) => {
        const [lng, lat] = s.geometry.coordinates;
        const marker = L.circleMarker([lat, lng], {
          radius: 6,
          fillColor: s.properties.is_breach ? "#EF4444" : "#10B981",
          color: "#FFFFFF",
          weight: 1.5,
          fillOpacity: 0.9,
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: Inter, sans-serif;">
            <span style="font-size: 10px; font-weight: bold; color: #059669;">TELEMETRY SENSOR</span>
            <h4 style="margin: 2px 0 2px; font-size: 12px; color: #0F172A;">${s.properties.metric}</h4>
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: ${s.properties.is_breach ? '#DC2626' : '#059669'};">
              Value: ${s.properties.value} (Limit: ${s.properties.threshold})
            </p>
          </div>
        `);
      });
    }
  }, [data, activeLayers]);

  const toggleLayer = (layerName: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layerName]: !prev[layerName] }));
  };

  return (
    <div className="relative rounded-xl border border-slate-800 overflow-hidden bg-[#0A0E17] shadow-lg">
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height, width: "100%" }} />

      {/* Layer Control Floating Panel */}
      <div className="absolute top-3 right-3 z-[1000] bg-[#090D15]/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-lg shadow-xl text-xs space-y-2">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
          GIS Active Layers
        </div>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-amber-400">
            <input
              type="checkbox"
              checked={activeLayers.boundary}
              onChange={() => toggleLayer("boundary")}
              className="accent-amber-500 rounded"
            />
            <span>Mine Boundary</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-sky-400">
            <input
              type="checkbox"
              checked={activeLayers.zones}
              onChange={() => toggleLayer("zones")}
              className="accent-sky-500 rounded"
            />
            <span>Operational Zones</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-amber-400">
            <input
              type="checkbox"
              checked={activeLayers.machinery}
              onChange={() => toggleLayer("machinery")}
              className="accent-amber-500 rounded"
            />
            <span>Heavy Machinery</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-red-400">
            <input
              type="checkbox"
              checked={activeLayers.incidents}
              onChange={() => toggleLayer("incidents")}
              className="accent-red-500 rounded"
            />
            <span>Active Incidents</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-emerald-400">
            <input
              type="checkbox"
              checked={activeLayers.environmental}
              onChange={() => toggleLayer("environmental")}
              className="accent-emerald-500 rounded"
            />
            <span>Sensors & Telemetry</span>
          </label>
        </div>
        <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-amber-500/90 font-semibold">
          DEMO SPATIAL DATA
        </div>
      </div>
    </div>
  );
};
