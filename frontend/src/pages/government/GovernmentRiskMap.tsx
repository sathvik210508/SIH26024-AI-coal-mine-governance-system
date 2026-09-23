import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ShieldAlert, RefreshCw, AlertTriangle, Building2, MapPin } from "lucide-react";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";

export const GovernmentRiskMap: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMine, setSelectedMine] = useState<any | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/government/risk-map");
      setData(res.data);
      if (res.data?.mines?.length > 0 && !selectedMine) {
        setSelectedMine(res.data.mines[0]);
      }
    } catch (err) {
      console.error("Failed to load national risk map:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || !data?.mines) return;

    if (!mapInstanceRef.current) {
      // Center roughly over eastern/central India coal belt (Lat 23.5, Lng 83.5)
      const map = L.map(mapContainerRef.current, {
        center: [23.5, 83.5],
        zoom: 6,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 14,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) return;
      map.removeLayer(layer);
    });

    // Add markers for all 6 mines
    data.mines.forEach((m: any) => {
      if (!m) return;
      try {
        const rawCoords = Array.isArray(m.coordinates)
          ? m.coordinates
          : [m.latitude, m.longitude];
        let lat = typeof rawCoords?.[0] === "number" && !isNaN(rawCoords[0]) ? rawCoords[0] : 23.5;
        let lng = typeof rawCoords?.[1] === "number" && !isNaN(rawCoords[1]) ? rawCoords[1] : 83.5;

        // If longitude and latitude were inverted in raw data
        if (lat > 60 && lng < 40) {
          const temp = lat;
          lat = lng;
          lng = temp;
        }

        const isCritical = m.risk_tier === "CRITICAL";
        const isHigh = m.risk_tier === "HIGH";

        const markerColor = isCritical ? "#DC2626" : isHigh ? "#EA580C" : "#10B981";

        const marker = L.circleMarker([lat, lng], {
          radius: isCritical ? 11 : 9,
          fillColor: markerColor,
          color: "#FFFFFF",
          weight: 2,
          fillOpacity: 0.9,
        }).addTo(map);

        marker.bindTooltip(`<b>${m.name || "Mine"}</b><br/>Risk Score: ${m.risk_score ?? "N/A"} (${m.risk_tier || "N/A"})`, {
          direction: "top",
          className: "leaflet-custom-tooltip",
        });

        marker.on("click", () => {
          setSelectedMine(m);
        });
      } catch (err) {
        console.warn("Failed to render mine marker on national risk map:", err);
      }
    });
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              National Coal Operations Risk & Spatial GIS Command
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
              National Surveillance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time geospatial risk clustering, regional compliance indices, and critical violation hotspots across Indian coalfields.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
            title="Refresh Map"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main GIS & Mine Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Container (2 Cols) */}
        <div className="lg:col-span-2 relative rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs min-h-[500px]">
          <div ref={mapContainerRef} style={{ height: "550px", width: "100%" }} />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md border border-slate-200 p-3.5 rounded-xl shadow-lg text-xs space-y-1.5 font-sans">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              National Risk Classification
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 border border-white shadow-xs" />
              <span className="text-slate-700 font-medium">CRITICAL Risk (Score &ge; 70)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-xs" />
              <span className="text-slate-700 font-medium">HIGH Risk (Score 50&ndash;69)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white shadow-xs" />
              <span className="text-slate-700 font-medium">LOW / MODERATE (Score &lt; 50)</span>
            </div>
          </div>
        </div>

        {/* Selected Mine Inspector Panel (1 Col) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-600" />
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Operation Intelligence
                </h3>
              </div>
              {selectedMine && <StatusBadge status={selectedMine.risk_tier} />}
            </div>

            {selectedMine ? (
              <div className="mt-4 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selectedMine.name}</h2>
                  <div className="text-xs text-slate-500 mt-0.5">{selectedMine.organization}</div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    Geo: {selectedMine.coordinates?.[0]?.toFixed(4)}, {selectedMine.coordinates?.[1]?.toFixed(4)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">AI Risk Score</div>
                    <div className="text-lg font-mono font-bold text-rose-700 mt-0.5">
                      {selectedMine.risk_score}
                      <span className="text-xs text-slate-400 font-normal"> / 100</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Compliance</div>
                    <div className="text-lg font-mono font-bold text-emerald-700 mt-0.5">
                      {selectedMine.compliance_score}%
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Critical Violations:</span>
                    <span className="font-mono font-bold text-rose-700">{selectedMine.critical_violations}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Total Open Violations:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedMine.open_violations}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Surveillance Status:</span>
                    <span className="font-mono font-semibold text-amber-700">ACTIVE ENFORCEMENT</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 font-mono">
                Click any mine marker on the map to inspect telemetry, risk metrics, and violation logs.
              </div>
            )}
          </div>

          {selectedMine && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <a
                href="#/government/regulatory-actions"
                className="w-full py-2.5 px-3 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Issue Directive to Mine</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
