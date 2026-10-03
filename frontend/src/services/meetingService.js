import axios from "axios";
import { supabase } from "../lib/supabase";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";


const meetingApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
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


const getAuthHeaders = async () => {

  const accessToken =
    await getAccessToken();


  return {
    Authorization:
      `Bearer ${accessToken}`,
  };
};


// --------------------------------------------------
// GET CURRENT MEETING
// --------------------------------------------------

export const getCurrentMeeting = async () => {

  const response =
    await meetingApi.get(
      "/api/meeting"
    );

  return response.data.meeting;
};


// --------------------------------------------------
// ADMIN CREATE MEETING
// --------------------------------------------------

export const createMeeting = async ({
  title,
  meeting_date,
  meeting_time,
  meeting_link,
}) => {

  const headers =
    await getAuthHeaders();


  const response =
    await meetingApi.post(
      "/api/admin/meeting",
      {
        title,
        meeting_date,
        meeting_time,
        meeting_link,
      },
      {
        headers,
      }
    );


  return response.data;
};


// --------------------------------------------------
// ADMIN DELETE MEETING
// --------------------------------------------------

export const deleteMeeting = async () => {

  const headers =
    await getAuthHeaders();


  const response =
    await meetingApi.delete(
      "/api/admin/meeting",
      {
        headers,
      }
    );


  return response.data;
};