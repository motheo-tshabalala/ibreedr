import React, { useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '1rem'
};

// Autocomplete search component
function PlacesSearch({ onPlaceSelect }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: "za" },
    },
    debounce: 300,
  });

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onPlaceSelect(address, lat, lng);
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  return (
    <div className="relative mb-3">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        placeholder="Search for a location..."
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      {status === "OK" && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {data.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion.description)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {suggestion.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function LocationMap({ latitude, longitude, locationName }) {
  const [center, setCenter] = useState({
    lat: parseFloat(latitude) || -29.1167,
    lng: parseFloat(longitude) || 26.2167
  });
  const [mapLat, setMapLat] = useState(parseFloat(latitude));
  const [mapLng, setMapLng] = useState(parseFloat(longitude));
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const handlePlaceSelect = (address, lat, lng) => {
    setCenter({ lat, lng });
    setMapLat(lat);
    setMapLng(lng);
  };

  const openInMaps = () => {
    if (mapLat && mapLng) {
      const url = `https://www.google.com/maps/search/?api=1&query=${mapLat},${mapLng}`;
      window.open(url, '_blank');
    } else if (locationName) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationName)}`;
      window.open(url, '_blank');
    }
  };

  if (!apiKey) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
        <p className="text-amber-700 text-sm">Map not configured.</p>
        <p className="text-xs text-amber-600 mt-1">📍 {locationName || 'Location'}</p>
        <button onClick={openInMaps} className="mt-2 text-amber-600 underline text-sm">
          Open in Google Maps →
        </button>
      </div>
    );
  }

  return (
    <div>
      <LoadScript
        googleMapsApiKey={apiKey}
        libraries={["places"]}
        onLoad={() => setScriptsLoaded(true)}
      >
        {scriptsLoaded && (
          <>
            <PlacesSearch onPlaceSelect={handlePlaceSelect} />
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={mapLat && mapLng ? 12 : 5}
              options={{
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true
              }}
            >
              {mapLat && mapLng && (
                <Marker
                  position={{ lat: mapLat, lng: mapLng }}
                  title={locationName || "Farm location"}
                />
              )}
            </GoogleMap>
          </>
        )}
      </LoadScript>
      <button
        onClick={openInMaps}
        className="mt-3 w-full py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-sm font-medium transition"
      >
        📍 Open in Google Maps for directions
      </button>
      {locationName && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          {locationName}
        </p>
      )}
    </div>
  );
}