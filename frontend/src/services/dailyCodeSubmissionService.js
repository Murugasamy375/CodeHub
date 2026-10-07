import axios from "axios";

import { supabase } from "../lib/supabase";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";


const codeSubmissionApi = axios.create({
  baseURL: API_URL,
});


// =====================================================
// GET ACCESS TOKEN
// =====================================================

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


// =====================================================
// GET MY DAILY CODE DRAFT
// =====================================================

export const getDailyCodeDraft = async (
  challengeId
) => {

  const accessToken =
    await getAccessToken();

  const response =
    await codeSubmissionApi.get(
      `/api/challenge/${challengeId}/code`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      }
    );

  return response.data.draft;
};


// =====================================================
// SAVE DAILY CODE DRAFT
// =====================================================

export const saveDailyCodeDraft = async ({
  challengeId,
  language,
  code,
}) => {

  const accessToken =
    await getAccessToken();

  const response =
    await codeSubmissionApi.put(
      `/api/challenge/${challengeId}/code/draft`,
      {
        language,
        code,
      },
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      }
    );

  return response.data.draft;
};


// =====================================================
// FINAL SUBMISSION
// =====================================================

export const submitDailyCode = async ({
  challengeId,
  language,
  code,
}) => {
  const accessToken =
    await getAccessToken();

  const response =
    await codeSubmissionApi.post(
      `/api/challenge/${challengeId}/code`,
      {
        language,
        code,
      },
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      }
    );

  return response.data;
};