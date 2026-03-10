import React, { useEffect, useState, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerClusterer, Marker } from '@react-google-maps/api';
import { listenToTeamLocations } from '../firebase/db';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '1rem'
};

// Generic Campus Coordinates (Placeholder until actual is confirmed)
const center = {
  lat: 19.0760,
  lng: 72.8777
};

export default function LiveCampusMap({ teamsData }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const unsub = listenToTeamLocations((locs) => {
      setLocations(locs);
    });
    return () => unsub();
  }, []);

  const getMarkerIcon = (teamId) => {
    const team = teamsData.find(t => t.id === teamId);
    if (!team) return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';

    // Different colors based on progress
    if (team.currentClueIndex >= 7) return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
    if (team.currentClueIndex >= 5) return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
  };

  if (!isLoaded) return <div className="w-full h-[400px] bg-slate-800 rounded-2xl animate-pulse flex items-center justify-center text-slate-500">Loading Map Engine...</div>;

  return (
    <div className="w-full p-1 bg-slate-800 rounded-2xl shadow-xl border border-slate-700">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={16}
        options={{
          mapTypeId: 'satellite',
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
        }}
      >
        <MarkerClusterer>
          {(clusterer) =>
            locations.filter(l => l.status === 'online').map((loc) => (
              <Marker
                key={loc.teamId}
                position={{ lat: loc.lat, lng: loc.lng }}
                clusterer={clusterer}
                title={`${loc.teamName}\nUpdated: ${new Date(loc.timestamp).toLocaleTimeString()}`}
                icon={{ url: getMarkerIcon(loc.teamId) }}
              />
            ))
          }
        </MarkerClusterer>
      </GoogleMap>
    </div>
  );
}
