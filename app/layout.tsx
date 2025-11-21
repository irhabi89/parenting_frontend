// app/layout.js

import "@/styles/globals.css";
import React from "react";
import { Providers } from "@/components/Providers";

export const metadata = { title: "App" };

// Tambahkan tipe untuk parameter `children`
export default function RootLayout({
  children
}: {
  children: React.ReactNode; // <-- TAMBAHKAN TIPE INI
}) {
  return (
    <html lang="en">
      <body>
        {/* Pastikan tidak ada <React.StrictMode> di sini */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
