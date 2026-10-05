import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Compass } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { districtApi } from '../../api/districtApi';
import { IDistrict } from '../../types';

// Fix Leaflet marker icon issue in bundlers
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export interface LocationData {
  address: string;
  landmark?: string;
  city: string;
  district: string;
  pincode: string;
  state: string;
  lat: number;
  lng: number;
}

interface LocationMapPickerProps {
  value: LocationData;
  onChange: (data: LocationData) => void;
}

// Approximate fallback coordinates for TN districts if user clicks quick chip
const DISTRICT_COORDS: Record<string, { lat: number; lng: number; pin: string }> = {
  Salem: { lat: 11.6643, lng: 78.146, pin: '636001' },
  Kanchipuram: { lat: 12.8342, lng: 79.7036, pin: '631501' },
  Erode: { lat: 11.341, lng: 77.7172, pin: '638001' },
  Coimbatore: { lat: 11.0168, lng: 76.9558, pin: '641001' },
  Tiruppur: { lat: 11.1085, lng: 77.3411, pin: '641601' },
  Namakkal: { lat: 11.2189, lng: 78.1674, pin: '637001' },
  Karur: { lat: 10.9601, lng: 78.0766, pin: '639001' },
  Dindigul: { lat: 10.3673, lng: 77.9803, pin: '624001' },
  Madurai: { lat: 9.9252, lng: 78.1198, pin: '625001' },
  Tiruchirappalli: { lat: 10.7905, lng: 78.7047, pin: '620001' }
};

function LocationMarker({ position, setPosition }: { position: [number, number]; setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    }
  });

  return position === null ? null : (
    <Marker position={position} icon={customMarkerIcon} />
  );
}

export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({ value, onChange }) => {
  const { language } = useLanguage();
  const [activeDistricts, setActiveDistricts] = useState<IDistrict[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([value.lat || 11.6643, value.lng || 78.146]);
  const [position, setPosition] = useState<[number, number]>([value.lat || 11.6643, value.lng || 78.146]);

  // 1. Fetch only Admin Active Districts (Dynamic source of truth)
  useEffect(() => {
    const fetchActiveDistricts = async () => {
      try {
        const res = await districtApi.getActiveDistricts();
        if (res.success && res.data?.districts) {
          setActiveDistricts(res.data.districts);
          // If current district is empty or not in active list and active districts exist, set default
          if (!value.district && res.data.districts.length > 0) {
            const first = res.data.districts[0];
            const nameEn = first.name.en;
            const coords = DISTRICT_COORDS[nameEn] || { lat: 11.6643, lng: 78.146, pin: '636001' };
            onChange({
              ...value,
              district: nameEn,
              city: value.city || nameEn,
              pincode: value.pincode || coords.pin,
              lat: value.lat || coords.lat,
              lng: value.lng || coords.lng
            });
          }
        }
      } catch (err) {
        console.error('Error loading active districts for location picker:', err);
      }
    };
    fetchActiveDistricts();
  }, []);

  useEffect(() => {
    if (value.lat && value.lng && (value.lat !== position[0] || value.lng !== position[1])) {
      setPosition([value.lat, value.lng]);
      setMapCenter([value.lat, value.lng]);
    }
  }, [value.lat, value.lng]);

  const handlePositionChange = (pos: [number, number]) => {
    setPosition(pos);
    onChange({
      ...value,
      lat: parseFloat(pos[0].toFixed(5)),
      lng: parseFloat(pos[1].toFixed(5))
    });
  };

  const handleDistrictSelect = (districtNameEn: string) => {
    const coords = DISTRICT_COORDS[districtNameEn] || { lat: 11.6643, lng: 78.146, pin: '636001' };
    setMapCenter([coords.lat, coords.lng]);
    handlePositionChange([coords.lat, coords.lng]);
    onChange({
      ...value,
      district: districtNameEn,
      city: value.city ? value.city : districtNameEn,
      pincode: value.pincode ? value.pincode : coords.pin,
      lat: coords.lat,
      lng: coords.lng
    });
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMapCenter([lat, lng]);
          handlePositionChange([lat, lng]);
        },
        (err) => {
          console.warn('Geolocation failed:', err.message);
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Tamil Nadu Cluster Presets (Active Districts from Admin only) */}
      {activeDistricts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-700" />
              {language === 'ta'
                ? 'செயலில் உள்ள கைத்தறி மண்டலங்கள் (Admin Active Districts)'
                : 'Active Handloom Clusters (Admin Active Districts)'}
            </label>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1"
            >
              <Navigation className="w-3.5 h-3.5" />
              {language === 'ta' ? 'தற்போதைய ஜிபிஎஸ் இடம்' : 'Use Current GPS'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeDistricts.map((dist) => {
              const isSelected = value.district === dist.name.en;
              return (
                <button
                  key={dist._id}
                  type="button"
                  onClick={() => handleDistrictSelect(dist.name.en)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-indigo-900 text-white border-indigo-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {dist.name[language] || dist.name.en} ({dist.name.en})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Map Picker */}
      <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-red-600" />
            {language === 'ta'
              ? 'வரைபடத்தில் தறி பட்டறை இருக்கும் இடத்தை கிளிக் செய்யவும்'
              : 'Click on map to pin precise loom workshop location'}
          </span>
          <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
            {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </span>
        </div>
        <div className="h-64 sm:h-72 w-full">
          <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={handlePositionChange} />
          </MapContainer>
        </div>
      </div>

      {/* Address Details Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
        {/* District Selection - Purely Dynamic from Admin */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {language === 'ta' ? 'மாவட்டம் (District - Admin Active Only) *' : 'District (Admin Active Districts) *'}
          </label>
          <select
            required
            value={value.district || ''}
            onChange={(e) => handleDistrictSelect(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          >
            <option value="">
              {language === 'ta' ? '-- மாவட்டத்தை தேர்வு செய்க --' : '-- Select Active District --'}
            </option>
            {activeDistricts.map((dist) => (
              <option key={dist._id} value={dist.name.en}>
                {dist.name[language] || dist.name.en} ({dist.name.en})
              </option>
            ))}
            {/* If value.district exists (e.g. historical) but is not currently active, keep it selectable */}
            {value.district && !activeDistricts.some((d) => d.name.en === value.district) && (
              <option value={value.district}>
                {value.district} ({language === 'ta' ? 'முந்தைய பதிவு' : 'Archived'})
              </option>
            )}
          </select>
        </div>

        {/* City / Town / Locality */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {language === 'ta' ? 'பகுதி / நகரம் (Area / Town / Locality) *' : 'Area / Locality / Town *'}
          </label>
          <input
            type="text"
            required
            placeholder={language === 'ta' ? 'எ.கா. அம்மாபேட்டை / பள்ளிபாளையம்' : 'e.g. Ammapet / Pallipalayam'}
            value={value.city || ''}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          />
        </div>

        {/* Street Address */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {language === 'ta' ? 'முழு தறி பட்டறை முகவரி (Complete Workshop Address) *' : 'Complete Loom Workshop Address *'}
          </label>
          <input
            type="text"
            required
            placeholder={language === 'ta' ? 'எ.கா. 42, நெசவாளர் தெரு, தறி கூடம்' : 'e.g. 42, Weavers Colony, Loom Workshop'}
            value={value.address || ''}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          />
        </div>

        {/* Landmark */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {language === 'ta' ? 'அடையாளக் குறி (Landmark)' : 'Landmark (Optional)'}
          </label>
          <input
            type="text"
            placeholder={language === 'ta' ? 'எ.கா. பட்டு கூட்டுறவு சங்கம் அருகில்' : 'e.g. Near Silk Society'}
            value={value.landmark || ''}
            onChange={(e) => onChange({ ...value, landmark: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          />
        </div>

        {/* PIN Code */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {language === 'ta' ? 'அஞ்சல் குறியீடு (PIN Code) *' : 'PIN Code *'}
          </label>
          <input
            type="text"
            required
            placeholder="636001"
            value={value.pincode || ''}
            onChange={(e) => onChange({ ...value, pincode: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          />
        </div>
      </div>
    </div>
  );
};
