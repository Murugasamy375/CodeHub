import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

const sqlApi = axios.create({
  baseURL: API_URL,
});

export const createSQLSession = async () => {
  const response = await sqlApi.post(
    "/api/sql/session"
  );

  return response.data;
};

export const executeSQL = async (
  sessionId,
  query
) => {
  const response = await sqlApi.post(
    "/api/sql/execute",
    {
      session_id: sessionId,
      query,
    }
  );

  return response.data;
};

export const getSQLTables = async (
  sessionId
) => {
  const response = await sqlApi.get(
    `/api/sql/tables/${sessionId}`
  );

  return response.data;
};

export const getSQLTableColumns = async (
  sessionId,
  tableName
) => {
  const response = await sqlApi.get(
    `/api/sql/tables/${sessionId}/${encodeURIComponent(
      tableName
    )}`
  );

  return response.data;
};

export const closeSQLSession = async (
  sessionId
) => {
  await sqlApi.delete(
    `/api/sql/session/${sessionId}`
  );
};