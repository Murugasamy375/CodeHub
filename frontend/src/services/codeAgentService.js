import axios from "axios";
import { supabase } from "../lib/supabase";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

const codeAgentApi = axios.create({
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


export const sendCodeAgentMessage = async ({
  message,
  messages,
}) => {

  const accessToken =
    await getAccessToken();

  const response =
    await codeAgentApi.post(
      "/api/code-agent/chat",
      {
        message,
        messages,
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