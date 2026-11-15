import { useState } from "react";
import {
  Globe3D,
  type GlobeMarker,
} from "@/components/ui/3d-globe";

const groundStationMarkers: GlobeMarker[] = [
  { lat: 12.9716, lng: 77.5946, src: "/ground-station-marker.svg", label: "Bengaluru Gateway" },
  { lat: 28.6139, lng: 77.209, src: "/ground-station-marker.svg", label: "New Delhi Gateway" },
  { lat: 1.3521, lng: 103.8198, src: "/ground-station-marker.svg", label: "Singapore Gateway" },
  { lat: 51.5074, lng: -0.1278, src: "/ground-station-marker.svg", label: "London Gateway" },
  { lat: 35.6762, lng: 139.6503, src: "/ground-station-marker.svg", label: "Tokyo Gateway" },
  { lat: 40.7128, lng: -74.006, src: "/ground-station-marker.svg", label: "New York Gateway" },
  { lat: -33.8688, lng: 151.2093, src: "/ground-station-marker.svg", label: "Sydney Gateway" },
];

export default function SatelliteGlobe() {
  const [selectedMarker, setSelectedMarker] = useState<GlobeMarker | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  return (
    <div className="relative h-[440px] w-full overflow-hidden bg-[#030303]/60 border border-white/14">
      {/* Corner crosshairs for brutalist aerospace look */}
      <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-white/40 pointer-events-none z-10" />
      <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-white/40 pointer-events-none z-10" />

      <Globe3D
        markers={groundStationMarkers}
        satellite={{ orbitRadius: 1.48, speed: 0.35, inclination: 0.5 }}
        className="h-full w-full"
        config={{
          globeColor: "#030303",
          atmosphereColor: "#38bdf8",
          atmosphereIntensity: 12,
          bumpScale: 5,
          autoRotateSpeed: 0.25,
          showAtmosphere: true,
          enableZoom: true,
          enablePan: false,
          minDistance: 2.5,
          maxDistance: 5,
          ambientIntensity: 1.1,
          pointLightIntensity: 1.4,
          backgroundColor: null,
        }}
        onMarkerClick={(marker) => setSelectedMarker(marker)}
        onMarkerHover={(marker) => setHoveredMarker(marker?.label ?? null)}
      />

      {/* Selected Node Telemetry Floating Glass Panel */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-10">
        {selectedMarker ? (
          <div className="glass-panel p-3 border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#777777] font-bold block">
              TARGET NODE // TELEMETRY
            </span>
            <h3 className="mt-1 text-xs font-bold text-white uppercase tracking-wider">
              {selectedMarker.label}
            </h3>
            <p className="mt-0.5 text-[11px] text-[#B8B8B8]">
              COORDINATES: {selectedMarker.lat.toFixed(4)}°N / {selectedMarker.lng.toFixed(4)}°E
            </p>
          </div>
        ) : (
          <div className="glass-surface px-3 py-1.5 text-[10px] text-[#777777] uppercase tracking-wider font-semibold border border-white/10">
            Click gateway node to inspect coordinates
          </div>
        )}
      </div>

      {/* Hovered Marker Tooltip */}
      {hoveredMarker && (
        <div className="pointer-events-none absolute right-4 top-4 z-10 glass-panel px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wider border border-white/25">
          {hoveredMarker}
        </div>
      )}

      {/* Network Status Badge */}
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 glass-surface px-3 py-1.5 border border-white/14">
        <span className="h-1.5 w-1.5 bg-white animate-pulse" />
        <span className="text-[10px] uppercase tracking-widest text-white font-bold">
          7 NETWORK NODES ONLINE
        </span>
      </div>
    </div>
  );
}
