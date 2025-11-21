"use client";

import { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";
import { deviceService, locationService } from "../../services/apiService";
import { useSocket } from "../../hooks/useSocket";

// Components
import DeviceList from "../../components/parenting/DeviceList";
import dynamic from "next/dynamic";
import CameraView from "../../components/parenting/CameraView";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";
import StatCard from "../../components/common/StatCard";
import ConsolePanel from "../../components/parenting/ConsolePanel";

// Load MapView only on client (no SSR)
const MapView = dynamic(() => import("@/components/parenting/MapView"), {
  ssr: false,
  loading: () => <Loader message="Memuat peta..." className="h-full" />
});

// -----------------------------
// Type Definitions
// -----------------------------
interface Device {
  id: string;
  device_name: string;
}

interface Location {
  lat: number;
  lng: number;
  last_update: string;
}

interface ConsoleLog {
  time: string;
  message: string;
}

const VIEW_TYPES = { MAP: "map", CAMERA: "camera" } as const;

// -----------------------------
// DashboardPage Component
// -----------------------------
export default function DashboardPage() {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error("AuthContext is not provided!");
  const { user } = authContext;

  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [activeView, setActiveView] = useState<
    (typeof VIEW_TYPES)[keyof typeof VIEW_TYPES] | null
  >(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);

  const socket = useSocket(
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000"
  );

  const addLog = useCallback((msg: string) => {
    setConsoleLogs((prev) => [
      ...prev,
      { time: new Date().toLocaleTimeString(), message: msg }
    ]);
  }, []);

  // -----------------------------
  // Fetch Device Location
  // -----------------------------
  const fetchDeviceLocation = useCallback(
    async (deviceId: string) => {
      if (activeView === VIEW_TYPES.CAMERA) return;
      try {
        const location: Location =
          await locationService.getLatestDeviceLocation(deviceId);
        setCurrentLocation(location);
        addLog(`📍 Lokasi terbaru diterima → ${location.lat}, ${location.lng}`);
      } catch {
        setCurrentLocation(null);
        addLog(`⚠️ Gagal memuat lokasi device ${deviceId}`);
      }
    },
    [activeView, addLog]
  );

  // -----------------------------
  // Fetch Devices (tanpa memilih otomatis)
  // -----------------------------
  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: Device[] = await deviceService.getDevices();
      setDevices(data);
      addLog(`📱 Total perangkat dimuat: ${data.length}`);
      // ❌ TIDAK ADA PEMILIHAN OTOMATIS DI SINI
    } catch {
      setError("Gagal memuat daftar perangkat.");
    } finally {
      setIsLoading(false);
    }
  }, [addLog]); // fetchDeviceLocation dihapus dari dependencies

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // -----------------------------
  // Render Main Content
  // -----------------------------
  const renderMainContent = useMemo(() => {
    if (isLoading)
      return <Loader message="Memuat perangkat & lokasi..." className="h-64" />;
    if (error) return <ErrorMessage message={error} />;
    if (!devices.length)
      return (
        <div className="p-10 bg-white rounded-xl shadow-lg text-center">
          Belum ada perangkat yang terdaftar.
        </div>
      );
    if (!selectedDevice || !activeView)
      return (
        <div className="p-10 bg-white rounded-xl shadow-lg text-center">
          Pilih perangkat dari panel kiri.
        </div>
      );

    if (activeView === VIEW_TYPES.MAP) {
      const loc = currentLocation || {
        lat: -4.02696,
        lng: 122.53546,
        last_update: ""
      };
      return (
        <div className="p-6 bg-white rounded-xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-indigo-700">
            📍 Lokasi Real-Time – {selectedDevice.device_name}
          </h2>
          <div className="h-96 rounded-lg overflow-hidden">
            {currentLocation ? (
              <MapView location={loc} />
            ) : (
              <Loader message="Memuat lokasi..." className="h-full" />
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Update terakhir: {currentLocation?.last_update || "memuat..."}
          </p>
        </div>
      );
    }

    if (activeView === VIEW_TYPES.CAMERA) {
      return (
        <div className="p-6 bg-gray-900 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-white">
            📹 Kamera – {selectedDevice.device_name}
          </h2>
          <div className="aspect-video bg-black rounded-lg">
            <CameraView
              key={`cam-${selectedDevice.id}`}
              socket={socket}
              deviceId={selectedDevice.id}
              addLog={addLog}
            />
          </div>
        </div>
      );
    }

    return null;
  }, [
    isLoading,
    error,
    devices.length,
    selectedDevice,
    activeView,
    currentLocation,
    socket,
    addLog
  ]);

  // -----------------------------
  // Final Render
  // -----------------------------
  return (
    <div className="container mx-auto p-4 bg-gray-100 min-h-screen">
      <header className="mb-6 pb-4 border-b border-indigo-300">
        <h1 className="text-4xl font-extrabold text-gray-900">
          🌐 Parental Guard Dashboard
        </h1>
        <p className="text-indigo-600 mt-1">
          Selamat datang, {user?.username || "Orang Tua"}.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon="📱"
          title="Total Perangkat"
          value={devices.length}
          detail={""}
        />
        <StatCard
          icon="📍"
          title="Log Lokasi Hari Ini"
          value="156"
          detail={""}
        />
        <StatCard
          icon="🚨"
          title="Peringatan Baru"
          value="3"
          color="red"
          detail={""}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-gray-700 border-b pb-2">
            Daftar Perangkat
          </h2>
          <DeviceList
            devices={devices}
            selectedDeviceId={selectedDevice?.id}
            onSelectDevice={(d: Device | null) => setSelectedDevice(d)}
            onViewMap={(d: Device | null) => {
              setSelectedDevice(d);
              setActiveView(VIEW_TYPES.MAP);
              if (d) fetchDeviceLocation(d.id);
            }}
            onViewCamera={(d: Device | null) => {
              setSelectedDevice(d);
              setActiveView(VIEW_TYPES.CAMERA);
            }}
          />
        </div>
        <div className="lg:col-span-3">{renderMainContent}</div>
      </div>

      <div className="mt-6">
        <ConsolePanel logs={consoleLogs} />
      </div>
    </div>
  );
}
