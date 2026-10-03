function Toolbar({
  onRun,
  onReset,
  loading,
  executionTime,
}) {
  return (
    <div className="editor-toolbar">

      <div className="toolbar-left">

        <button
          className="run-button"
          onClick={onRun}
          disabled={loading}
        >
          {loading
            ? "Running..."
            : "▶ Run"}
        </button>

        <button
          className="reset-button"
          onClick={onReset}
          disabled={loading}
        >
          Reset
        </button>

      </div>


      {executionTime !== null && (
        <div className="execution-time">
          Execution time:{" "}
          <strong>
            {executionTime} ms
          </strong>
        </div>
      )}

    </div>
  );
}

export default Toolbar;