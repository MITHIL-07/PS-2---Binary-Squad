import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

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
