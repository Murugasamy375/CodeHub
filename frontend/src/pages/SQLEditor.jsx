import { useEffect, useState } from "react";

import {
  createSQLSession,
  executeSQL,
  getSQLTables,
  getSQLTableColumns,
  closeSQLSession,
} from "../services/sqlService";

function SQLEditor({ onBack }) {
  const [query, setQuery] = useState("");
  const [sessionId, setSessionId] = useState(null);

  const [tables, setTables] = useState([]);
  const [expandedTable, setExpandedTable] = useState(null);
  const [tableColumns, setTableColumns] = useState({});

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // Create temporary SQL session
  // --------------------------------------------------

  useEffect(() => {
    const startSession = async () => {
      try {
        const data = await createSQLSession();

        setSessionId(data.session_id);
      } catch (error) {
        console.error(
          "Failed to create SQL session:",
          error
        );

        setResult({
          success: false,
          error: "Failed to start SQL session.",
        });
      }
    };

    startSession();
  }, []);

  // --------------------------------------------------
  // Close temporary SQL session
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      if (sessionId) {
        closeSQLSession(sessionId).catch((error) => {
          console.error(
            "Failed to close SQL session:",
            error
          );
        });
      }
    };
  }, [sessionId]);

  // --------------------------------------------------
  // Run SQL
  // --------------------------------------------------

  const handleRun = async () => {
    if (!query.trim()) {
      setResult({
        success: false,
        error: "Please enter a SQL query.",
      });

      return;
    }

    if (!sessionId) {
      setResult({
        success: false,
        error: "SQL session is not ready yet.",
      });

      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await executeSQL(
        sessionId,
        query
      );

      setResult(data);

      // Refresh tables after SQL execution
      if (data.success) {
        const tableData = await getSQLTables(
          sessionId
        );

        setTables(tableData.tables || []);

        // Remove expanded table if it no longer exists
        if (
          expandedTable &&
          !tableData.tables?.includes(expandedTable)
        ) {
          setExpandedTable(null);
        }
      }
    } catch (error) {
      console.error(
        "SQL execution failed:",
        error
      );

      setResult({
        success: false,
        error:
          error.response?.data?.detail ||
          error.message ||
          "Failed to execute SQL.",
      });
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Expand / collapse table
  // --------------------------------------------------

  const handleTableClick = async (tableName) => {
    // Collapse
    if (expandedTable === tableName) {
      setExpandedTable(null);
      return;
    }

    setExpandedTable(tableName);

    // Already loaded
    if (tableColumns[tableName]) {
      return;
    }

    if (!sessionId) {
      return;
    }

    try {
      const data = await getSQLTableColumns(
        sessionId,
        tableName
      );

      if (data.success) {
        setTableColumns((previous) => ({
          ...previous,
          [tableName]: data.columns || [],
        }));
      }
    } catch (error) {
      console.error(
        "Failed to load table columns:",
        error
      );
    }
  };

  // --------------------------------------------------
  // Clear editor
  // --------------------------------------------------

  const handleClear = () => {
    setQuery("");
    setResult(null);
  };

  return (
    <div className="sql-editor-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="sql-editor-header">

        <div className="sql-editor-header-left">

          <button
            type="button"
            className="sql-back-button"
            onClick={onBack}
          >
            ← Back
          </button>

          <div>
            <h1>SQL Editor</h1>

            <p>
              Temporary SQL workspace
            </p>
          </div>

        </div>

        <button
          type="button"
          className="sql-clear-button"
          onClick={handleClear}
        >
          🗑 Clear
        </button>

      </header>


      {/* ==================================================
          WORKSPACE
      ================================================== */}

      <main className="sql-editor-workspace">


        {/* ==================================================
            DATABASE SIDEBAR
        ================================================== */}

        <aside className="sql-tables-panel">

          <div className="sql-panel-title">
            DATABASE
          </div>


          {/* No tables */}

          {tables.length === 0 && (
            <div className="sql-empty-tables">

              <div className="sql-empty-icon">
                🗃️
              </div>

              <p>
                Temporary Database
              </p>

              <span>
                Tables will appear here
              </span>

            </div>
          )}


          {/* Tables */}

          {tables.length > 0 && (
            <div className="sql-table-list">

              <div className="sql-table-section-title">
                TABLES
              </div>

              {tables.map((table) => {

                const isExpanded =
                  expandedTable === table;

                const columns =
                  tableColumns[table] || [];

                return (
                  <div
                    key={table}
                    className="sql-table-wrapper"
                  >

                    {/* Table name */}

                    <button
                      type="button"
                      className="sql-table-item"
                      onClick={() =>
                        handleTableClick(table)
                      }
                    >

                      <span className="sql-table-arrow">
                        {isExpanded
                          ? "▾"
                          : "▸"}
                      </span>

                      <span className="sql-table-icon">
                        📋
                      </span>

                      <span>
                        {table}
                      </span>

                    </button>


                    {/* Columns */}

                    {isExpanded && (
                      <div className="sql-columns-list">

                        {columns.length === 0 ? (
                          <div className="sql-columns-loading">
                            Loading...
                          </div>
                        ) : (
                          columns.map(
                            (column) => (
                              <div
                                key={column.name}
                                className="sql-column-item"
                              >

                                <span className="sql-column-key">
                                  {column.primary_key
                                    ? "🔑"
                                    : "•"}
                                </span>

                                <span className="sql-column-name">
                                  {column.name}
                                </span>

                                <span className="sql-column-type">
                                  {column.type ||
                                    "TEXT"}
                                </span>

                              </div>
                            )
                          )
                        )}

                      </div>
                    )}

                  </div>
                );
              })}

            </div>
          )}

        </aside>


        {/* ==================================================
            MAIN SQL AREA
        ================================================== */}

        <section className="sql-editor-main">


          {/* Toolbar */}

          <div className="sql-editor-toolbar">

            <span>
              QUERY
            </span>

            <button
              type="button"
              className="sql-run-button"
              onClick={handleRun}
              disabled={
                loading || !sessionId
              }
            >
              {loading
                ? "Running..."
                : "▶ Run"}
            </button>

          </div>


          {/* SQL Editor */}

          <textarea
            className="sql-query-editor"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder={`-- Write your SQL query here

CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    name TEXT,
    department TEXT,
    salary INTEGER
);

INSERT INTO employees
VALUES (1, 'Muruga', 'IT', 60000);

SELECT * FROM employees;`}
            spellCheck="false"
          />


          {/* ==================================================
              RESULTS
          ================================================== */}

          <div className="sql-results-panel">

            <div className="sql-results-header">
              <span>
                RESULTS
              </span>
            </div>


            {/* Empty */}

            {!result && (
              <div className="sql-results-empty">

                <div>
                  📊
                </div>

                <p>
                  No results yet
                </p>

                <span>
                  Run a SQL query to see
                  the results here.
                </span>

              </div>
            )}


            {/* Error */}

            {result && !result.success && (
              <div className="sql-error">

                <div className="sql-error-title">
                  ❌ SQL Error
                </div>

                <pre>
                  {result.error}
                </pre>

              </div>
            )}


            {/* Success */}

            {result?.success && (
              <div className="sql-result-content">

                {result.message && (
                  <div className="sql-success-message">
                    ✅ {result.message}
                  </div>
                )}


                {/* Result table */}

                {result.columns?.length > 0 && (
                  <div className="sql-result-table-wrapper">

                    <table className="sql-result-table">

                      <thead>

                        <tr>

                          {result.columns.map(
                            (column) => (
                              <th key={column}>
                                {column}
                              </th>
                            )
                          )}

                        </tr>

                      </thead>


                      <tbody>

                        {result.rows?.map(
                          (row, rowIndex) => (
                            <tr key={rowIndex}>

                              {row.map(
                                (
                                  value,
                                  columnIndex
                                ) => (
                                  <td
                                    key={
                                      columnIndex
                                    }
                                  >
                                    {value === null
                                      ? "NULL"
                                      : String(
                                          value
                                        )}
                                  </td>
                                )
                              )}

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>
                )}


                {/* Row count */}

                {result.row_count !==
                  undefined && (
                  <div className="sql-row-count">

                    {result.row_count} row
                    {result.row_count !== 1
                      ? "s"
                      : ""}{" "}
                    returned

                  </div>
                )}

              </div>
            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default SQLEditor;