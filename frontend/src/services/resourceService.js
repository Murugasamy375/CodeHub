import axios from "axios";
import { supabase } from "../lib/supabase";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

const resourceApi = axios.create({
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

export const getResources = async (category = null, topic = null) => {
  const params = {};

  if (category) {
    params.category = category;
  }

  if (topic) {
    params.topic = topic;
  }

  const response = await resourceApi.get("/api/resources", {
    params,
  });

  return response.data.resources || [];
};

export const createResource = async (resource) => {
  const accessToken = await getAccessToken();

  const formData = new FormData();

  formData.append("title", resource.title);
  formData.append("description", resource.description || "");
  formData.append("category", resource.category);
  formData.append("topic", resource.topic);
  formData.append("resource_type", resource.resource_type);

  if (resource.url) {
    formData.append("url", resource.url);
  }

  if (resource.file) {
    formData.append("file", resource.file);
  }

  const response = await resourceApi.post(
    "/api/resources/admin",
    formData,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.data;
};

export const deleteResource = async (resourceId) => {
  const accessToken = await getAccessToken();

  const response = await resourceApi.delete(
    `/api/resources/admin/${resourceId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.data;
};