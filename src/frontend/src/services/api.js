// src/services/api.js

import axios from "axios"

const API = axios.create({ baseURL: "http://localhost:8000" })

export const askQuestion   = (question, k = 4) =>
  API.post("/ask", { question, k })

export const getMetricsSummary = () => API.get("/metrics/summary")
export const getMetricsDetail  = () => API.get("/metrics/detail")
export const getWorstQuestions = (metric = "faithfulness", n = 3) =>
  API.get(`/metrics/worst?metric=${metric}&n=${n}`)
export const getRealtimeEvals  = () => API.get("/evaluations/realtime")
export const clearRealtimeEvals = () => API.delete("/evaluations/realtime")