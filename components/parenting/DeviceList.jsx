"use client";

import DeviceCard from "./DeviceCard";

// Tambahkan selectedDeviceId dan onSelectDevice sebagai prop
export default function DeviceList({
  devices,
  onViewMap,
  onViewCamera,
  selectedDeviceId,
  onSelectDevice
}) {
  return (
    <div>
      {devices.map((d) => (
        <DeviceCard
          key={d.id}
          device={d}
          // Periksa apakah perangkat ini sedang terpilih
          isActive={d.id === selectedDeviceId}
          // Teruskan handler untuk View dan Camera
          onViewMap={onViewMap}
          onViewCamera={onViewCamera}
          // Teruskan handler untuk memilih Card (untuk Map View)
          onSelectDevice={onSelectDevice}
        />
      ))}
    </div>
  );
}
