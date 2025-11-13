import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Dialog } from './Dialog';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapMarker {
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

interface MapData {
  title?: string;
  center: [number, number]; // [lat, lng]
  zoom?: number;
  markers: MapMarker[];
}

interface MapRendererProps {
  mapData: MapData;
}

// Component to handle map bounds when markers change
const MapBounds: React.FC<{ markers: MapMarker[] }> = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(
        markers.map(m => [m.lat, m.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [markers, map]);

  return null;
};

const MapRendererComponent: React.FC<MapRendererProps> = ({ mapData }) => {
  const { center, zoom = 10, markers } = mapData;

  // Validate data
  if (!center || !Array.isArray(center) || center.length !== 2) {
    return (
      <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p className="text-sm">⚠️ Invalid map data: center coordinates are required</p>
      </div>
    );
  }

  if (!markers || markers.length === 0) {
    return (
      <div className="my-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
        <p className="text-sm">⚠️ No markers available for map</p>
      </div>
    );
  }

  // Validate markers
  const validMarkers = markers.filter(m => 
    m.lat != null && 
    m.lng != null && 
    !isNaN(m.lat) && 
    !isNaN(m.lng) &&
    m.lat >= -90 && m.lat <= 90 &&
    m.lng >= -180 && m.lng <= 180
  );

  if (validMarkers.length === 0) {
    return (
      <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p className="text-sm">⚠️ No valid markers found. Markers must have valid lat/lng coordinates.</p>
      </div>
    );
  }

  // Calculate center from markers if not provided or if only one marker
  const mapCenter: [number, number] = validMarkers.length === 1
    ? [validMarkers[0].lat, validMarkers[0].lng]
    : center;

  const [isExpanded, setIsExpanded] = useState(false);

  // Component to force map resize when container size changes
  const MapResize: React.FC = () => {
    const map = useMap();
    useEffect(() => {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }, [map]);
    return null;
  };

  // Map component to be reused
  const MapContent: React.FC<{ height?: string; mapKey?: string }> = ({ height = '400px', mapKey }) => (
    <MapContainer
      key={mapKey}
      center={mapCenter}
      zoom={zoom}
      style={{ height: height, width: '100%' }}
      scrollWheelZoom={true}
      className="rounded-lg"
    >
      <MapResize />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        maxZoom={19}
      />
      {validMarkers.map((marker, index) => (
        <Marker
          key={index}
          position={[marker.lat, marker.lng]}
        >
          <Popup maxWidth={450} className="custom-popup">
            <div className="p-3 min-w-0">
              <div className="font-semibold text-gray-900 break-words">{marker.name}</div>
              {marker.description && (
                <div className="text-sm text-gray-600 mt-2 break-words whitespace-normal leading-relaxed">{marker.description}</div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      {validMarkers.length > 1 && <MapBounds markers={validMarkers} />}
    </MapContainer>
  );

  return (
    <>
      {!isExpanded && (
        <div className="my-4 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden relative">
          <button
            onClick={() => setIsExpanded(true)}
            className="absolute top-2 right-2 z-[1000] p-2 text-gray-600 hover:text-gray-900 hover:bg-white/90 rounded-lg transition-colors shadow-sm backdrop-blur-sm"
            title="Ingrandisci mappa"
            aria-label="Ingrandisci mappa"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" 
              />
            </svg>
          </button>
          <div className="w-full" style={{ height: '400px', minHeight: '300px' }}>
            <MapContent mapKey="normal" />
          </div>
        </div>
      )}

      {/* Expanded Map Dialog */}
      <Dialog 
        isOpen={isExpanded} 
        onClose={() => setIsExpanded(false)} 
        size="fullscreen"
        showCloseButton={true}
      >
        <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col w-full h-full max-w-[95vw] max-h-[95vh]">
          <div className="flex-1 w-full min-h-0 relative">
            <MapContent mapKey="expanded" height="100%" />
          </div>
        </div>
      </Dialog>
    </>
  );
};

// Memoize MapRenderer to prevent re-renders when props haven't changed
export const MapRenderer = React.memo(MapRendererComponent, (prevProps, nextProps) => {
  // Custom comparison function to prevent re-renders when data hasn't changed
  const prev = prevProps.mapData;
  const next = nextProps.mapData;
  
  // Compare primitive values
  if (
    prev.title !== next.title ||
    JSON.stringify(prev.center) !== JSON.stringify(next.center) ||
    prev.zoom !== next.zoom
  ) {
    return false; // Props changed, should re-render
  }
  
  // Compare markers array - deep comparison
  const prevMarkers = JSON.stringify(prev.markers || []);
  const nextMarkers = JSON.stringify(next.markers || []);
  if (prevMarkers !== nextMarkers) {
    return false; // Props changed, should re-render
  }
  
  // All props are equal, skip re-render
  return true;
});

