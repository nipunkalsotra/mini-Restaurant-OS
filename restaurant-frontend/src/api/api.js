import axios from "axios";
import { getToken } from "../utils/auth";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 60000,
});

API.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;