// g:\classroom\LMS-CIT\client\src\api\axiosConfig.js

import axios from "axios";

const instance = axios.create({
  baseURL:  "/api",
  withCredentials: true,
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    const ignore401 =
      url.includes("/auth/me") || url.includes("/auth/login");

    if (status === 401 && !ignore401) {
      window.location.replace("/login");
    }

    return Promise.reject(error);
  }
);

export default instance;
