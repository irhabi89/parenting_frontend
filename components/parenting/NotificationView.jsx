// frontend/src/components/parenting/NotificationView.jsx
"use client";
import { useState, useEffect } from "react";
import { BellIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function NotificationView({ device }) {
  // Placeholder data notifikasi (ganti dengan data API nyata)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: "Anak keluar dari zona aman",
      timestamp: "2023-10-01 10:00:00",
      read: false
    },
    {
      id: 2,
      message: "Perangkat low battery",
      timestamp: "2023-10-01 11:00:00",
      read: true
    },
    {
      id: 3,
      message: "Aktivitas aplikasi berlebihan",
      timestamp: "2023-10-01 12:00:00",
      read: false
    }
  ]);

  // Simulasi fetch data (ganti dengan API call)
  useEffect(() => {
    if (device) {
      // Contoh: fetch(`/api/devices/${device.id}/notifications`)
      console.log(`Memuat notifikasi untuk perangkat: ${device.name}`);
    }
  }, [device]);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  if (!device) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        <p>Pilih perangkat untuk melihat notifikasi.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Notifikasi Perangkat: {device.name}
      </h2>
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-gray-500">Tidak ada notifikasi tersedia.</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-center p-3 rounded-lg border ${
                notif.read ? "bg-gray-100" : "bg-yellow-50 border-yellow-200"
              }`}
            >
              <div className="flex-shrink-0">
                <BellIcon
                  className={`h-5 w-5 ${
                    notif.read ? "text-gray-400" : "text-yellow-500"
                  }`}
                />
              </div>
              <div className="ml-3 flex-1">
                <p
                  className={`text-sm font-medium ${
                    notif.read ? "text-gray-700" : "text-gray-900"
                  }`}
                >
                  {notif.message}
                </p>
                <p className="text-xs text-gray-500">{notif.timestamp}</p>
              </div>
              {!notif.read && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="ml-3 text-green-600 hover:text-green-800"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
