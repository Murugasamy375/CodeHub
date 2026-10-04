import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  analyzeMyVoice,
} from "../services/voiceAnalysisService";
import {
  getCurrentChallenge,
  createChallenge,
  deleteChallenge,
} from "../services/dailyChallengeService";

import {
  getMyVoiceSubmission,
  uploadVoiceSubmission,
  deleteVoiceSubmission,
} from "../services/voiceSubmissionService";

import "./daily-challenge.css";


function DailyChallenge({
  isAdmin,
  onBack,
}) {
  // --------------------------------------------------
  // Challenge state
  // --------------------------------------------------

  const [challenge, setChallenge] =
    useState(null);

  const [loadingChallenge, setLoadingChallenge] =
    useState(true);

  const [challengeError, setChallengeError] =
    useState("");

const [aiAnalysis, setAiAnalysis] =
  useState(null);

const [isAnalyzing, setIsAnalyzing] =
  useState(false);

const [analysisError, setAnalysisError] =
  useState("");
  // --------------------------------------------------
  // Admin form state
  // --------------------------------------------------

  const [challengeDate, setChallengeDate] =
    useState("");

  const [title, setTitle] =
    useState("Today's Challenge");

  const [questionsText, setQuestionsText] =
    useState("");

  const [picture, setPicture] =
    useState(null);

  const [publishing, setPublishing] =
    useState(false);

  const [deletingChallenge, setDeletingChallenge] =
    useState(false);

  const [adminMessage, setAdminMessage] =
    useState("");

  const [adminError, setAdminError] =
    useState("");


  // --------------------------------------------------
  // Voice state
  // --------------------------------------------------

  const [voiceSubmission, setVoiceSubmission] =
    useState(null);

  const [isRecording, setIsRecording] =
    useState(false);

  const [audioBlob, setAudioBlob] =
    useState(null);

  const [audioPreviewUrl, setAudioPreviewUrl] =
    useState(null);

  const [isUploadingVoice, setIsUploadingVoice] =
    useState(false);

  const [isDeletingVoice, setIsDeletingVoice] =
    useState(false);

  const [voiceLoading, setVoiceLoading] =
    useState(false);

  const [voiceError, setVoiceError] =
    useState("");


  // --------------------------------------------------
  // MediaRecorder refs
  // --------------------------------------------------

  const mediaRecorderRef =
    useRef(null);

  const mediaStreamRef =
    useRef(null);

  const recordedChunksRef =
    useRef([]);


  // --------------------------------------------------
  // Load challenge
  // --------------------------------------------------

  const loadChallenge = async () => {
    try {
      setLoadingChallenge(true);
      setChallengeError("");

      const currentChallenge =
        await getCurrentChallenge();

      setChallenge(currentChallenge);

      return currentChallenge;
    } catch (error) {
      console.error(
        "Failed to load challenge:",
        error
      );

      setChallengeError(
        error.response?.data?.detail ||
        error.message ||
        "Failed to load today's challenge."
      );

      setChallenge(null);

      return null;
    } finally {
      setLoadingChallenge(false);
    }
  };


  // --------------------------------------------------
  // Load user's existing voice recording
  // --------------------------------------------------

  const loadVoiceSubmission = async (
    challengeId
  ) => {
    try {
      setVoiceLoading(true);
      setVoiceError("");

      const submission =
        await getMyVoiceSubmission(
          challengeId
        );

      setVoiceSubmission(submission);
    } catch (error) {
      console.error(
        "Failed to load voice submission:",
        error
      );

      setVoiceError(
        error.response?.data?.detail ||
        "Failed to load your voice recording."
      );
    } finally {
      setVoiceLoading(false);
    }
  };


  // --------------------------------------------------
  // Initial load
  // --------------------------------------------------

  useEffect(() => {
    const initializePage = async () => {
      const currentChallenge =
        await loadChallenge();

      if (currentChallenge?.id) {
        await loadVoiceSubmission(
          currentChallenge.id
        );
      }
    };

    initializePage();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }

      if (audioPreviewUrl) {
        URL.revokeObjectURL(
          audioPreviewUrl
        );
      }
    };
  }, []);

const handleAnalyzeVoice = async () => {
  if (!challenge?.id) {
    setAnalysisError(
      "Challenge information is not available."
    );
    return;
  }

  if (!voiceSubmission) {
    setAnalysisError(
      "Please save your voice recording first."
    );
    return;
  }

  try {
    setIsAnalyzing(true);
    setAnalysisError("");
    setAiAnalysis(null);

    const result = await analyzeMyVoice(
      challenge.id
    );

    setAiAnalysis(result);
  } catch (error) {
    console.error(
      "Voice analysis failed:",
      error
    );

    setAnalysisError(
      error.response?.data?.detail ||
        "Failed to analyze your voice. Please try again."
    );
  } finally {
    setIsAnalyzing(false);
  }
};
  // --------------------------------------------------
  // Publish challenge
  // --------------------------------------------------

  const handlePublish = async (event) => {
    event.preventDefault();

    setAdminMessage("");
    setAdminError("");

    if (!challengeDate) {
      setAdminError(
        "Challenge date is required."
      );
      return;
    }

    if (!title.trim()) {
      setAdminError(
        "Challenge title is required."
      );
      return;
    }

    if (!questionsText.trim()) {
      setAdminError(
        "Please enter the five questions."
      );
      return;
    }

    if (!picture) {
      setAdminError(
        "Please upload a challenge picture."
      );
      return;
    }

    try {
      setPublishing(true);

      const result =
        await createChallenge({
          challengeDate,
          title: title.trim(),
          questionsText:
            questionsText.trim(),
          picture,
        });

      const createdChallenge =
        result.challenge;

      setChallenge(createdChallenge);

      setAdminMessage(
        "Daily challenge published successfully."
      );

      // Clear form
      setChallengeDate("");
      setQuestionsText("");
      setPicture(null);

      // Clear old voice state
      setVoiceSubmission(null);
      setAudioBlob(null);

      if (audioPreviewUrl) {
        URL.revokeObjectURL(
          audioPreviewUrl
        );
      }

      setAudioPreviewUrl(null);

    } catch (error) {
      console.error(
        "Failed to publish challenge:",
        error
      );

      setAdminError(
        error.response?.data?.detail ||
        error.message ||
        "Failed to publish challenge."
      );
    } finally {
      setPublishing(false);
    }
  };


  // --------------------------------------------------
  // Remove challenge
  // --------------------------------------------------

  const handleDeleteChallenge = async () => {
    if (!challenge) {
      setAdminError(
        "There is no active challenge."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to remove today's challenge?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingChallenge(true);

      setAdminMessage("");
      setAdminError("");

      await deleteChallenge();

      setChallenge(null);

      setVoiceSubmission(null);

      setAdminMessage(
        "Challenge removed successfully."
      );

    } catch (error) {
      console.error(
        "Failed to remove challenge:",
        error
      );

      setAdminError(
        error.response?.data?.detail ||
        error.message ||
        "Failed to remove challenge."
      );
    } finally {
      setDeletingChallenge(false);
    }
  };


  // --------------------------------------------------
  // Start voice recording
  // --------------------------------------------------

  const startRecording = async () => {
    setAiAnalysis(null);
setAnalysisError("");
    try {
      setVoiceError("");

      // Make sure any previous stream is stopped
      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          }
        );

      mediaStreamRef.current = stream;

      // Check browser support
      if (
        !window.MediaRecorder
      ) {
        setVoiceError(
          "Voice recording is not supported by this browser."
        );

        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        return;
      }

      const recorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        recorder;

      recordedChunksRef.current = [];

      recorder.ondataavailable = (
        event
      ) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          recordedChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(
          recordedChunksRef.current,
          {
            type:
              recorder.mimeType ||
              "audio/webm",
          }
        );

        setAudioBlob(blob);

        const url =
          URL.createObjectURL(blob);

        setAudioPreviewUrl(url);

        if (
          mediaStreamRef.current
        ) {
          mediaStreamRef.current
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          mediaStreamRef.current =
            null;
        }
      };

      recorder.onerror = (
        event
      ) => {
        console.error(
          "MediaRecorder error:",
          event
        );

        setVoiceError(
          "An error occurred while recording."
        );

        setIsRecording(false);
      };

      recorder.start();

      setIsRecording(true);

    } catch (error) {
      console.error(
        "Failed to start recording:",
        error
      );

      if (
        error.name ===
        "NotAllowedError"
      ) {
        setVoiceError(
          "Microphone permission was denied. Please allow microphone access."
        );
      } else if (
        error.name ===
        "NotFoundError"
      ) {
        setVoiceError(
          "No microphone was found."
        );
      } else {
        setVoiceError(
          "Unable to access your microphone."
        );
      }

      setIsRecording(false);
    }
  };


  // --------------------------------------------------
  // Stop recording
  // --------------------------------------------------

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current
        .state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };


  // --------------------------------------------------
  // Discard current local recording
  // --------------------------------------------------

  const discardLocalRecording = () => {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(
        audioPreviewUrl
      );
    }

    setAudioPreviewUrl(null);
    setAudioBlob(null);

    recordedChunksRef.current = [];
  };


  // --------------------------------------------------
  // Save voice recording
  // --------------------------------------------------

  const handleVoiceSubmit =
    async () => {
      if (!challenge?.id) {
        setVoiceError(
          "No active challenge found."
        );
        return;
      }

      if (!audioBlob) {
        setVoiceError(
          "Please record your voice first."
        );
        return;
      }

      try {
        setIsUploadingVoice(true);
        setVoiceError("");

        const result =
          await uploadVoiceSubmission(
            challenge.id,
            audioBlob
          );

        setVoiceSubmission(
          result.submission
        );
        setAiAnalysis(null);
setAnalysisError("");

        discardLocalRecording();

      } catch (error) {
        console.error(
          "Failed to save voice recording:",
          error
        );

        setVoiceError(
          error.response?.data?.detail ||
          error.message ||
          "Failed to save voice recording."
        );
      } finally {
        setIsUploadingVoice(false);
      }
    };


  // --------------------------------------------------
  // Delete saved voice recording
  // --------------------------------------------------

  const handleDeleteVoice =
    async () => {
      if (!challenge?.id) {
        return;
      }
      setAiAnalysis(null);
setAnalysisError("");

      const confirmed =
        window.confirm(
          "Delete your voice recording and record again?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setIsDeletingVoice(true);
        setVoiceError("");

        await deleteVoiceSubmission(
          challenge.id
        );

        setVoiceSubmission(null);

      } catch (error) {
        console.error(
          "Failed to delete voice recording:",
          error
        );

        setVoiceError(
          error.response?.data?.detail ||
          error.message ||
          "Failed to delete voice recording."
        );
      } finally {
        setIsDeletingVoice(false);
      }
    };


  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loadingChallenge) {
    return (
      <div className="daily-challenge-page">
        <div className="daily-challenge-loading">
          Loading today's challenge...
        </div>
      </div>
    );
  }


  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="daily-challenge-page">

      {/* -------------------------------------------- */}
      {/* Header */}
      {/* -------------------------------------------- */}

      <div className="daily-challenge-header">

        <button
          className="challenge-back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <div>
          <h1>
            Today's Challenge
          </h1>

          <p>
            Complete today's challenge
            and submit your response.
          </p>
        </div>

      </div>


      {/* -------------------------------------------- */}
      {/* Admin section */}
      {/* -------------------------------------------- */}

      {isAdmin && (
        <div className="challenge-admin-card">

          <div className="challenge-admin-header">

            <div>
              <div className="challenge-section-label">
                ADMIN
              </div>

              <h2>
                Publish Challenge
              </h2>

              <p>
                Upload the challenge
                picture and paste all
                five questions below.
              </p>
            </div>

          </div>


          <form
            onSubmit={handlePublish}
          >

            {/* Challenge date */}

            <div className="challenge-form-group">

              <label>
                Challenge Date
              </label>

              <input
                type="date"
                value={challengeDate}
                onChange={(event) =>
                  setChallengeDate(
                    event.target.value
                  )
                }
              />

            </div>


            {/* Title */}

            <div className="challenge-form-group">

              <label>
                Challenge Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder="Today's Challenge"
              />

            </div>


            {/* Questions */}

            <div className="challenge-form-group">

              <label>
                Questions
              </label>

              <textarea
                value={questionsText}
                onChange={(event) =>
                  setQuestionsText(
                    event.target.value
                  )
                }
                placeholder={`Paste all 5 questions here...

Example:

1. Explain the difference between...
2. Write a program to...
3. What happens when...
4. Solve the following...
5. Explain the time complexity of...`}
                rows={15}
              />

              <small>
                Paste all five questions
                as plain text. No separate
                question fields are required.
              </small>

            </div>


            {/* Picture */}

            <div className="challenge-form-group">

              <label>
                Challenge Picture
              </label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setPicture(
                    event.target.files?.[0] ||
                    null
                  )
                }
              />

              {picture && (
                <div className="selected-picture">

                  Selected:
                  {" "}
                  {picture.name}

                </div>
              )}

            </div>


            {/* Admin messages */}

            {adminError && (
              <div className="challenge-error">
                {adminError}
              </div>
            )}

            {adminMessage && (
              <div className="challenge-success">
                {adminMessage}
              </div>
            )}


            {/* Publish */}

            <button
              type="submit"
              className="publish-challenge-button"
              disabled={
                publishing ||
                deletingChallenge
              }
            >
              {publishing
                ? "Publishing..."
                : "Publish Challenge"}
            </button>

          </form>

        </div>
      )}


      {/* -------------------------------------------- */}
      {/* Challenge error */}
      {/* -------------------------------------------- */}

      {challengeError && (
        <div className="challenge-error">
          {challengeError}
        </div>
      )}


      {/* -------------------------------------------- */}
      {/* No challenge */}
      {/* -------------------------------------------- */}

      {!challenge && !challengeError && (
        <div className="no-challenge-card">

          <div className="challenge-section-label">
            DAILY CHALLENGE
          </div>

          <h2>
            No challenge available
          </h2>

          <p>
            There is currently no
            published challenge.
          </p>

        </div>
      )}


      {/* -------------------------------------------- */}
      {/* Current challenge */}
      {/* -------------------------------------------- */}

      {challenge && (
        <div className="current-challenge-card">

          {/* Challenge header */}

          <div className="current-challenge-header">

            <div>

              <div className="challenge-section-label">
                CURRENT CHALLENGE
              </div>

              <h2>
                {challenge.title}
              </h2>

            </div>


            {/* Admin remove */}

            {isAdmin && (
              <button
                type="button"
                className="remove-challenge-button"
                onClick={
                  handleDeleteChallenge
                }
                disabled={
                  deletingChallenge ||
                  publishing
                }
              >
                {deletingChallenge
                  ? "Removing..."
                  : "Remove Challenge"}
              </button>
            )}

          </div>


          {/* Dates */}

          <div className="challenge-meta">

            <div className="challenge-meta-item">

              <span>
                Challenge Date
              </span>

              <strong>
                {challenge.challenge_date}
              </strong>

            </div>


            {challenge.published_at && (
              <div className="challenge-meta-item">

                <span>
                  Published
                </span>

                <strong>
                  {new Date(
                    challenge.published_at
                  ).toLocaleString()}
                </strong>

              </div>
            )}

          </div>


          {/* Questions */}

          <div className="challenge-content-section">

            <div className="challenge-section-label">
              QUESTIONS
            </div>

            <div className="challenge-questions-text">
              {challenge.questions_text}
            </div>

          </div>


          {/* Picture */}

          {challenge.picture_url && (
            <div className="challenge-content-section">

              <div className="challenge-section-label">
                CHALLENGE PICTURE
              </div>

              <div className="challenge-picture-container">

                <img
                  src={challenge.picture_url}
                  alt="Today's challenge"
                  className="challenge-picture"
                />

              </div>

            </div>
          )}


          {/* ---------------------------------------- */}
          {/* Voice */}
          {/* ---------------------------------------- */}

          {!isAdmin && (
            <div className="challenge-voice-section">

              <div className="challenge-section-label">
                VOICE RESPONSE
              </div>

              <h3>
                Record Your Answer
              </h3>

              <p>
                Record your response
                for today's challenge.
                You can delete it and
                record again anytime.
              </p>


              {/* Voice loading */}

              {voiceLoading && (
                <div className="voice-loading">
                  Loading your recording...
                </div>
              )}


              {/* ------------------------------------ */}
              {/* No saved recording */}
              {/* ------------------------------------ */}

              {!voiceLoading &&
                !voiceSubmission && (
                  <>

                    {/* Start recording */}

                    {!isRecording &&
                      !audioPreviewUrl && (
                        <button
                          type="button"
                          className="voice-record-button"
                          onClick={
                            startRecording
                          }
                        >
                          🎙 Start Recording
                        </button>
                      )}


                    {/* Recording active */}

                    {isRecording && (
                      <div className="voice-recording-active">

                        <div className="voice-recording-indicator">
                          🔴 Recording...
                        </div>

                        <button
                          type="button"
                          className="voice-stop-button"
                          onClick={
                            stopRecording
                          }
                        >
                          ⏹ Stop Recording
                        </button>

                      </div>
                    )}


                    {/* Local preview */}

                    {audioPreviewUrl && (
                      <div className="voice-preview">

                        <audio
                          controls
                          src={
                            audioPreviewUrl
                          }
                        />

                        <div className="voice-preview-actions">

                          <button
                            type="button"
                            onClick={
                              handleVoiceSubmit
                            }
                            disabled={
                              isUploadingVoice
                            }
                          >
                            {isUploadingVoice
                              ? "Saving..."
                              : "Save Recording"}
                          </button>


                          <button
                            type="button"
                            onClick={
                              discardLocalRecording
                            }
                            disabled={
                              isUploadingVoice
                            }
                          >
                            Record Again
                          </button>

                        </div>

                      </div>
                    )}

                  </>
                )}
              {/* ------------------------------------ */}
              {/* Saved recording */}
              {/* ------------------------------------ */}

              {!voiceLoading && voiceSubmission && (
                <div className="voice-saved">

                  <div className="voice-saved-header">
                    ✅ Voice recording saved
                  </div>

                  {voiceSubmission.audio_url && (
                    <audio
                      controls
                      src={voiceSubmission.audio_url}
                    />
                  )}

                  {/* Delete Voice */}
                  <button
                    type="button"
                    className="voice-delete-button"
                    onClick={handleDeleteVoice}
                    disabled={isDeletingVoice}
                  >
                    {isDeletingVoice
                      ? "Deleting..."
                      : "🗑 Delete & Record Again"}
                  </button>

                  {/* Analyze Voice */}
                  <button
                    type="button"
                    className="analyze-voice-button"
                    onClick={handleAnalyzeVoice}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing
                      ? "Analyzing..."
                      : "🤖 Analyze My Explanation"}
                  </button>

                </div>
              )}


              {/* ------------------------------------ */}
              {/* Voice Error */}
              {/* ------------------------------------ */}

              {voiceError && (
                <div className="voice-error">
                  {voiceError}
                </div>
              )}


              {/* ------------------------------------ */}
              {/* AI Analysis Error */}
              {/* ------------------------------------ */}

              {analysisError && (
                <div className="voice-analysis-error">
                  {analysisError}
                </div>
              )}


              {/* ------------------------------------ */}
              {/* AI Analysis Loading */}
              {/* ------------------------------------ */}

              {isAnalyzing && (
                <div className="voice-analysis-loading">

                  <strong>
                    🤖 Analyzing your explanation...
                  </strong>

                  <p>
                    The AI is comparing your explanation
                    with the challenge picture.
                  </p>

                </div>
              )}


              {/* ------------------------------------ */}
              {/* AI Analysis Result */}
              {/* ------------------------------------ */}

              {aiAnalysis && (
                <div className="voice-analysis-result">

                  <div className="voice-analysis-header">

                    <h3>
                      🤖 AI Picture Explanation Feedback
                    </h3>

                    <p>
                      This feedback is temporary and will
                      disappear when you refresh the page.
                    </p>

                  </div>


                  {/* ------------------------------------ */}
                  {/* Transcript */}
                  {/* ------------------------------------ */}

                  {aiAnalysis.transcript && (
                    <div className="analysis-card">

                      <h4>
                        🎙️ Your Explanation
                      </h4>

                      <p>
                        {aiAnalysis.transcript}
                      </p>

                    </div>
                  )}


                  {/* ------------------------------------ */}
                  {/* Picture Relevance */}
                  {/* ------------------------------------ */}

                  {aiAnalysis.feedback?.relevance && (
                    <div className="analysis-card">

                      <h4>
                        🎯 Picture Relevance
                      </h4>

                      <p>
                        {aiAnalysis.feedback.relevance}
                      </p>

                    </div>
                  )}


                  {/* ------------------------------------ */}
                  {/* Details Mentioned */}
                  {/* ------------------------------------ */}

                  {aiAnalysis.feedback?.details_mentioned?.length > 0 && (
                    <div className="analysis-card">

                      <h4>
                        👀 Details You Mentioned
                      </h4>

                      <ul>

                        {aiAnalysis.feedback.details_mentioned.map(
                          (item, index) => (
                            <li key={index}>
                              {item}
                            </li>
                          )
                        )}

                      </ul>

                    </div>
                  )}


                  {/* ------------------------------------ */}
                  {/* Missing Details */}
                  {/* ------------------------------------ */}

                  {aiAnalysis.feedback?.missing_details?.length > 0 && (
                    <div className="analysis-card">

                      <h4>
                        🔍 Details You Missed
                      </h4>

                      <ul>

                        {aiAnalysis.feedback.missing_details.map(
                          (item, index) => (
                            <li key={index}>
                              {item}
                            </li>
                          )
                        )}

                      </ul>

                    </div>
                  )}


                  {/* ------------------------------------ */}
                  {/* Good Words */}
                  {/* ------------------------------------ */}

                  {aiAnalysis.feedback?.good_words?.length > 0 && (
                    <div className="analysis-card">

                      <h4>
                        ✨ Good Words
                      </h4>

                      <ul>

                        {aiAnalysis.feedback.good_words.map(
                          (item, index) => (
                            <li key={index}>
                              {item}
                            </li>
                          )
                        )}

                      </ul>

                    </div>
                  )}


                  {/* ------------------------------------ */}
                  {/* Words To Improve */}
                  {/* ------------------------------------ */}

                  {aiAnalysis.feedback?.words_to_improve?.length > 0 && (
                    <div className="analysis-card">

                      <h4>
                        📝 Words to Improve
                      </h4>

                      <ul>

                        {aiAnalysis.feedback.words_to_improve.map(
                          (item, index) => (
                            <li key={index}>
                              {item}
                            </li>
                          )
                        )}

                      </ul>

                    </div>
                  )}


                  {/* ------------------------------------ */}
                  {/* Clarity */}
                  {/* ------------------------------------ */}

                  {aiAnalysis.feedback?.clarity && (
                    <div className="analysis-card">

                      <h4>
                        💬 Clarity
                      </h4>

                      <p>
                        {aiAnalysis.feedback.clarity}
                      </p>

                    </div>
                  )}


                  {/* ------------------------------------ */}
                  {/* Improvements */}
                  {/* ------------------------------------ */}

                  {aiAnalysis.feedback?.improvements?.length > 0 && (
                    <div className="analysis-card">

                      <h4>
                        🚀 Improvements
                      </h4>

                      <ul>

                        {aiAnalysis.feedback.improvements.map(
                          (item, index) => (
                            <li key={index}>
                              {item}
                            </li>
                          )
                        )}

                      </ul>

                    </div>
                  )}


                  {/* ------------------------------------ */}
                  {/* Overall Feedback */}
                  {/* ------------------------------------ */}

                  {aiAnalysis.feedback?.overall_feedback && (
                    <div className="analysis-card overall-feedback">

                      <h4>
                        ⭐ Overall Feedback
                      </h4>

                      <p>
                        {aiAnalysis.feedback.overall_feedback}
                      </p>

                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default DailyChallenge;