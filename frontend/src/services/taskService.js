import axios from "axios";

import { supabase } from "../lib/supabase";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";


const taskApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


const getAccessToken = async () => {

  const {
    data: {
      session,
    },
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


/*
 * ========================================
 * GET TASKS
 * ========================================
 */

export const getTasks = async () => {

  const headers =
    await getAuthHeaders();


  const response =
    await taskApi.get(
      "/api/tasks",
      {
        headers,
      }
    );


  return response.data;

};


/*
 * ========================================
 * GET TASK COUNT
 * ========================================
 */

export const getTaskCount = async () => {

  const headers =
    await getAuthHeaders();


  const response =
    await taskApi.get(
      "/api/tasks/count",
      {
        headers,
      }
    );


  return response.data.count;

};


/*
 * ========================================
 * CREATE TASK
 * ========================================
 */

export const createTask = async ({
  title,
  description,
}) => {

  const headers =
    await getAuthHeaders();


  const response =
    await taskApi.post(

      "/api/tasks",

      {
        title,
        description,
      },

      {
        headers,
      }

    );


  return response.data.task;

};


/*
 * ========================================
 * UPDATE TASK
 * ========================================
 */

export const updateTask = async (
  taskId,
  updates
) => {

  const headers =
    await getAuthHeaders();


  const response =
    await taskApi.patch(

      `/api/tasks/${taskId}`,

      updates,

      {
        headers,
      }

    );


  return response.data.task;

};


/*
 * ========================================
 * DELETE TASK
 * ========================================
 */

export const deleteTask = async (
  taskId
) => {

  const headers =
    await getAuthHeaders();


  const response =
    await taskApi.delete(

      `/api/tasks/${taskId}`,

      {
        headers,
      }

    );


  return response.data;

};