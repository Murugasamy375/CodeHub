import { useEffect, useState } from "react";

import Editor from "../components/code-editor/Editor";
import LanguageSelector from "../components/code-editor/LanguageSelector";
import Toolbar from "../components/code-editor/Toolbar";
import TestCases from "../components/code-editor/TestCases";
import NotesPanel from "../components/code-editor/NotesPanel";

import { runCode } from "../services/codeService";

import "../components/code-editor/code-editor.css";


const templates = {

  python: `# Write your Python code here

print("Hello, CodeHub!")
`,

  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CodeHub!");
    }
}`,

};


const initialTestCases = [

  {
    id: 1,
    input: "",
    expectedOutput: "Hello, CodeHub!",
    actualOutput: "",
    status: "pending",
  },

  {
    id: 2,
    input: "",
    expectedOutput: "Hello, CodeHub!",
    actualOutput: "",
    status: "pending",
  },

  {
    id: 3,
    input: "",
    expectedOutput: "Hello, CodeHub!",
    actualOutput: "",
    status: "pending",
  },

];


function CodeEditor({ onBack }) {

  const [language, setLanguage] =
    useState("python");


  const [code, setCode] =
    useState(templates.python);


  const [input, setInput] =
    useState("");


  const [output, setOutput] =
    useState("");


  const [error, setError] =
    useState("");


  const [executionTime, setExecutionTime] =
    useState(null);


  const [loading, setLoading] =
    useState(false);


  const [testCases, setTestCases] =
    useState(initialTestCases);


  const [activeTestCase, setActiveTestCase] =
    useState(0);


  const [runningTestCases, setRunningTestCases] =
    useState(false);


  const [seconds, setSeconds] =
    useState(0);


  const [timerRunning, setTimerRunning] =
    useState(true);


  /*
   * ========================================
   * STOPWATCH
   * ========================================
   */

  useEffect(() => {

    if (!timerRunning) {
      return;
    }


    const timer = setInterval(() => {

      setSeconds(
        (previous) => previous + 1
      );

    }, 1000);


    return () => {

      clearInterval(timer);

    };

  }, [timerRunning]);


  const formatTime = (totalSeconds) => {

    const minutes =
      Math.floor(totalSeconds / 60);


    const secs =
      totalSeconds % 60;


    return (
      `${String(minutes).padStart(2, "0")}:` +
      `${String(secs).padStart(2, "0")}`
    );

  };


  const handleTimerToggle = () => {

    setTimerRunning(
      (previous) => !previous
    );

  };


  const handleTimerReset = () => {

    setSeconds(0);

    setTimerRunning(true);

  };


  /*
   * ========================================
   * RESET TEST CASES
   * ========================================
   */

  const resetAllTestCases = () => {

    setTestCases(

      initialTestCases.map(
        (testCase) => ({
          ...testCase,
          actualOutput: "",
          status: "pending",
        })
      )

    );


    setActiveTestCase(0);

  };


  /*
   * ========================================
   * LANGUAGE CHANGE
   * ========================================
   */

  const handleLanguageChange = (
    newLanguage
  ) => {

    setLanguage(newLanguage);

    setCode(
      templates[newLanguage]
    );

    setInput("");

    setOutput("");

    setError("");

    setExecutionTime(null);

    resetAllTestCases();

  };


  /*
   * ========================================
   * ADD TEST CASE
   * ========================================
   */

  const handleAddTestCase = () => {

    const newTestCase = {

      id: Date.now(),

      input: "",

      expectedOutput: "",

      actualOutput: "",

      status: "pending",

    };


    setTestCases(
      (previous) => [
        ...previous,
        newTestCase,
      ]
    );


    setActiveTestCase(
      testCases.length
    );

  };


  /*
   * ========================================
   * DELETE TEST CASE
   * ========================================
   */

  const handleDeleteTestCase = (
    testCaseId
  ) => {

    setTestCases(
      (previous) =>
        previous.filter(
          (testCase) =>
            testCase.id !== testCaseId
        )
    );


    setActiveTestCase(
      (previous) => {

        if (
          previous >=
          testCases.length - 1
        ) {

          return Math.max(
            0,
            testCases.length - 2
          );

        }


        return previous;

      }
    );

  };


  /*
   * ========================================
   * TEST CASE INPUT
   * ========================================
   */

  const handleTestCaseInputChange = (
    testCaseId,
    value
  ) => {

    setTestCases(

      (previous) =>

        previous.map(
          (testCase) => {

            if (
              testCase.id !==
              testCaseId
            ) {

              return testCase;

            }


            return {

              ...testCase,

              input: value,

              actualOutput: "",

              status: "pending",

            };

          }
        )

    );

  };


  /*
   * ========================================
   * EXPECTED OUTPUT
   * ========================================
   */

  const handleExpectedOutputChange = (
    testCaseId,
    value
  ) => {

    setTestCases(

      (previous) =>

        previous.map(
          (testCase) => {

            if (
              testCase.id !==
              testCaseId
            ) {

              return testCase;

            }


            return {

              ...testCase,

              expectedOutput: value,

              actualOutput: "",

              status: "pending",

            };

          }
        )

    );

  };


  /*
   * ========================================
   * NORMALIZE OUTPUT
   * ========================================
   */

  const normalizeOutput = (
    value
  ) => {

    return (value || "")
      .replace(/\r\n/g, "\n")
      .trim();

  };


  /*
   * ========================================
   * EXECUTE TEST CASE
   * ========================================
   */

  const executeTestCase = async (
    testCase
  ) => {

    try {

      const result =
        await runCode(
          language,
          code,
          testCase.input
        );


      const actualOutput =
        result.output || "";


      const normalizedActual =
        normalizeOutput(
          actualOutput
        );


      const normalizedExpected =
        normalizeOutput(
          testCase.expectedOutput
        );


      let status = "failed";


      if (
        result.status === "timeout"
      ) {

        status = "timeout";

      } else if (
        result.status !== "success"
      ) {

        status = "error";

      } else if (
        normalizedActual ===
        normalizedExpected
      ) {

        status = "passed";

      }


      return {

        ...testCase,

        actualOutput,

        status,

        error: result.error || "",

      };

    } catch (error) {

      console.error(
        "Test case execution failed:",
        error
      );


      return {

        ...testCase,

        actualOutput: "",

        status: "error",

        error:
          "Unable to connect to backend.",

      };

    }

  };


  /*
   * ========================================
   * RUN SINGLE TEST CASE
   * ========================================
   */

  const handleRunTestCase = async (
    testCase
  ) => {

    setRunningTestCases(true);


    const result =
      await executeTestCase(
        testCase
      );


    setTestCases(
      (previous) =>
        previous.map(
          (item) =>
            item.id === result.id
              ? result
              : item
        )
    );


    setInput(
      testCase.input
    );


    setOutput(
      result.actualOutput
    );


    setError(
      result.error || ""
    );


    setExecutionTime(null);


    setRunningTestCases(false);

  };


  /*
   * ========================================
   * RUN ALL TEST CASES
   * ========================================
   */

  const handleRunAll = async () => {

    setRunningTestCases(true);

    setOutput("");

    setError("");


    const results = [];


    for (
      const testCase of testCases
    ) {

      const result =
        await executeTestCase(
          testCase
        );


      results.push(result);

    }


    setTestCases(results);


    const activeResult =
      results[activeTestCase];


    if (activeResult) {

      setInput(
        activeResult.input
      );


      setOutput(
        activeResult.actualOutput
      );


      setError(
        activeResult.error || ""
      );

    }


    setRunningTestCases(false);

  };


  /*
   * ========================================
   * RUN CODE
   * ========================================
   */

  const handleRun = async () => {

    setLoading(true);

    setOutput("");

    setError("");

    setExecutionTime(null);


    try {

      const result =
        await runCode(
          language,
          code,
          input
        );


      setOutput(
        result.output || ""
      );


      setError(
        result.error || ""
      );


      setExecutionTime(
        result.execution_time ?? null
      );

    } catch (error) {

      console.error(
        "Code execution request failed:",
        error
      );


      setError(
        error.response?.data?.detail ||
        "Unable to connect to the CodeHub backend."
      );

    } finally {

      setLoading(false);

    }

  };


  /*
   * ========================================
   * RESET EDITOR
   * ========================================
   */

  const handleReset = () => {

    setCode(
      templates[language]
    );


    setInput("");

    setOutput("");

    setError("");

    setExecutionTime(null);

    resetAllTestCases();

  };


  /*
   * ========================================
   * UI
   * ========================================
   */

  return (

    <div className="code-editor-page">


      {/* ====================================
          HEADER
      ==================================== */}

      <header className="code-editor-header">


        <div className="editor-header-left">


          <button
            className="back-button"
            onClick={onBack}
          >
            ← Back
          </button>


          <div>

            <h1>
              Code Editor
            </h1>

            <p>
              Write, run and test your code.
            </p>

          </div>


        </div>


        <div className="editor-header-actions">


          <LanguageSelector
            language={language}
            onChange={
              handleLanguageChange
            }
          />


          <div className="stopwatch">


            <span>
              {formatTime(seconds)}
            </span>


            <button
              onClick={
                handleTimerToggle
              }
            >

              {timerRunning
                ? "Pause"
                : "Resume"}

            </button>


            <button
              onClick={
                handleTimerReset
              }
            >
              Reset
            </button>


          </div>


        </div>


      </header>


      {/* ====================================
          EDITOR WORKSPACE
      ==================================== */}

      <main className="editor-workspace">


        <section className="editor-main">


          <Editor
            code={code}
            language={language}
            onChange={setCode}
          />


          <Toolbar
            onRun={handleRun}
            onReset={handleReset}
            loading={loading}
            executionTime={
              executionTime
            }
          />


        </section>


        {/* ==================================
            TEST CASES + OUTPUT
        ================================== */}

        <section className="editor-bottom">


          <TestCases
            testCases={testCases}

            activeTestCase={
              activeTestCase
            }

            onSelectTestCase={
              setActiveTestCase
            }

            onAddTestCase={
              handleAddTestCase
            }

            onDeleteTestCase={
              handleDeleteTestCase
            }

            onInputChange={
              handleTestCaseInputChange
            }

            onExpectedOutputChange={
              handleExpectedOutputChange
            }

            onRunTestCase={
              handleRunTestCase
            }

            onRunAll={
              handleRunAll
            }

            running={
              runningTestCases
            }
          />


          <div className="editor-output-grid">


            {/* INPUT */}

            <div className="editor-panel">


              <div className="panel-header">

                <span>
                  INPUT
                </span>

              </div>


              <textarea
                value={input}
                onChange={(event) =>
                  setInput(
                    event.target.value
                  )
                }
                placeholder="Enter input..."
              />


            </div>


            {/* OUTPUT */}

            <div className="editor-panel">


              <div className="panel-header">

                <span>
                  OUTPUT
                </span>


                {executionTime !== null && (

                  <span>
                    {executionTime} ms
                  </span>

                )}


              </div>


              <pre className="output-content">

                {output ||
                  error ||
                  "Output will appear here..."}

              </pre>


            </div>


          </div>


          {/* ==================================
              NOTES
          ================================== */}

          <NotesPanel />


        </section>


      </main>


    </div>

  );

}


export default CodeEditor;