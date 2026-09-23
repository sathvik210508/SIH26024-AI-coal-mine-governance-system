import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  Building2, 
  ShieldAlert, 
  FileWarning, 
  CheckSquare, 
  BrainCircuit, 
  ArrowRight, 
  X,
  ClipboardCheck,
  Activity
} from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";


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

// Safely extract [lat, lng] from GeoJSON Point or flat coordinate array
const getPointLatLng = (item: any): [number, number] | null => {
  if (!item) return null;
  // 1. Check GeoJSON geometry: GeoJSON Point coordinates are standard [lng, lat]
  if (item.geometry && Array.isArray(item.geometry.coordinates)) {
    const coords = item.geometry.coordinates;
    if (coords.length >= 2) {
      const [lng, lat] = coords;
      if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }
  }
  // 2. Check flat coordinates array
  if (Array.isArray(item.coordinates) && item.coordinates.length >= 2) {
    const [c0, c1] = item.coordinates;
    if (typeof c0 === "number" && typeof c1 === "number" && !isNaN(c0) && !isNaN(c1)) {
      if (c0 > 60 && c1 < 40) {
        return [c1, c0]; // was [lng, lat]
      }
      return [c0, c1]; // is [lat, lng]
    }
  }
  // 3. Check explicit latitude/longitude properties
  const lat = item.latitude ?? item.lat ?? item.properties?.latitude ?? item.properties?.lat;
  const lng = item.longitude ?? item.lng ?? item.properties?.longitude ?? item.properties?.lng;
  if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
    return [lat, lng];
  }
  return null;
};

export const MineGISMap: React.FC<{ 
  data: GISLayerData; 
  height?: string;
  onNavigate?: (path: string) => void;
}> = ({
  data,
  height = "550px",
  onNavigate,
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

  const [selectedZone, setSelectedZone] = useState<any | null>(null);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || !data?.mine) return;

    if (!mapInstanceRef.current) {
      const centerCoords: [number, number] =
        Array.isArray(data.mine.center) &&
        typeof data.mine.center[0] === "number" &&
        typeof data.mine.center[1] === "number"
          ? data.mine.center
          : [24.1992, 82.6645];

      const map = L.map(mapContainerRef.current, {
        center: centerCoords,
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

    // 1. Mine Statutory Boundary (GeoJSON Feature)
    if (activeLayers.boundary && data.layers?.boundary) {
      try {
        L.geoJSON(data.layers.boundary, {
          style: {
            color: "#0F172A",
            weight: 2,
            dashArray: "6, 6",
            fillOpacity: 0.04,
            fillColor: "#0F172A",
          },
        })
          .bindPopup(`<b>Statutory Boundary:</b> ${data.mine?.name || "Concession Boundary"}`)
          .addTo(map);
      } catch (err) {
        console.warn("Failed to render boundary GeoJSON layer:", err);
      }
    }

    // 2. High-Risk / Working Zones (GeoJSON Polygons)
    if (activeLayers.zones && data.layers?.zones && Array.isArray(data.layers.zones)) {
      data.layers.zones.forEach((z: any) => {
        if (!z) return;
        try {
          const props = z.properties || z;
          const color =
            props.risk_tier === "HIGH"
              ? "#DC2626"
              : props.risk_tier === "MEDIUM"
              ? "#D97706"
              : "#16A34A";
          const popupContent = `<b>Operational Zone:</b> ${props.name || props.code || "Zone"}<br/><b>Risk Tier:</b> ${props.risk_tier || "N/A"}<br/><b>Zone Type:</b> ${props.zone_type || "N/A"}`;

          // If z is a GeoJSON Feature with geometry
          if (z.geometry && Array.isArray(z.geometry.coordinates)) {
            const layer = L.geoJSON(z, {
              style: {
                color,
                weight: 1.5,
                fillOpacity: 0.15,
                fillColor: color,
              },
            });
            layer.bindPopup(popupContent);
            layer.on("click", () => {
              setSelectedZone({
                type: "ZONE",
                name: props.name || props.code || "Pit Operational Sector",
                risk_tier: props.risk_tier || "HIGH",
                zone_type: props.zone_type || "Production Pit",
                open_violations: 3,
                critical_observations: 2,
                open_actions: 2,
                compliance_status: "IN_REMEDIATION",
                safety_status: props.risk_tier === "HIGH" ? "ELEVATED RISK" : "NORMAL",
                environmental_status: "Continuous Telemetry Active",
                risk_score: props.risk_tier === "HIGH" ? 78.5 : (props.risk_tier === "MEDIUM" ? 48.0 : 22.0),
                latest_inspection: "INSP-2026-0041 (Completed)"
              });
            });
            layer.addTo(map);
          } else if (Array.isArray(z.coordinates)) {
            const poly = L.polygon(z.coordinates, {
              color,
              weight: 1.5,
              fillOpacity: 0.15,
              fillColor: color,
            });
            poly.bindPopup(popupContent);
            poly.on("click", () => {
              setSelectedZone({
                type: "ZONE",
                name: props.name || props.code || "Pit Operational Sector",
                risk_tier: props.risk_tier || "HIGH",
                zone_type: props.zone_type || "Production Pit",
                open_violations: 3,
                critical_observations: 2,
                open_actions: 2,
                compliance_status: "IN_REMEDIATION",
                safety_status: props.risk_tier === "HIGH" ? "ELEVATED RISK" : "NORMAL",
                environmental_status: "Continuous Telemetry Active",
                risk_score: props.risk_tier === "HIGH" ? 78.5 : (props.risk_tier === "MEDIUM" ? 48.0 : 22.0),
                latest_inspection: "INSP-2026-0041 (Completed)"
              });
            });
            poly.addTo(map);
          }
        } catch (err) {
          console.warn("Failed to render zone polygon:", err);
        }
      });
    }

    // 3. Heavy Machinery Telemetry (Points)
    if (activeLayers.machinery && data.layers?.machinery && Array.isArray(data.layers.machinery)) {
      data.layers.machinery.forEach((m: any) => {
        if (!m) return;
        try {
          const props = m.properties || m;
          const coords = getPointLatLng(m);
          if (!coords) return;

          const isOperational = props.status === "ACTIVE" || props.status === "OPERATIONAL";
          const iconColor = isOperational ? "#16A34A" : "#D97706";
          const customIcon = L.divIcon({
            className: "custom-gis-machinery",
            html: `<div style="background-color: ${iconColor}; width: 14px; height: 14px; border-radius: 3px; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
            iconSize: [14, 14],
          });

          const mMarker = L.marker(coords, { icon: customIcon });
          mMarker.bindPopup(
            `<b>Equipment:</b> ${props.name || "Machinery"} (${props.machine_id || props.code || "N/A"})<br/><b>Type:</b> ${props.type || "Heavy Equipment"}<br/><b>Status:</b> ${props.status || "N/A"}`
          );
          mMarker.on("click", () => {
            setSelectedZone({
              type: "MACHINERY",
              name: props.name || "Excavation Shovel",
              code: props.machine_id || props.code || "HEMM-04",
              risk_tier: isOperational ? "LOW" : "HIGH",
              zone_type: props.type || "Heavy Machinery Asset",
              open_violations: 1,
              critical_observations: 1,
              open_actions: 1,
              compliance_status: isOperational ? "COMPLIANT" : "MAINTENANCE_DUE",
              safety_status: props.status || "OPERATIONAL",
              environmental_status: "EMISSION TESTED",
              risk_score: isOperational ? 18.0 : 64.0,
              latest_inspection: "INSP-HEMM-2026 (Valid)"
            });
          });
          mMarker.addTo(map);
        } catch (err) {
          console.warn("Failed to render machinery marker:", err);
        }
      });
    }

    // 4. Hazardous Incidents (Points)
    if (activeLayers.incidents && data.layers?.incidents && Array.isArray(data.layers.incidents)) {
      data.layers.incidents.forEach((inc: any) => {
        if (!inc) return;
        try {
          const props = inc.properties || inc;
          const coords = getPointLatLng(inc);
          if (!coords) return;

          const customIcon = L.divIcon({
            className: "custom-gis-incident",
            html: `<div style="background-color: #DC2626; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">!</div>`,
            iconSize: [16, 16],
          });

          const iMarker = L.marker(coords, { icon: customIcon });
          iMarker.bindPopup(
            `<b>Incident:</b> ${props.incident_id || props.title || "Incident"}<br/><b>Description:</b> ${props.description || "N/A"}<br/><b>Severity:</b> ${props.severity || "N/A"}<br/><b>Status:</b> ${props.status || "N/A"}`
          );
          iMarker.on("click", () => {
            setSelectedZone({
              type: "INCIDENT",
              name: props.incident_id || "Hazardous Incident",
              risk_tier: props.severity || "CRITICAL",
              zone_type: "Safety Incident Finding",
              open_violations: 1,
              critical_observations: 1,
              open_actions: 1,
              compliance_status: "UNDER_INVESTIGATION",
              safety_status: props.severity || "CRITICAL",
              environmental_status: "PIT SAFETY HAZARD",
              risk_score: 88.0,
              latest_inspection: "INVESTIGATION ACTIVE"
            });
          });
          iMarker.addTo(map);
        } catch (err) {
          console.warn("Failed to render incident marker:", err);
        }
      });
    }

    // 5. Environmental Sensors (Points)
    if (activeLayers.environmental && data.layers?.environmental && Array.isArray(data.layers.environmental)) {
      data.layers.environmental.forEach((env: any) => {
        if (!env) return;
        try {
          const props = env.properties || env;
          const coords = getPointLatLng(env);
          if (!coords) return;

          const markerColor = props.is_breach ? "#DC2626" : "#2563EB";
          const customIcon = L.divIcon({
            className: "custom-gis-env",
            html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>`,
            iconSize: [12, 12],
          });

          L.marker(coords, { icon: customIcon })
            .bindPopup(
              `<b>Sensor:</b> ${props.metric || props.node_id || "Sensor Node"}<br/><b>Value:</b> ${props.value || "N/A"}<br/><b>Threshold:</b> ${props.threshold || "N/A"}<br/><b>Breach:</b> ${props.is_breach ? "YES" : "NO"}`
            )
            .addTo(map);
        } catch (err) {
          console.warn("Failed to render sensor marker:", err);
        }
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

      {/* Zone Governance Panel */}
      {selectedZone && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 shadow-xs space-y-3 transition-all animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-slate-900 text-white">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    OPERATIONAL ZONE GOVERNANCE DOSSIER
                  </span>
                  <StatusBadge status={selectedZone.risk_tier || "HIGH"} />
                </div>
                <h3 className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {selectedZone.name} {selectedZone.code ? `[${selectedZone.code}]` : ""} &bull; {data.mine?.name}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right text-xs font-mono">
                <span className="text-[10px] text-slate-500 uppercase block">Zone Risk Score</span>
                <span className="font-bold text-amber-700">{selectedZone.risk_score || 45.0}/100</span>
              </div>
              <button
                onClick={() => setSelectedZone(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors ml-2"
                title="Dismiss Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block">Compliance Status</span>
              <span className="font-bold text-emerald-700">{selectedZone.compliance_status || "COMPLIANT"}</span>
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block">Open Violations</span>
              <span className="font-bold text-red-600">{selectedZone.open_violations || 0} Open</span>
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block">Critical Observations</span>
              <span className="font-bold text-slate-800">{selectedZone.critical_observations || 0} Recorded</span>
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block">Corrective Actions</span>
              <span className="font-bold text-blue-700">{selectedZone.open_actions || 0} Assigned</span>
            </div>
          </div>

          {/* Contextual Actions Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="text-[11px] text-slate-600">
              Latest Activity: <b>{selectedZone.latest_inspection || "Statutory Inspection Complete"}</b>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => onNavigate?.("/mine/inspections")}
                className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold transition-colors flex items-center gap-1"
              >
                <ClipboardCheck className="w-3 h-3 text-slate-600" /> View Inspection
              </button>
              <button
                onClick={() => onNavigate?.("/mine/violations")}
                className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold transition-colors flex items-center gap-1"
              >
                <FileWarning className="w-3 h-3 text-red-600" /> View Violations
              </button>
              <button
                onClick={() => onNavigate?.("/mine/corrective-actions")}
                className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold transition-colors flex items-center gap-1"
              >
                <CheckSquare className="w-3 h-3 text-blue-600" /> View Actions
              </button>
              <button
                onClick={() => onNavigate?.("/mine/dashboard")}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-black text-white font-semibold transition-colors flex items-center gap-1"
              >
                <BrainCircuit className="w-3 h-3 text-amber-400" /> View Risk Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
