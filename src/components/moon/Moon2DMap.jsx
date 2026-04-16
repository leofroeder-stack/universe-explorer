import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LAYER_COLORS } from './moonData';
import MarkerPopup from './MarkerPopup';

function createIcon(type, isSelected) {
  const color = LAYER_COLORS[type];
  const size = isSelected ? 18 : 12;
  const shadow = isSelected ? `0 0 12px ${color}80, 0 0 24px ${color}40` : `0 0 6px ${color}60`;

  return L.divIcon({
    html: `<div style="
      width: ${size}px; 
      height: ${size}px; 
      background: ${color}; 
      border: 2px solid ${color}cc;
      border-radius: 50%; 
      box-shadow: ${shadow};
      transition: all 0.3s ease;
    "></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapEvents({ selectedMarker }) {
  const map = useMap();

  React.useEffect(() => {
    if (selectedMarker) {
      map.flyTo([selectedMarker.lat, selectedMarker.lng], 4, { duration: 1 });
    }
  }, [selectedMarker, map]);

  return null;
}

export default function Moon2DMap({ markers, selectedMarker, onSelectMarker }) {
  const moonTileUrl = 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/{z}/{x}/{y}.png';

  const markerElements = useMemo(() => {
    return markers.map(marker => (
      <Marker
        key={marker.id}
        position={[marker.lat, marker.lng]}
        icon={createIcon(marker.type, selectedMarker?.id === marker.id)}
        eventHandlers={{
          click: () => onSelectMarker(marker),
        }}
      >
        <Popup>
          <MarkerPopup marker={marker} />
        </Popup>
      </Marker>
    ));
  }, [markers, selectedMarker, onSelectMarker]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border">
      <MapContainer
        center={[0, 0]}
        zoom={2}
        minZoom={1}
        maxZoom={7}
        className="w-full h-full"
        style={{ background: 'hsl(222 47% 6%)' }}
        worldCopyJump={false}
        maxBoundsViscosity={0.8}
      >
        <TileLayer
          url={moonTileUrl}
          attribution=""
          noWrap={true}
        />
        <MapEvents selectedMarker={selectedMarker} />
        {markerElements}
      </MapContainer>
    </div>
  );
}