import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// HANYA dipanggil dari komponen client
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// ❗❗❗ HAPUS BAGIAN INI ❗❗❗
// const token = localStorage.getItem("token");
// if (token) setAuthToken(token);

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

// ==============================
// AUTH SERVICE
// ==============================
export const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });

    if (typeof window !== "undefined") {
      localStorage.setItem("token", response.data.token);
    }

    setAuthToken(response.data.token);

    return response.data;
  },

  register: async (username, email, password) => {
    const response = await api.post("/auth/register", {
      username,
      email,
      password
    });
    return response.data;
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    setAuthToken(null);
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  }
};
