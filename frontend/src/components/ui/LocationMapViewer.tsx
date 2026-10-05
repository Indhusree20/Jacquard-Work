import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from './Button';
import { IUserLocation } from '../../types';

const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationMapViewerProps {
  location: IUserLocation;
  weaverName?: string;
  businessName?: string;
  phone?: string;
}

export const LocationMapViewer: React.FC<LocationMapViewerProps> = ({
  location,
  weaverName,
  businessName,
  phone
}) => {
  const { language } = useLanguage();
  const lat = location.lat || 11.6643;
  const lng = location.lng || 78.146;

  const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
      {/* Location Details Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <MapPin className="w-4 h-4 text-red-600 shrink-0" />
            <span>{businessName || weaverName || 'Loom Site'}</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 pl-5">
            {location.address}
            {location.landmark && `, ${location.landmark}`}
            {` — ${location.city}, ${location.district} - ${location.pincode}`}
          </p>
        </div>

        <a
          href={googleMapsNavUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-2xs transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>{language === 'ta' ? 'ஜிபிஎஸ் வழிசெலுத்தல் (Google Maps)' : 'Open GPS Navigation'}</span>
          <ExternalLink className="w-3 h-3 opacity-70" />
        </a>
      </div>

      {/* Embedded Map */}
      <div className="h-56 sm:h-64 w-full relative">
        <MapContainer center={[lat, lng]} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]} icon={customMarkerIcon}>
            <Popup>
              <div className="text-xs p-1">
                <strong>{businessName || weaverName || 'Loom Site'}</strong>
                <p className="mt-1">{location.address}</p>
                {phone && <p className="text-indigo-700 mt-1">📞 {phone}</p>}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};
