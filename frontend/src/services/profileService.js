import axios from "axios";
import { supabase } from "../lib/supabase";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

const profileApi = axios.create({
  baseURL: API_URL,
});

export const getMyProfile = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("User session is not available.");
  }

  const response = await profileApi.get(
    "/api/profile/me",
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  return response.data.profile;
};