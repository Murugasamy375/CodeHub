import { useEffect, useState } from "react";

import {
  getCurrentChallenge,
} from "../services/dailyChallengeService";

import {
  getDailyCodeDraft,
  saveDailyCodeDraft,
  submitDailyCode,
} from "../services/dailyCodeSubmissionService";

import "./daily-challenge-code.css";


function DailyChallengeCode({ onBack }) {

  // =========================================================
  // CHALLENGE
  // =========================================================

  const [challenge, setChallenge] = useState(null);


  // =========================================================
  // CODE
  // =========================================================

  const [code, setCode] = useState("");

  // Daily challenge currently uses Python.
  // We can make this selectable later if required.
  const [language] = useState("python");


  // =========================================================
  // PAGE STATE
  // =========================================================

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // =========================================================
  // DRAFT STATE
  // =========================================================

  const [draftStatus, setDraftStatus] =
    useState("Draft");

  const [draftLoaded, setDraftLoaded] =
    useState(false);


  // =========================================================
  // SUBMISSION STATE
  // =========================================================

  const [submitting, setSubmitting] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [submitMessage, setSubmitMessage] =
    useState("");

  const [streak, setStreak] =
    useState(null);


  // =========================================================
  // LOAD CHALLENGE + EXISTING DRAFT
  // =========================================================

  useEffect(() => {

    const loadPage = async () => {

      try {

        setLoading(true);
        setError("");


        // -----------------------------------------------
        // Load today's challenge
        // -----------------------------------------------

        const currentChallenge =
          await getCurrentChallenge();

        setChallenge(
          currentChallenge
        );


        // -----------------------------------------------
        // Load user's existing draft
        // -----------------------------------------------

        const existingDraft =
          await getDailyCodeDraft(
            currentChallenge.id
          );


        if (existingDraft) {

          setCode(
            existingDraft.code || ""
          );


          // ---------------------------------------------
          // If already submitted
          // ---------------------------------------------

          if (
            existingDraft.status ===
            "submitted"
          ) {

            setDraftStatus(
              "Submitted"
            );

            setSubmitted(true);

          } else {

            setDraftStatus(
              "Draft restored"
            );

          }

        } else {

          setDraftStatus(
            "No draft yet"
          );

        }


        // -----------------------------------------------
        // Important:
        // Don't start autosave until loading is complete.
        // -----------------------------------------------

        setDraftLoaded(true);

      } catch (error) {

        console.error(
          "Failed to load daily challenge code page:",
          error
        );


        setError(
          error.response?.data?.detail ||
          error.message ||
          "Failed to load today's challenge."
        );

      } finally {

        setLoading(false);

      }

    };


    loadPage();

  }, []);


  // =========================================================
  // AUTO-SAVE DRAFT
  // =========================================================

  useEffect(() => {

    // Don't autosave before initial data is loaded.
    if (!draftLoaded) {
      return;
    }


    // Don't autosave when there is no challenge.
    if (!challenge?.id) {
      return;
    }


    // Don't autosave after final submission.
    if (submitted) {
      return;
    }


    // Don't create unnecessary empty drafts.
    if (!code.trim()) {

      setDraftStatus(
        "No draft yet"
      );

      return;

    }


    setDraftStatus(
      "Saving..."
    );


    const timer =
      setTimeout(async () => {

        try {

          await saveDailyCodeDraft({
            challengeId:
              challenge.id,

            language:
              language,

            code:
              code,
          });


          setDraftStatus(
            "Draft saved ✓"
          );

        } catch (error) {

          console.error(
            "Failed to save daily code draft:",
            error
          );


          setDraftStatus(
            "Save failed"
          );

        }

      }, 1000);


    // Cancel previous timer when user types again.
    return () => {

      clearTimeout(timer);

    };

  }, [
    code,
    challenge,
    language,
    draftLoaded,
    submitted,
  ]);


  // =========================================================
  // FINAL SUBMISSION
  // =========================================================

  const handleSubmit = async () => {

    // -----------------------------------------------
    // Safety checks
    // -----------------------------------------------

    if (!challenge?.id) {
      return;
    }


    if (!code.trim()) {

      setSubmitMessage(
        "Please enter your solutions before submitting."
      );

      return;

    }


    if (submitted) {

      setSubmitMessage(
        "This challenge has already been submitted."
      );

      return;

    }


    try {

      setSubmitting(true);

      setSubmitMessage("");

      setError("");


      // -----------------------------------------------
      // Submit code
      // -----------------------------------------------

      const result =
        await submitDailyCode({
          challengeId:
            challenge.id,

          language:
            language,

          code:
            code,
        });


      // -----------------------------------------------
      // Submission successful
      // -----------------------------------------------

      setSubmitted(true);

      setDraftStatus(
        "Submitted"
      );


      setSubmitMessage(
        result.message ||
        "Code submitted successfully."
      );


      // -----------------------------------------------
      // Streak result
      // -----------------------------------------------

      setStreak(
        result.streak || null
      );

    } catch (error) {

      console.error(
        "Failed to submit daily challenge code:",
        error
      );


      setSubmitMessage(
        error.response?.data?.detail ||
        error.message ||
        "Failed to submit your code."
      );

    } finally {

      setSubmitting(false);

    }

  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <div className="daily-code-page">

        <div className="daily-code-loading">

          Loading today's challenge...

        </div>

      </div>

    );

  }


  // =========================================================
  // ERROR
  // =========================================================

  if (error) {

    return (

      <div className="daily-code-page">

        <button
          type="button"
          className="daily-code-back"
          onClick={onBack}
        >
          ← Back to Today's Challenge
        </button>


        <div className="daily-code-error">

          {error}

        </div>

      </div>

    );

  }


  // =========================================================
  // NO CHALLENGE
  // =========================================================

  if (!challenge) {

    return (

      <div className="daily-code-page">

        <button
          type="button"
          className="daily-code-back"
          onClick={onBack}
        >
          ← Back to Today's Challenge
        </button>


        <div className="daily-code-error">

          No daily challenge is available.

        </div>

      </div>

    );

  }


  // =========================================================
  // MAIN UI
  // =========================================================

  return (

    <div className="daily-code-page">


      {/* =====================================================
          BACK
          ===================================================== */}

      <button
        type="button"
        className="daily-code-back"
        onClick={onBack}
      >
        ← Back to Today's Challenge
      </button>


      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="daily-code-header">

        <div>

          <h1>

            {challenge.title ||
              "Daily Challenge"}

          </h1>


          <p>

            Submit your solution for today's challenge.

          </p>

        </div>

      </div>


      {/* =====================================================
          QUESTIONS
          ===================================================== */}

      <section className="daily-code-questions">

        <h2>

          Today's Questions

        </h2>


        <div className="question-list">

          <div className="question">

            <pre className="question-text">

              {challenge.questions_text}

            </pre>

          </div>

        </div>

      </section>


      {/* =====================================================
          CODE SUBMISSION
          ===================================================== */}

      <section className="daily-code-submission">


        <div className="submission-header">

          <div>

            <h2>

              Your Solution

            </h2>


            <p>

              Write or paste your solutions
              for all five questions.

            </p>

          </div>


          <span className="draft-status">

            {draftStatus}

          </span>

        </div>


        {/* =================================================
            CODE EDITOR
            ================================================= */}

        <textarea
          className="daily-code-editor"
          value={code}
          onChange={(event) =>
            setCode(
              event.target.value
            )
          }
          disabled={submitted}
          placeholder={`# Question 1

# Your solution here


# Question 2

# Your solution here


# Question 3

# Your solution here


# Question 4

# Your solution here


# Question 5

# Your solution here`}
        />


        {/* =================================================
            ACTIONS
            ================================================= */}

        <div className="submission-actions">


          <span className="save-status">

            {draftStatus}

          </span>


          <button
            type="button"
            className="submit-code-button"
            onClick={handleSubmit}
            disabled={
              submitting ||
              submitted
            }
          >

            {submitting
              ? "Submitting..."
              : submitted
              ? "✓ Submitted"
              : "🚀 Submit Challenge"}

          </button>


        </div>


        {/* =================================================
            SUBMISSION MESSAGE
            ================================================= */}

        {submitMessage && (

          <div className="submit-message">

            {submitMessage}

          </div>

        )}


        {/* =================================================
            STREAK RESULT
            ================================================= */}

        {submitted && streak && (

          <div className="submission-streak">

            <div className="streak-title">

              🔥 Coding Streak

            </div>


            {streak.updated ? (

              <div className="streak-value">

                {streak.current_streak} days

              </div>

            ) : (

              <div className="streak-value">

                {streak.current_streak || 0} days

              </div>

            )}


            <div className="streak-best">

              Best:{" "}
              {streak.longest_streak || 0} days

            </div>

          </div>

        )}

      </section>


    </div>

  );

}


export default DailyChallengeCode;