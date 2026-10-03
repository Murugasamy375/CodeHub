import { supabase } from "../lib/supabase";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

const getWebSocketURL = (token) => {
  const url = new URL(API_URL);

  const protocol =
    url.protocol === "https:"
      ? "wss:"
      : "ws:";

  return `${protocol}//${url.host}/ws/discussions?token=${encodeURIComponent(token)}`;
};

export const connectToDiscussion = async ({
  onHistory,
  onMessage,
  onError,
  onClose,
}) => {

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("User session is not available.");
  }

  const websocket = new WebSocket(
    getWebSocketURL(session.access_token)
  );

  websocket.onopen = () => {
    console.log("Discussion WebSocket connected.");
  };

  websocket.onmessage = (event) => {

    try {

      const data = JSON.parse(event.data);

      if (data.type === "history") {
        onHistory?.(data.data || []);
      }

      if (data.type === "message") {
        onMessage?.(data.data);
      }

      if (data.type === "error") {
        onError?.(data.message);
      }

    } catch (error) {

      console.error(
        "Failed to process discussion message:",
        error
      );

    }
  };

  websocket.onerror = () => {

    onError?.(
      "Unable to connect to the discussion server."
    );

  };

  websocket.onclose = () => {

    console.log("Discussion WebSocket closed.");

    onClose?.();

  };

  return websocket;
};