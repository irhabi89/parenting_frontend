"use client";

import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  Marker,
  Popup
} from "react-leaflet";
import { useState, useEffect, useRef, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ================================
// Ikon Marker berdasarkan status
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
// Recenter Otomatis
// ================================
function RecenterAutomatically({ lat, lng }) {
  const map = useMap();
  console.log("[DEBUG] RealtimeMarker: Map instance", map);
  const isInitialMount = useRef(true);
  const isStrict = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (isStrict && isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (lat !== undefined && lng !== undefined) map.setView([lat, lng]);
  }, [lat, lng, map]);

  return null;
}

// ================================
// Change Tile Layer
// ================================
// ================================
// Change Tile Layer (VERSI PERBAIKI)
// ================================
function ChangeTileLayer({ mapType, subdomains }) {
  const map = useMap();
  const tileLayerRef = useRef(null); // Simpan referensi ke tile layer

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
    [] // Kosong, karena tidak pernah berubah
  );

  useEffect(() => {
    const activeLayerConfig = tileLayers[mapType] || tileLayers.normal;

    // Jika sudah ada layer, hapus dulu
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // Buat layer baru dan simpan referensinya
    tileLayerRef.current = L.tileLayer(activeLayerConfig.url, {
      maxZoom: 20,
      subdomains,
      attribution: activeLayerConfig.attribution
    }).addTo(map);

    // Cleanup saat komponen unmount
    return () => {
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }
    };
  }, [mapType, map, subdomains]);

  return null;
}

// ================================
// Marker Real-Time dengan Status
// ================================
function RealtimeMarker({ location, deviceName, deviceStatus }) {
  const map = useMap();
  const markerRef = useRef(null);

  // Log untuk melihat kapan komponen render
  console.log(
    "[DEBUG] RealtimeMarker: Component rendering with location:",
    location
  );

  useEffect(() => {
    if (!location?.lat || !location?.lng) return;

    console.log(
      "[DEBUG] RealtimeMarker: useEffect running for location:",
      location
    );

    if (!markerRef.current) {
      markerRef.current = L.marker([location.lat, location.lng], {
        icon: createChildIcon(deviceStatus)
      }).addTo(map);
      markerRef.current.bindPopup(deviceName || "Device");
      console.log("[DEBUG] RealtimeMarker: Marker added to map");
    } else {
      console.log("[DEBUG] RealtimeMarker: Updating existing marker");
      markerRef.current.setIcon(createChildIcon(deviceStatus));
      markerRef.current.setLatLng([location.lat, location.lng]);
    }
  }, [location, deviceStatus, deviceName, map]); // Pastikan dependency-nya benar

  useEffect(() => {
    return () => {
      console.log(
        "[DEBUG] RealtimeMarker: Component unmounting, cleaning up marker"
      );
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [map]);

  return null;
}

// ================================
// RealtimeView
// ================================
export default function RealtimeView({
  location: initialLocation,
  deviceId,
  socket,
  deviceName,
  deviceStatus: initialDeviceStatus = "offline"
}) {
  const mapRef = useRef(null); // Pastikan ini di dalam komponen
  const [mapType, setMapType] = useState("hybrid");
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  const [deviceStatus, setDeviceStatus] = useState(initialDeviceStatus);

  // Listener untuk lokasi real-time
  useEffect(() => {
    console.log("[DEBUG] RealtimeView: Mounting location listener", {
      deviceId,
      initialLocation
    });

    if (!socket?.current) {
      console.log("[DEBUG] RealtimeView: Socket not connected yet");
      return;
    }

    const handleLocationUpdate = (data) => {
      console.log("[DEBUG] RealtimeView: location-update received", data);
      if (data.deviceId === deviceId) {
        const newLocation = {
          lat: data.lat,
          lng: data.lng,
          last_update: data.last_update || new Date().toISOString()
        };
        setCurrentLocation(newLocation);
        console.log("[DEBUG] RealtimeView: currentLocation updated", {
          deviceId,
          lat: data.lat,
          lng: data.lng,
          last_update: data.last_update
        });

        // Force recenter
        if (mapRef.current) {
          mapRef.current.setView([data.lat, data.lng], 16);
        }
      }
    };
    socket.current.on("location-update", handleLocationUpdate);

    return () => {
      console.log("[DEBUG] RealtimeView: Cleaning up location listener", {
        deviceId
      });
      socket.current.off("location-update", handleLocationUpdate);
    };
  }, [socket, deviceId]);

  // Listener untuk status device (online/offline)
  useEffect(() => {
    console.log("[DEBUG] RealtimeView: Mounting devices-update listener", {
      deviceId
    });

    if (!socket?.current) {
      console.log(
        "[DEBUG] RealtimeView: Socket not connected yet for devices-update"
      );
      return;
    }

    const handleDevicesUpdate = (devices) => {
      console.log("[DEBUG] RealtimeView: devices-update received", devices);
      const device = devices.find((d) => d.id === deviceId);
      if (device) {
        const newStatus = device.online ? "online" : "offline";
        setDeviceStatus(newStatus);
        console.log("[DEBUG] RealtimeView: deviceStatus updated to", newStatus); // Pastikan ini muncul
      }
    };

    socket.current.on("devices-update", handleDevicesUpdate);

    return () => {
      console.log("[DEBUG] RealtimeView: Cleaning up devices-update listener", {
        deviceId
      });
      socket.current.off("devices-update", handleDevicesUpdate);
    };
  }, [socket, deviceId]);

  // Render fallback jika lokasi belum tersedia
  if (!currentLocation?.lat || !currentLocation?.lng) {
    console.log("[DEBUG] RealtimeView: Waiting for location data", {
      deviceId
    });
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        <p>Menunggu data lokasi real-time...</p>
      </div>
    );
  }

  const subdomains = ["mt0", "mt1", "mt2", "mt3"];
  const { lat, lng } = currentLocation;
  function MapEvents() {
    useMapEvents({
      // useMapEvents sekarang sudah terdefinisi
      moveend: () => {
        console.log("[DEBUG] Map moved");
      },
      zoomend: () => {
        console.log("[DEBUG] Map zoomed");
      }
    });
    return null;
  }
  return (
    <div style={{ position: "relative" }}>
      {/* Kontrol MapType */}
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
        ref={mapRef}
        center={[lat, lng]}
        zoom={16}
        style={{ height: 400, width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ChangeTileLayer mapType={mapType} subdomains={subdomains} />
        <RecenterAutomatically
          lat={currentLocation.lat}
          lng={currentLocation.lng}
        />

        {/* Tambahkan komponen MapEvents di sini */}
        <MapEvents />

        <RealtimeMarker
          key={`${deviceId}-${currentLocation.lat}-${currentLocation.lng}`}
          location={currentLocation}
          deviceName={deviceName}
          deviceStatus={deviceStatus}
        />
      </MapContainer>
    </div>
  );
}
