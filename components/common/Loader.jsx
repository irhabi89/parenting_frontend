// frontend/src/components/common/Loader.jsx
import React from "react";

/**
 * Komponen UI untuk menampilkan indikator pemuatan (loading spinner) dan pesan opsional.
 * * @param {object} props - Properti komponen.
 * @param {string} [props.message] - Pesan yang ditampilkan di bawah spinner (default: 'Memuat...').
 * @param {string} [props.className] - Kelas CSS tambahan untuk div pembungkus.
 * @param {string} [props.spinnerClass] - Kelas CSS untuk spinner (misalnya untuk ukuran/warna).
 */
export default function Loader({
  message = "Memuat data...",
  className = "",
  spinnerClass = "w-8 h-8"
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-gray-500 bg-white rounded-lg shadow-sm ${className}`}
    >
      {/* Spinner SVG */}
      <svg
        className={`animate-spin text-indigo-500 ${spinnerClass}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        {/* Latar Belakang Lingkaran */}
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        {/* Arc (Bagian yang Berputar) */}
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>

      {/* Pesan Pemuatan */}
      <p className="mt-3 text-sm font-medium">{message}</p>
    </div>
  );
}
