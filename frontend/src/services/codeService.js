import axios from "axios";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";


const codeApi = axios.create({
  baseURL: API_URL,

  headers: {
    "Content-Type": "application/json",
  },
});


export const runCode = async (
  language,
  code,
  stdin
) => {

  const response =
    await codeApi.post(
      "/api/code/run",
      {
        language,
        code,
        stdin,
      }
    );

  return response.data;
};