"use client";

import { MapPinIcon, CameraIcon } from "@heroicons/react/24/outline";

// Tambahkan onSelectDevice dan isActive sebagai prop
export default function DeviceCard({
  device,
  onViewMap,
  onViewCamera,
  onSelectDevice,
  isActive
}) {
  if (!device) {
    return (
      <div className="p-4 mb-3 bg-red-100 rounded-xl shadow-md border border-red-500 text-red-700">
        Error: Data perangkat tidak tersedia.
      </div>
    );
  }

  // Definisikan status default jika device.status tidak ada
  const currentStatus = device.status || "offline";

  const statusColor =
    currentStatus === "online" ? "text-green-600" : "text-red-600";
  const statusText = currentStatus
    ? currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)
    : "Offline"; // Status default jika tetap tidak terdefinisi (seharusnya tidak terjadi lagi)

  // Styling untuk Card yang sedang aktif (terpilih)
  const activeStyle = isActive
    ? "border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50"
    : "border-gray-200 hover:shadow-lg hover:border-gray-300";

  return (
    <div
      // Tambahkan onClick ke div utama untuk memilih perangkat
      onClick={() => onSelectDevice(device)}
      className={`
        bg-white rounded-xl shadow-md p-4 mb-3 cursor-pointer 
        flex flex-col gap-2 w-full transition duration-200 border 
        ${activeStyle}
      `}
    >
      {/* Baris 1: Nama & Status */}
      <div className="flex items-center justify-between min-w-0">
        <h3 className="text-lg font-bold text-gray-800 truncate">
          {/* Pastikan device.name juga diakses dengan aman */}
          {device.name || "Perangkat Tak Dikenal"}
        </h3>
        <div className="flex items-center space-x-1 flex-shrink-0 ml-4">
          <span
            className={`h-2 w-2 rounded-full ${
              currentStatus === "online" ? "bg-green-500" : "bg-red-500"
            }`}
          ></span>
          <p
            className={`text-sm font-semibold ${statusColor} whitespace-nowrap`}
          >
            {statusText}
          </p>
        </div>
      </div>

      {/* Baris Informasi Tambahan (ID) */}
      <p className="text-xs text-gray-500">
        ID:{" "}
        <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-xs text-gray-700">
          {/* Pastikan device.deviceIdentifier juga diakses dengan aman */}
          {device.deviceIdentifier || "N/A"}
        </span>
      </p>

      {/* Baris 2: Tombol Aksi (Gunakan stopPropagation agar klik tombol tidak memicu onSelectDevice) */}
      <div className="flex gap-2 w-full mt-1">
        {/* Tombol View Location */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Penting: Menghentikan event bubbling ke div utama
            onViewMap(device);
          }}
          className="flex items-center justify-center flex-grow
                     px-3 py-1.5 text-sm font-medium rounded-lg shadow-sm whitespace-nowrap 
                     bg-blue-600 text-white hover:bg-blue-700 transition duration-150 ease-in-out"
        >
          <MapPinIcon className="h-4 w-4 mr-1" />
          Lokasi
        </button>

        {/* Tombol Remote Camera */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Penting: Menghentikan event bubbling ke div utama
            onViewCamera(device);
          }}
          className="flex items-center justify-center flex-grow
                     px-3 py-1.5 text-sm font-medium rounded-lg shadow-sm whitespace-nowrap
                     bg-purple-600 text-white hover:bg-purple-700 transition duration-150 ease-in-out"
        >
          <CameraIcon className="h-4 w-4 mr-1" />
          Kamera
        </button>
      </div>
    </div>
  );
}
