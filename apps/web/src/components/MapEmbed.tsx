import React, { useEffect } from 'react';

interface MapEmbedProps {
  lat: number;
  lng: number;
  address: string;
  zoom?: number;
}

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Button from '@/components/ui/Button';

// Fix Leaflet marker icons issues with Webpack/Vite
// This handles the missing marker icon issue common in React Leaflet setups
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: string })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

interface MapEmbedProps {
  lat: number;
  lng: number;
  address: string;
  zoom?: number;
}

const MapEmbed: React.FC<MapEmbedProps> = ({ lat, lng, address, zoom = 15 }) => {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  return (
    <div className="relative w-full h-[320px] rounded-xl overflow-hidden shadow-lg border border-gray-100 z-0">
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <div className="text-sm font-medium">
              {address}
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Overlay Button for Directions */}
      <div className="absolute bottom-4 left-4 z-[400]">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="primary" size="sm" className="shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Como Chegar
          </Button>
        </a>
      </div>
    </div>
  );
};

export default MapEmbed;
