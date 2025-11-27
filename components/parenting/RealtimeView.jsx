// RealtimeView.jsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
// Pastikan path impor ke RealtimeMap.jsx sudah benar
import RealtimeMap from "./RealtimeMap";

// ================================
// RealtimeView (Komponen Logika & State)
// ================================
export default function RealtimeView({
  location: initialLocation,
  deviceId,
  socket,
  deviceName,
  deviceStatus: initialDeviceStatus = "offline"
}) {
  const mapRef = useRef(null);
  const [mapType, setMapType] = useState("hybrid");
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  const [deviceStatus, setDeviceStatus] = useState(initialDeviceStatus);

  // Listener untuk lokasi real-time
  const handleLocationUpdate = useCallback(
    (data) => {
      if (deviceId) {
        const { lat, lng } = data;

        // Validasi koordinat
        if (typeof lat !== "number" || typeof lng !== "number") {
          console.error("[ERROR] RealtimeView: Invalid lat/lng values", {
            lat,
            lng
          });
          return;
        }

        const newLocation = {
          lat,
          lng,
          last_update: data.last_update || new Date().toISOString()
        };
        // 1. Update state lokasi
        setCurrentLocation(newLocation);

        // 2. Force recenter/zoom DENGAN ANIMASI Mulus (flyTo)
        if (mapRef.current) {
          console.log("[DEBUG] RealtimeView: Animating map movement (flyTo)");
          // mapRef.current.flyTo([lat, lng], 16, {
          //   duration: 1.5, // Durasi 1.5 detik untuk pergerakan mulus
          //   easeLinearity: 0.5 // Kontrol kecepatan pergerakan
          // });
        }
      }
    },
    [deviceId]
  );

  // Listener untuk status device (online/offline)
  const handleDevicesUpdate = useCallback(
    (devices) => {
      const device = devices.find((d) => d.id === deviceId);
      if (device) {
        const newStatus = device.online ? "online" : "offline";
        setDeviceStatus(newStatus);
      }
    },
    [deviceId]
  );

  // Efek untuk mengaktifkan/menonaktifkan listener Socket.IO
  useEffect(() => {
    if (!socket?.current) {
      return;
    }

    console.log(
      `[DEBUG] RealtimeView: Mounting listeners for device ${deviceId}`
    );

    // Attach listeners
    socket.current.on("location-update", handleLocationUpdate);
    socket.current.on("devices-update", handleDevicesUpdate);

    // Cleanup listeners saat komponen unmount
    return () => {
      console.log(
        `[DEBUG] RealtimeView: Cleaning up listeners for device ${deviceId}`
      );
      socket.current.off("location-update", handleLocationUpdate);
      socket.current.off("devices-update", handleDevicesUpdate);
    };
  }, [socket, handleLocationUpdate, handleDevicesUpdate, deviceId]);

  // Render fallback jika lokasi belum tersedia
  if (!currentLocation?.lat || !currentLocation?.lng) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        <p>Menunggu data lokasi real-time...</p>
      </div>
    );
  }

  // Meneruskan state dan setter ke RealtimeMap
  return (
    <RealtimeMap
      location={currentLocation}
      deviceName={deviceName}
      deviceStatus={deviceStatus}
      mapType={mapType}
      setMapType={setMapType}
      mapRef={mapRef}
    />
  );
}
