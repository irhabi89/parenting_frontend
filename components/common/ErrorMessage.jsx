// frontend/src/components/common/ErrorMessage.jsx
import React from "react";

/**
 * Komponen UI untuk menampilkan pesan kesalahan yang mencolok.
 * * @param {object} props - Properti komponen.
 * @param {string} props.message - Pesan kesalahan yang akan ditampilkan.
 * @param {string} [props.className] - Kelas CSS tambahan untuk styling.
 */
export default function ErrorMessage({ message, className = "" }) {
  // Pastikan pesan tersedia sebelum merender
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className={`p-4 rounded-lg border border-red-300 bg-red-50 text-red-700 shadow-sm ${className}`}
    >
      <div className="flex items-center">
        {/* Ikon Peringatan/Error (contoh menggunakan SVG sederhana) */}
        <svg
          className="w-5 h-5 mr-3 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          ></path>
        </svg>

        {/* Konten Pesan */}
        <p className="font-medium">**Error:** {message}</p>
      </div>
    </div>
  );
}
