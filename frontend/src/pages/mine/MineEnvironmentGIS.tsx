import React, { useState, useEffect } from "react";
import { TreePine, Map, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import { api } from "../../services/api";
import { EnvironmentalReading } from "../../types";
import { MineGISMap } from "../../components/gis/MineGISMap";
import { DataTable } from "../../components/common/DataTable";
import { StatusBadge } from "../../components/common/StatusBadge";

export const MineEnvironmentGIS: React.FC = () => {
  const [readings, setReadings] = useState<EnvironmentalReading[]>([]);
  const [mapData, setMapData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnvAndMap = async () => {
      try {
        const [rRes, mRes] = await Promise.all([
          api.get("/mine/environment"),
          api.get("/mine/map"),
        ]);
        setReadings(rRes.data || []);
        setMapData(mRes.data || null);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchEnvAndMap();
  }, []);

  const columns = [
    {
      header: "Metric",
      accessor: "metric_name" as keyof EnvironmentalReading,
      render: (row: EnvironmentalReading) => (
        <span className="font-semibold text-slate-100">{row.metric_name}</span>
      ),
    },
    {
      header: "Live Telemetry Value",
      render: (row: EnvironmentalReading) => (
        <span
          className={`font-mono font-bold ${
            row.is_breach ? "text-red-400" : "text-emerald-400"
          }`}
        >
          {row.value} {row.unit}
        </span>
      ),
    },
    {
      header: "Statutory Threshold",
      render: (row: EnvironmentalReading) => (
        <span className="font-mono text-slate-400">
          {row.threshold_limit} {row.unit}
        </span>
      ),
    },
    {
      header: "Threshold Status",
      accessor: "status" as keyof EnvironmentalReading,
      render: (row: EnvironmentalReading) => (
        <StatusBadge status={row.is_breach ? "CRITICAL" : row.status} />
      ),
    },
    {
      header: "Location",
      accessor: "location_details" as keyof EnvironmentalReading,
      render: (row: EnvironmentalReading) => (
        <span className="text-xs text-slate-400">{row.location_details || "Pit Sensor"}</span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">
          GIS SPATIAL & SENSOR TELEMETRY
        </span>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-100 mt-0.5">
          Environmental Monitoring & Mine GIS Command
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time sensor telemetry, threshold breach detection, and spatial GIS mapping
        </p>
      </div>

      {/* Interactive Leaflet GIS Map */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
            <Map className="w-4 h-4 text-amber-400" />
            <span>Operational GIS Command Map</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Click any polygon or marker for operational details
          </span>
        </div>

        {mapData ? (
          <MineGISMap data={mapData} height="500px" />
        ) : (
          <div className="h-96 rounded-xl border border-slate-800 bg-[#0B0F17] flex items-center justify-center text-xs text-slate-500 font-mono">
            Loading Spatial GIS Layers...
          </div>
        )}
      </div>

      {/* Environmental Sensors Table */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
            <TreePine className="w-4 h-4 text-emerald-400" />
            <span>Continuous Environmental Telemetry</span>
          </h2>
          <span className="text-xs font-mono text-amber-400">
            {readings.filter((r) => r.is_breach).length} Threshold Breaches Detected
          </span>
        </div>

        <DataTable
          columns={columns}
          data={readings}
          searchKey="metric_name"
          searchPlaceholder="Filter environmental sensors..."
          loading={loading}
        />
      </div>
    </div>
  );
};
