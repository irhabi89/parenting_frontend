// RealtimeMap.jsx
"use client";

import { MapContainer, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useRef, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ================================
// Ikon Marker berdasarkan status (Level Top)
// ================================
const createChildIcon = (status) => {
  const color = status === "online" ? "green" : "red";
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// ================================
// Change Tile Layer (Level Top)
// ================================
function ChangeTileLayer({ mapType, subdomains }) {
  const map = useMap();
  const tileLayerRef = useRef(null);
  const activeMapTypeRef = useRef(null); // Melacak jenis layer aktif

  const tileLayers = useMemo(
    () => ({
      normal: {
        url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        attribution: "© Google Maps"
      },
      satelit: {
        url: "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
        attribution: "© Google Satellite"
      },
      hybrid: {
        url: "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
        attribution: "© Google Hybrid"
      }
    }),
    []
  );

  useEffect(() => {
    // Mencegah refresh layer saat mapType sama
    if (activeMapTypeRef.current === mapType) {
      return;
    }

    const activeLayerConfig = tileLayers[mapType] || tileLayers.hybrid;

    // Hapus layer yang ada, HANYA jika mapType berubah
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    // Tambahkan layer baru
    tileLayerRef.current = L.tileLayer(activeLayerConfig.url, {
      maxZoom: 20,
      subdomains,
      attribution: activeLayerConfig.attribution
    }).addTo(map);

    // Catat jenis layer
    activeMapTypeRef.current = mapType;

    // Hapus fungsi cleanup agar tidak terjadi penghapusan layer tak terduga saat re-render
    return () => {};
  }, [mapType, map, subdomains, tileLayers]);

  // Wajib mengembalikan null atau JSX dari komponen React
  return null;
}

// ================================
// Marker Real-Time (Level Top)
// ================================
function RealtimeMarker({ location, deviceName, deviceStatus }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!location?.lat || !location?.lng) {
      return;
    }

    const newIcon = createChildIcon(deviceStatus);
    const popupContent = `<b>${deviceName}</b><br/>Status: ${deviceStatus}<br/>Terakhir update: ${new Date(
      location.last_update
    ).toLocaleTimeString()}`;

    if (!markerRef.current) {
      markerRef.current = L.marker([location.lat, location.lng], {
        icon: newIcon
      }).addTo(map);
      markerRef.current.bindPopup(popupContent);
    } else {
      markerRef.current.setLatLng([location.lat, location.lng]);
      markerRef.current.setIcon(newIcon);
      markerRef.current.getPopup().setContent(popupContent);
    }
  }, [location, deviceStatus, deviceName, map]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [map]);

  return null;
}

// RealtimeMap.jsx (Tambahkan di bagian atas, bersama komponen pembantu lainnya)

// ================================
// Recenter Automatically (Komponen Baru) ✅
// ================================
function RecenterAutomatically({ location }) {
  const map = useMap();
  const { lat, lng } = location;

  useEffect(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      // Menggunakan flyTo untuk transisi yang mulus
      map.flyTo([lat, lng], map.getZoom(), {
        duration: 1.5, // Durasi animasi
        easeLinearity: 0.5
      });
    }
  }, [lat, lng, map]); // Dependencies: lat, lng, dan map instance

  return null;
}

// ================================
// MapEvents (Level Top & Statis)
// ================================
function MapEvents() {
  useMapEvents({
    moveend: () => {
      // console.log("[DEBUG] Map moved");
    },
    zoomend: () => {
      // console.log("[DEBUG] Map zoomed");
    }
  });
  return null;
}

// ================================
// RealtimeMap (Komponen Tampilan Utama)
// ================================
export default function RealtimeMap({
  location,
  deviceName,
  deviceStatus,
  mapType,
  setMapType,
  mapRef
}) {
  const subdomains = ["mt0", "mt1", "mt2", "mt3"];
  const { lat, lng } = location;

  return (
    <div style={{ position: "relative" }}>
      {/* Kontrol MapType */}
      {/* ... (kode button kontrol) ... */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1000,
          backgroundColor: "white",
          padding: "5px",
          borderRadius: "5px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
        }}
      >
        {["normal", "satelit", "hybrid"].map((type) => (
          <button
            key={type}
            onClick={() => setMapType(type)}
            style={{
              fontWeight: mapType === type ? "bold" : "normal",
              marginRight: "5px",
              padding: "5px 10px",
              cursor: "pointer",
              border: "none",
              borderRadius: "3px"
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <MapContainer
        key="static-realtime-map"
        whenCreated={(map) => {
          mapRef.current = map;
        }}
        center={[lat, lng]}
        zoom={16}
        style={{ height: 400, width: "100%" }}
      >
        {/* 1. LAYER */}
        <ChangeTileLayer mapType={mapType} subdomains={subdomains} />

        {/* 2. MARKER */}
        <RealtimeMarker
          location={location}
          deviceName={deviceName}
          deviceStatus={deviceStatus}
        />

        {/* 3. AUTO CENTER BARU */}
        <RecenterAutomatically location={location} />

        {/* 4. EVENT LISTENER */}
        <MapEvents />
      </MapContainer>
    </div>
  );
}
