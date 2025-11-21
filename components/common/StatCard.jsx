// frontend/src/components/common/StatCard.jsx

import React from "react";

/**
 * Komponen kartu statistik sederhana untuk menampilkan ringkasan data.
 * @param {object} props - Properti komponen.
 * @param {string} props.icon - Ikon (misalnya emoji) atau SVG.
 * @param {string} props.title - Judul statistik (misalnya 'Total Perangkat').
 * @param {number|string} props.value - Nilai utama statistik (misalnya 5).
 * @param {string} props.detail - Teks detail tambahan (misalnya 'Perangkat aktif').
 * @param {'indigo'|'green'|'red'|'gray'} [props.color='indigo'] - Warna aksen untuk kartu.
 */
export default function StatCard({
  icon,
  title,
  value,
  detail,
  color = "indigo"
}) {
  // Menentukan warna berdasarkan prop 'color'
  const colorClasses = {
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-200",
    green: "text-green-600 bg-green-50 border-green-200",
    red: "text-red-600 bg-red-50 border-red-200",
    gray: "text-gray-600 bg-gray-50 border-gray-200"
  };

  const selectedColor = colorClasses[color] || colorClasses.indigo;

  return (
    <div
      className={`p-5 rounded-xl border-l-4 ${selectedColor} shadow-md hover:shadow-lg transition duration-300 transform hover:scale-[1.02]`}
    >
      <div className="flex items-center">
        {/* Ikon */}
        <div
          className={`mr-4 p-3 rounded-full ${selectedColor.replace(
            "-50",
            "-100"
          )}`}
        >
          <span className="text-xl">{icon}</span>
        </div>

        {/* Konten */}
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline">
            <p
              className={`text-3xl font-extrabold ${
                selectedColor.split(" ")[0]
              }`}
            >
              {value}
            </p>
          </div>
        </div>
      </div>

      {/* Detail */}
      <p className="mt-2 text-xs text-gray-400">{detail}</p>
    </div>
  );
}
