import axios from "axios";
import { env } from "./env.js";

const brevo = axios.create({
  baseURL: "https://api.brevo.com/v3",
  headers: {
    "api-key": env.brevoApiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

export default brevo;