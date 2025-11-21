"use client";

import { AuthProvider } from "../../context/AuthContext";
import DashboardPage from "./DashboardPage";

export default function DashboardPageWrapper() {
  return (
    <AuthProvider>
      <DashboardPage />
    </AuthProvider>
  );
}
