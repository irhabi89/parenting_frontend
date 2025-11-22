// frontend/src/components/parenting/ActivityView.jsx
"use client";
import { useState, useEffect } from "react";
import {
  ClockIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

export default function ActivityView({ device }) {
  // Placeholder data aktivitas (ganti dengan data API nyata)
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: "online",
      message: "Perangkat online",
      timestamp: "2023-10-01 10:00:00"
    },
    {
      id: 2,
      type: "location_change",
      message: "Lokasi berubah ke Jakarta",
      timestamp: "2023-10-01 11:00:00"
    },
    {
      id: 3,
      type: "app_usage",
      message: "Menggunakan aplikasi Instagram",
      timestamp: "2023-10-01 12:00:00"
    },
    {
      id: 4,
      type: "offline",
      message: "Perangkat offline",
      timestamp: "2023-10-01 13:00:00"
    }
  ]);

  // Simulasi fetch data (ganti dengan API call)
  useEffect(() => {
    if (device) {
      // Contoh: fetch(`/api/devices/${device.id}/activities`)
      console.log(`Memuat aktivitas untuk perangkat: ${device.name}`);
    }
  }, [device]);

  if (!device) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        <p>Pilih perangkat untuk melihat aktivitas.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Aktivitas Perangkat: {device.name}
      </h2>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-gray-500">Tidak ada aktivitas tersedia.</p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex-shrink-0">
                {activity.type === "online" || activity.type === "offline" ? (
                  <ClockIcon className="h-5 w-5 text-blue-500" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.message}
                </p>
                <p className="text-xs text-gray-500">{activity.timestamp}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
