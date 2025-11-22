"use client";

import {
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  SetStateAction
} from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import dynamic from "next/dynamic";
import { Socket } from "socket.io-client";

import { AuthContext } from "../../context/AuthContext";
import { deviceService, locationService } from "../../services/apiService";
import { useSocket } from "../../hooks/useSocket";

// Components
import ActivityView from "../../components/parenting/ActivityView";
import NotificationView from "../../components/parenting/NotificationView";
import ApplicationView from "../../components/parenting/ApplicationView";

import DeviceList from "../../components/parenting/DeviceList";
import CameraView from "../../components/parenting/CameraView";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";
import StatCard from "../../components/common/StatCard";
import ConsolePanel from "../../components/parenting/ConsolePanel";

// -----------------------------
// Dynamic Imports
// -----------------------------
const MapView = dynamic(() => import("@/components/parenting/MapView"), {
  ssr: false,
  loading: () => <Loader message="Memuat peta..." className="h-full" />
});

// Ganti import langsung dengan dynamic
const RealtimeView = dynamic(
  () => import("../../components/parenting/RealtimeView"),
  {
    ssr: false,
    loading: () => (
      <Loader message="Memuat peta real-time..." className="h-full" />
    )
  }
);

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

// ✅ Perbarui VIEW_TYPES untuk menyertakan yang baru
const VIEW_TYPES = {
  MAP: "map",
  CAMERA: "camera",
  REALTIME: "realtime",
  NOTIFICATIONS: "notifications",
  ACTIVITY: "activity",
  APPLICATION: "application"
} as const;

// -----------------------------
// DashboardPage Component
// -----------------------------
export default function DashboardPage() {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error("AuthContext is not provided!");
  const { user } = authContext;

  // -----------------------------
  // State
  // -----------------------------
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  // ✅ Perbarui type activeView untuk menyertakan semua VIEW_TYPES
  const [activeView, setActiveView] = useState<
    (typeof VIEW_TYPES)[keyof typeof VIEW_TYPES] | null
  >(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [totalLocationLogs, setTotalLocationLogs] = useState<number>(0);
  const [deviceLocationLogs, setDeviceLocationLogs] = useState<number | null>(
    null
  );

  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  const socket = useSocket(
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000"
  );

  // -----------------------------
  // Helper Callbacks
  // -----------------------------
  const addLog = useCallback((msg: string, type: string = "info") => {
    const prefix = type === "error" ? "❌" : type === "warning" ? "⚠️" : "ℹ️";
    setConsoleLogs((prev) => [
      ...prev,
      { time: new Date().toLocaleTimeString(), message: `${prefix} ${msg}` }
    ]);
  }, []);

  // -----------------------------
  // Fetch Functions
  // -----------------------------
  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: Device[] = await deviceService.getDevices();
      setDevices(data);
      addLog(`📱 Total perangkat dimuat: ${data.length}`);
    } catch {
      setError("Gagal memuat daftar perangkat.");
    } finally {
      setIsLoading(false);
    }
  }, [addLog]);

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

  const fetchTotalLocationLogs = useCallback(async () => {
    try {
      const res = await locationService.getJmlLokasiAll();
      setTotalLocationLogs(res.count); // ambil angka saja
      addLog(`📍 Total lokasi hari ini: ${res.count}`);
    } catch {
      addLog("⚠️ Gagal memuat jumlah lokasi hari ini", "error");
    }
  }, [addLog]);

  const fetchDeviceLocationLogs = useCallback(
    async (deviceId: string) => {
      try {
        const res = await locationService.getJmlLokasiDevice(deviceId);
        setDeviceLocationLogs(res.count);
        addLog(`📍 Lokasi hari ini untuk device ${deviceId}: ${res.count}`);
      } catch {
        setDeviceLocationLogs(null);
        addLog(
          `⚠️ Gagal memuat jumlah lokasi untuk device ${deviceId}`,
          "error"
        );
      }
    },
    [addLog]
  );

  // -----------------------------
  // Camera Switch
  // -----------------------------
  const handleSwitchCamera = useCallback(async () => {
    if (!selectedDevice || !socket?.current) {
      addLog(
        "Tidak dapat switch kamera, perangkat atau socket tidak ada",
        "error"
      );
      return;
    }

    setIsSwitchingCamera(true);
    addLog("Mengirim perintah switch camera...");

    const command = { deviceId: selectedDevice.id, action: "switch-camera" };
    (socket.current as Socket).emit("command", command);

    setTimeout(() => setIsSwitchingCamera(false), 1000);
  }, [selectedDevice, socket, addLog]);

  // -----------------------------
  // Logout
  // -----------------------------
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    Cookies.remove("token");

    if (authContext?.setUser) authContext.setUser(null);
    router.push("/login");
  }, [router, authContext]);

  // -----------------------------
  // Effects
  // -----------------------------
  useEffect(() => {
    fetchDevices();
    fetchTotalLocationLogs();
    if (selectedDevice) {
      fetchDeviceLocationLogs(selectedDevice.id);
    } else {
      setDeviceLocationLogs(null); // Reset jika tidak ada device terpilih
    }
  }, [selectedDevice, fetchDevices, fetchTotalLocationLogs]);

  useEffect(() => {
    if (!socket?.current || !selectedDevice) return;
    const deviceId = selectedDevice.id;
    // Join watch-device room
    // Tambahkan type assertion untuk socket.current agar TypeScript mengenali sebagai Socket
    (socket.current as Socket).emit(
      "watch-device",
      deviceId,
      (success: boolean) => {
        if (success) {
          addLog(`👀 Watching device ${deviceId}`);
        } else {
          addLog(`⚠️ Gagal watch device ${deviceId}`, "warning");
        }
      }
    );
  }, [socket, selectedDevice, addLog]);

  // -----------------------------
  // Render Helpers
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

    // ✅ Tambah kondisi untuk REALTIME (mirip MAP, tapi bisa gunakan RealtimeView jika ada)
    // Di renderMainContent, ganti kondisi REALTIME:
    if (activeView === VIEW_TYPES.REALTIME) {
      const loc = currentLocation || {
        lat: -4.02696, // Default lokasi (misalnya, Indonesia tengah)
        lng: 122.53546,
        last_update: ""
      };
      return (
        <div className="p-6 bg-white rounded-xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-green-700">
            ⏱️ Realtime – {selectedDevice.device_name}
          </h2>
          <div className="h-96 rounded-lg overflow-hidden">
            <RealtimeView
              location={loc} // Gunakan loc sebagai initial
              deviceId={selectedDevice.id}
              socket={socket}
              deviceName={selectedDevice.device_name}
              deviceStatus="offline" // Initial, akan diperbarui di RealtimeView
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Update real-time aktif. Terakhir:{" "}
            {currentLocation?.last_update || "belum ada data"}
          </p>
        </div>
      );
    }

    if (activeView === VIEW_TYPES.CAMERA) {
      return (
        <div className="p-6 bg-gray-900 rounded-xl shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">
              📹 Kamera – {selectedDevice.device_name}
            </h2>
            <button
              onClick={handleSwitchCamera}
              disabled={isSwitchingCamera}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSwitchingCamera ? "Mengganti..." : "📷 Switch Camera"}
            </button>
          </div>
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

    if (activeView === VIEW_TYPES.NOTIFICATIONS) {
      return (
        <div className="p-6 bg-white rounded-xl shadow-2xl">
          <NotificationView device={selectedDevice} />
        </div>
      );
    }
    if (activeView === VIEW_TYPES.ACTIVITY) {
      return (
        <div className="p-6 bg-white rounded-xl shadow-2xl">
          <ActivityView device={selectedDevice} />
        </div>
      );
    }
    if (activeView === VIEW_TYPES.APPLICATION) {
      return (
        <div className="p-6 bg-white rounded-xl shadow-2xl">
          <ApplicationView device={selectedDevice} />
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
    addLog,
    isSwitchingCamera,
    handleSwitchCamera
  ]);

  // -----------------------------
  // JSX Render
  // -----------------------------
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* HEADER */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Parental Guard Dashboard
            </h1>
            <p className="text-indigo-600 mt-1 text-sm">
              Selamat datang, {user?.username || "Orang Tua"} 👋
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-xl shadow hover:bg-red-600 active:scale-95 transition-all"
          >
            🔒 Logout
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="container mx-auto p-6">
        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon="📱"
            title="Total Perangkat"
            value={devices.length}
            detail=""
          />
          <StatCard
            icon="📍"
            title="Log Lokasi Hari Ini"
            value={selectedDevice ? deviceLocationLogs ?? 0 : totalLocationLogs}
            detail=""
          />
          <StatCard
            icon="🚨"
            title="Peringatan Baru"
            value="3"
            color="red"
            detail=""
          />
        </div>

        {/* LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* SIDEBAR */}
          <aside className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-5">
            <h2 className="text-lg font-bold mb-4 text-gray-700 border-b pb-2 flex items-center gap-2">
              📱 Daftar Perangkat
            </h2>
            <DeviceList
              devices={devices}
              selectedDeviceId={selectedDevice?.id}
              onSelectDevice={(d: Device | null) => setSelectedDevice(d)}
              onViewMap={(d: Device | null) => {
                setSelectedDevice(d);
                setActiveView(VIEW_TYPES.MAP);
                if (d) fetchDeviceLocation(d.id); // ✅ sekarang aman
              }}
              onViewCamera={(d: Device | null) => {
                setSelectedDevice(d);
                setActiveView(VIEW_TYPES.CAMERA);
              }}
              // ✅ Perbaiki onViewRealtime untuk mengatur REALTIME
              // onViewRealtime={(d: Device | null) => {
              //   setSelectedDevice(d);
              //   setActiveView(VIEW_TYPES.REALTIME);
              //   if (d) fetchDeviceLocation(d.id);
              // }}
              onViewRealtime={(d: Device | null) => {
                setSelectedDevice(d);
                setActiveView(VIEW_TYPES.REALTIME);
              }}
              onViewNotifications={(d: Device | null) => {
                setSelectedDevice(d);
                setActiveView(VIEW_TYPES.NOTIFICATIONS);
              }}
              onViewActivity={(d: Device | null) => {
                setSelectedDevice(d);
                setActiveView(VIEW_TYPES.ACTIVITY);
              }}
              onViewApplication={(d: Device | null) => {
                setSelectedDevice(d);
                setActiveView(VIEW_TYPES.APPLICATION);
              }}
            />
          </aside>

          {/* MAIN CONTENT */}
          <main className="lg:col-span-3 bg-white rounded-2xl shadow-xl p-6 min-h-[450px]">
            {renderMainContent}
          </main>
        </div>

        {/* CONSOLE */}
        <section className="mt-8 bg-white rounded-2xl shadow-lg p-4">
          <ConsolePanel logs={consoleLogs} />
        </section>
      </div>
    </div>
  );
}
