function TestCases({
  testCases,
  activeTestCase,
  onSelectTestCase,
  onAddTestCase,
  onDeleteTestCase,
  onInputChange,
  onExpectedOutputChange,
  onRunTestCase,
  onRunAll,
  running,
}) {
  const activeCase =
    testCases[activeTestCase];

  return (
    <div className="testcases-container">

      <div className="testcases-header">

        <div>
          <h3>Test Cases</h3>

          <span>
            {testCases.length} test cases
          </span>
        </div>

        <button
          className="run-all-button"
          onClick={onRunAll}
          disabled={running}
        >
          {running
            ? "Running..."
            : "Run All"}
        </button>

      </div>


      <div className="testcase-tabs">

        {testCases.map(
          (testCase, index) => (
            <div
              key={testCase.id}
              className={`testcase-tab ${
                index === activeTestCase
                  ? "active"
                  : ""
              }`}
            >

              <button
                onClick={() =>
                  onSelectTestCase(index)
                }
              >
                Test {index + 1}

                {testCase.status ===
                  "passed" && (
                  <span className="status passed">
                    ✓
                  </span>
                )}

                {testCase.status ===
                  "failed" && (
                  <span className="status failed">
                    ✕
                  </span>
                )}

                {testCase.status ===
                  "error" && (
                  <span className="status error">
                    !
                  </span>
                )}

              </button>


              {testCases.length > 1 && (
                <button
                  className="delete-testcase"
                  onClick={() =>
                    onDeleteTestCase(
                      testCase.id
                    )
                  }
                >
                  ×
                </button>
              )}

            </div>
          )
        )}

        <button
          className="add-testcase"
          onClick={onAddTestCase}
        >
          +
        </button>

      </div>


      {activeCase && (
        <div className="testcase-editor">

          <div className="testcase-field">

            <label>
              Input
            </label>

            <textarea
              value={activeCase.input}
              onChange={(event) =>
                onInputChange(
                  activeCase.id,
                  event.target.value
                )
              }
              placeholder="Enter test input..."
            />

          </div>


          <div className="testcase-field">

            <label>
              Expected Output
            </label>

            <textarea
              value={
                activeCase.expectedOutput
              }
              onChange={(event) =>
                onExpectedOutputChange(
                  activeCase.id,
                  event.target.value
                )
              }
              placeholder="Expected output..."
            />

          </div>


          <div className="testcase-field">

            <label>
              Actual Output
            </label>

            <pre>
              {activeCase.actualOutput ||
                "No output yet."}
            </pre>

          </div>


          {activeCase.error && (
            <div className="testcase-error">
              {activeCase.error}
            </div>
          )}


          <div className="testcase-actions">

            <button
              onClick={() =>
                onRunTestCase(
                  activeCase
                )
              }
              disabled={running}
            >
              {running
                ? "Running..."
                : "Run Test Case"}
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default TestCases;