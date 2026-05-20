import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,

  // 10 MINUTES
  timeout: 600000,

  headers: {
    "Content-Type": "application/json",
  },
});

// Request logger
api.interceptors.request.use(
  (config) => {
    console.log(
      `[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => Promise.reject(error)
);

// Response logger
api.interceptors.response.use(
  (response) => {
    console.log(
      `[API RESPONSE] ${response.status} ${response.config.url}`
    );
    return response;
  },
  (error) => {
    console.error("[API ERROR]", error);

    // Better timeout error
    if (error.code === "ECONNABORTED") {
      error.message =
        "Processing took too long. The dataset pipeline exceeded timeout.";
    }

    return Promise.reject(error);
  }
);

export default api;