// components/Providers.jsx

"use client";

import { AuthProvider } from "@/context/AuthContext";
import React from "react"; // Pastikan React diimpor

// Tambahkan tipe untuk parameter `children`
export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
