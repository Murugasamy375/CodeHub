import axios from "axios";
import { supabase } from "../lib/supabase";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

const challengeApi = axios.create({
  baseURL: API_URL,
});

const getAccessToken = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("User session is not available.");
  }

  return session.access_token;
};


// =====================================================
// GET CURRENT CHALLENGE
// =====================================================

export const getCurrentChallenge = async () => {
  const response = await challengeApi.get(
    "/api/challenge"
  );

  return response.data.challenge;
};


// =====================================================
// ADMIN PUBLISH CHALLENGE
// =====================================================

export const createChallenge = async ({
  challengeDate,
  title,
  questionsText,
  picture,
}) => {
  const accessToken = await getAccessToken();

  const formData = new FormData();

  formData.append(
    "challenge_date",
    challengeDate
  );

  formData.append(
    "title",
    title
  );

  formData.append(
    "questions_text",
    questionsText
  );

  formData.append(
    "picture",
    picture
  );

  const response = await challengeApi.post(
    "/api/admin/challenge",
    formData,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.data;
};


// =====================================================
// ADMIN REMOVE CHALLENGE
// =====================================================

export const deleteChallenge = async () => {
  const accessToken = await getAccessToken();

  const response = await challengeApi.delete(
    "/api/admin/challenge",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.data;
};