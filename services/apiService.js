import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Untuk set header default
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// Interceptor WAJIB
api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ==============================
// DEVICE SERVICE
// ==============================
export const deviceService = {
  getDevices: async () => {
    const response = await api.get("/devices/list");
    return response.data;
  }
};

// ==============================
// LOCATION SERVICE
// ==============================
export const locationService = {
  getDeviceLocationHistory: async (deviceId) => {
    const response = await api.get(`/location/${deviceId}/history`);
    return response.data;
  },

  getLatestDeviceLocation: async (deviceId) => {
    const response = await api.get(`/location/${deviceId}/latest`);
    return response.data;
  }
};
