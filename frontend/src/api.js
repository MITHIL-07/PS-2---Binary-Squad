import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://georeadiness-api.onrender.com";

export async function calculateSiteScore(factors) {
  const response = await axios.post(
    `${API_BASE_URL}/api/score`,
    factors
  );
  return response.data;
}

export async function getSites() {
  const response = await axios.get(
    `${API_BASE_URL}/api/sites`
  );
  return response.data;
}

export async function getH3Readiness() {
  const response = await axios.get(
    `${API_BASE_URL}/api/h3`
  );
  return response.data;
}

export async function getSiteRecommendation(factors) {
  const response = await axios.post(
    `${API_BASE_URL}/api/recommendation`,
    factors
  );
  return response.data;
}

export async function getSiteAnalyses() {
  const response = await axios.get(
    `${API_BASE_URL}/api/sites/analysis`
  );
  return response.data;
}
