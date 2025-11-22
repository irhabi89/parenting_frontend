// frontend/src/components/parenting/ApplicationView.jsx
"use client";
import { useState, useEffect } from "react";
import { Squares2X2Icon, BanIcon } from "@heroicons/react/24/outline";

export default function ApplicationView({ device }) {
  // Placeholder data aplikasi (ganti dengan data API nyata)
  const [applications, setApplications] = useState([
    { id: 1, name: "Instagram", usageTime: "2 jam", blocked: false },
    { id: 2, name: "TikTok", usageTime: "1.5 jam", blocked: true },
    { id: 3, name: "WhatsApp", usageTime: "30 menit", blocked: false },
    { id: 4, name: "YouTube", usageTime: "3 jam", blocked: false }
  ]);

  // Simulasi fetch data (ganti dengan API call)
  useEffect(() => {
    if (device) {
      // Contoh: fetch(`/api/devices/${device.id}/applications`)
      console.log(`Memuat aplikasi untuk perangkat: ${device.name}`);
    }
  }, [device]);

  const toggleBlock = (id) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, blocked: !app.blocked } : app
      )
    );
  };

  if (!device) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        <p>Pilih perangkat untuk melihat aplikasi.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Aplikasi Perangkat: {device.name}
      </h2>
      <div className="space-y-3">
        {applications.length === 0 ? (
          <p className="text-gray-500">Tidak ada aplikasi tersedia.</p>
        ) : (
          applications.map((app) => (
            <div
              key={app.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center">
                <Squares2X2Icon className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {app.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Waktu Penggunaan: {app.usageTime}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleBlock(app.id)}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  app.blocked
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                {app.blocked ? "Diblokir" : "Aktif"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
