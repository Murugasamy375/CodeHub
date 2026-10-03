import axios from "axios";
import { supabase } from "../lib/supabase";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";


const voiceApi = axios.create({
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


// ======================================================
// USER - GET OWN RECORDING
// ======================================================

export const getMyVoiceSubmission =
  async (challengeId) => {
    const accessToken =
      await getAccessToken();

    const response =
      await voiceApi.get(
        `/api/challenge/${challengeId}/voice`,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        }
      );

    return response.data.submission;
  };


// ======================================================
// USER - UPLOAD
// ======================================================

export const uploadVoiceSubmission =
  async (
    challengeId,
    audioBlob
  ) => {
    const accessToken =
      await getAccessToken();

    const formData =
      new FormData();

    formData.append(
      "audio",
      audioBlob,
      "recording.webm"
    );

    const response =
      await voiceApi.post(
        `/api/challenge/${challengeId}/voice`,
        formData,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        }
      );

    return response.data;
  };


// ======================================================
// USER - DELETE
// ======================================================

export const deleteVoiceSubmission =
  async (challengeId) => {
    const accessToken =
      await getAccessToken();

    const response =
      await voiceApi.delete(
        `/api/challenge/${challengeId}/voice`,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        }
      );

    return response.data;
  };


// ======================================================
// ADMIN - ALL RECORDINGS
// ======================================================

export const getAllVoiceSubmissions =
  async () => {
    const accessToken =
      await getAccessToken();

    const response =
      await voiceApi.get(
        "/api/admin/voice-recordings",
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        }
      );

    return response.data.submissions || [];
  };