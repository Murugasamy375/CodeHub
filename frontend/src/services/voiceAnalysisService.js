import axios from "axios";
import { supabase } from "../lib/supabase";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

const voiceAnalysisApi = axios.create({
  baseURL: API_URL,
});

const getAccessToken = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error(
      "User session is not available."
    );
  }

  return session.access_token;
};

export const analyzeMyVoice = async (
  challengeId
) => {
  const accessToken =
    await getAccessToken();

  const response =
    await voiceAnalysisApi.post(
      `/api/challenge/${challengeId}/voice/analyze`,
      {},
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      }
    );

  return response.data;
};