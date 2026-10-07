import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  Crosshair, 
  Radio, 
  ShieldAlert, 
  Footprints, 
  AlertTriangle,
  Flame,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { SensorData, WorkerStatus, WorkerProfile } from '../types/sensors';

interface LiveMapProps {
  currentWorker: WorkerProfile;
  sensorData: SensorData;
  historyData: SensorData[];
  allWorkers: WorkerProfile[];
  allWorkersData: Record<string, SensorData>;
  onSelectWorker?: (id: string) => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  currentWorker,
  sensorData,
  historyData,
  allWorkers,
  allWorkersData,
  onSelectWorker,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const workerMarkerRef = useRef<L.Marker | null>(null);
  const dangerCircleRef = useRef<L.Circle | null>(null);
  const trailPolylineRef = useRef<L.Polyline | null>(null);
  const [showTrail, setShowTrail] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);
  const zonesLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center
    const centerLat = sensorData.latitude || 37.7785;
    const centerLng = sensorData.longitude || -122.4150;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 17,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark CartoDB tile layer with high-tech industrial aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    mapInstanceRef.current = map;

    // Layer group for zones
    const zonesGroup = L.layerGroup().addTo(map);
    zonesLayerGroupRef.current = zonesGroup;

    // Add industrial safety zones:
    // 1. Gas Risk Hazard Zone (Red)
    L.circle([37.7762, -122.4105], {
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.22,
      radius: 95,
      weight: 1.5,
      dashArray: '4, 4',
    })
      .bindPopup('<b>Zone 04: Cryogenic Gas Storage Vault</b><br/>High-risk volatile hydrocarbon sector. SCBA mandatory.')
      .addTo(zonesGroup);

    // 2. High-Temperature Blast Furnace Zone (Orange/Amber)
    L.circle([37.7812, -122.4115], {
      color: '#f59e0b',
      fillColor: '#f59e0b',
      fillOpacity: 0.2,
      radius: 110,
      weight: 1.5,
      dashArray: '4, 4',
    })
      .bindPopup('<b>Zone 02: Thermal Smelting & Blast Hall</b><br/>Radiant thermal danger zone (>45°C ambient).')
      .addTo(zonesGroup);

    // 3. Safe Muster Assembly Point Alpha (Green)
    L.circle([37.7735, -122.4165], {
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.25,
      radius: 80,
      weight: 2,
    })
      .bindPopup('<b>Safe Muster Point Alpha</b><br/>Primary emergency evacuation & triage rally station.')
      .addTo(zonesGroup);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Worker Marker, Trail, and Danger Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const lat = sensorData.latitude;
    const lng = sensorData.longitude;
    const isDanger = sensorData.status === 'DANGER';
    const isWarning = sensorData.status === 'WARNING';

    const markerColor = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

    // Custom HTML marker
    const customIcon = L.divIcon({
      className: 'custom-worker-marker',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${markerColor};
            opacity: 0.35;
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: #090e17;
            border: 2.5px solid ${markerColor};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.6);
            color: #fff;
            font-size: 11px;
            font-weight: bold;
          ">
            <span>${currentWorker.name.charAt(0)}</span>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (workerMarkerRef.current) {
      workerMarkerRef.current.setLatLng([lat, lng]);
      workerMarkerRef.current.setIcon(customIcon);
    } else {
      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #e2e8f0;">
          <div style="font-weight: bold; font-size: 13px; color: #fff; margin-bottom: 4px;">
            ${currentWorker.name} (${currentWorker.workerId})
          </div>
          <div>Jacket: <b>${currentWorker.jacketId}</b></div>
          <div>Status: <span style="color: ${markerColor}; font-weight: bold;">${sensorData.status}</span></div>
          <div>Motion: <b>${sensorData.motion}</b></div>
          <div>HR: <b>${sensorData.heartRate} bpm</b> | Temp: <b>${sensorData.temperature.toFixed(1)}°C</b></div>
          <div style="margin-top: 4px; font-size: 10px; color: #94a3b8;">GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
        </div>
      `);
      workerMarkerRef.current = marker;
    }

    // Danger Pulsing Circle
    if (isDanger) {
      if (dangerCircleRef.current) {
        dangerCircleRef.current.setLatLng([lat, lng]);
      } else {
        dangerCircleRef.current = L.circle([lat, lng], {
          radius: 50,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.35,
          weight: 2,
        }).addTo(map);
      }
    } else {
      if (dangerCircleRef.current) {
        dangerCircleRef.current.remove();
        dangerCircleRef.current = null;
      }
    }

    // Historical breadcrumb route trail
    if (showTrail && historyData.length > 1) {
      const trailPoints: L.LatLngTuple[] = historyData
        .slice(-25)
        .map((item) => [item.latitude, item.longitude]);

      if (trailPolylineRef.current) {
        trailPolylineRef.current.setLatLngs(trailPoints);
      } else {
        trailPolylineRef.current = L.polyline(trailPoints, {
          color: '#38bdf8',
          weight: 3,
          opacity: 0.8,
          dashArray: '3, 6',
        }).addTo(map);
      }
    } else if (!showTrail && trailPolylineRef.current) {
      trailPolylineRef.current.remove();
      trailPolylineRef.current = null;
    }
  }, [sensorData, currentWorker, historyData, showTrail]);

  // Handle Zones Visibility Toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !zonesLayerGroupRef.current) return;
    if (showZones) {
      if (!mapInstanceRef.current.hasLayer(zonesLayerGroupRef.current)) {
        mapInstanceRef.current.addLayer(zonesLayerGroupRef.current);
      }
    } else {
      if (mapInstanceRef.current.hasLayer(zonesLayerGroupRef.current)) {
        mapInstanceRef.current.removeLayer(zonesLayerGroupRef.current);
      }
    }
  }, [showZones]);

  const handleCenterOnWorker = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([sensorData.latitude, sensorData.longitude], 18, {
        duration: 1.2,
      });
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 lg:p-5 shadow-xl backdrop-blur-md space-y-3">
      {/* Header & Map Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white font-['Chakra_Petch',sans-serif] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Live Industrial Site GPS RTK Map
          </h3>
          <p className="text-xs text-slate-400">
            OpenStreetMap live geolocation &bull; Worker trail tracking & hazard geofencing
          </p>
        </div>

        {/* Map Action Buttons */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setShowTrail(!showTrail)}
            className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              showTrail
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Trail {showTrail ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowZones(!showZones)}
            className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              showZones
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Zones {showZones ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={handleCenterOnWorker}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition-all flex items-center gap-1.5"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Recenter</span>
          </button>
        </div>
      </div>

      {/* Map Display Frame */}
      <div className="relative w-full h-[380px] lg:h-[420px] rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Geo Status Pill */}
        <div className="absolute top-3 left-3 z-[400] bg-slate-950/90 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono shadow-2xl backdrop-blur-md flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-slate-200 font-semibold">{currentWorker.name}</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            {sensorData.latitude.toFixed(5)}°N, {sensorData.longitude.toFixed(5)}°W
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-bold">{sensorData.motion}</span>
        </div>

        {/* Legend Overlay at Bottom */}
        <div className="absolute bottom-3 left-3 z-[400] bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl text-[11px] font-mono shadow-2xl backdrop-blur-md flex flex-wrap items-center gap-3 text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>Gas Hazard Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Blast Furnace Thermal Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Muster Evacuation Point</span>
          </div>
        </div>
      </div>
    </div>
  );
};
