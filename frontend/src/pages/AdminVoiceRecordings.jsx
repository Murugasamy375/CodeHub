import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAllVoiceSubmissions,
} from "../services/voiceSubmissionService";

import "./admin-voice-recordings.css";


function AdminVoiceRecordings({
  onBack,
}) {
  const [submissions, setSubmissions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");


  // ======================================================
  // LOAD RECORDINGS
  // ======================================================

  const loadRecordings = async (
    showLoading = true
  ) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const data =
        await getAllVoiceSubmissions();

      setSubmissions(data);

    } catch (error) {
      console.error(
        "Failed to load voice recordings:",
        error
      );

      setError(
        error.response?.data?.detail ||
        error.message ||
        "Failed to load voice recordings."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    loadRecordings();
  }, []);


  // ======================================================
  // GROUP BY CHALLENGE DATE
  // ======================================================

  const groupedRecordings =
    useMemo(() => {
      const groups = {};

      submissions.forEach(
        (submission) => {
          const challenge =
            submission.challenge || {};

          const date =
            challenge.challenge_date ||
            "Unknown Date";

          if (!groups[date]) {
            groups[date] = [];
          }

          groups[date].push(
            submission
          );
        }
      );

      return Object.entries(groups)
        .sort(
          ([dateA], [dateB]) =>
            dateB.localeCompare(dateA)
        );
    }, [submissions]);


  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (date) => {
    if (!date) {
      return "Unknown";
    }

    const parsed =
      new Date(`${date}T00:00:00`);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return date;
    }

    return parsed.toLocaleDateString(
      undefined,
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };


  const formatDateTime = (
    dateTime
  ) => {
    if (!dateTime) {
      return "Unknown";
    }

    const parsed =
      new Date(dateTime);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return dateTime;
    }

    return parsed.toLocaleString(
      undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };


  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="admin-voice-page">

      {/* ================================================ */}
      {/* HEADER */}
      {/* ================================================ */}

      <div className="admin-voice-header">

        <button
          type="button"
          className="admin-voice-back-button"
          onClick={onBack}
        >
          ← Back
        </button>


        <div className="admin-voice-title">

          <div className="admin-voice-label">
            ADMIN
          </div>

          <h1>
            Voice Recordings
          </h1>

          <p>
            Listen to all user voice
            submissions.
          </p>

        </div>


        <button
          type="button"
          className="admin-voice-refresh-button"
          onClick={() =>
            loadRecordings(false)
          }
          disabled={refreshing}
        >
          {refreshing
            ? "Refreshing..."
            : "↻ Refresh"}
        </button>

      </div>


      {/* ================================================ */}
      {/* SUMMARY */}
      {/* ================================================ */}

      <div className="admin-voice-summary">

        <div className="admin-voice-summary-card">

          <span>
            TOTAL RECORDINGS
          </span>

          <strong>
            {submissions.length}
          </strong>

        </div>


        <div className="admin-voice-summary-card">

          <span>
            CHALLENGE DATES
          </span>

          <strong>
            {groupedRecordings.length}
          </strong>

        </div>

      </div>


      {/* ================================================ */}
      {/* ERROR */}
      {/* ================================================ */}

      {error && (
        <div className="admin-voice-error">
          {error}
        </div>
      )}


      {/* ================================================ */}
      {/* LOADING */}
      {/* ================================================ */}

      {loading && (
        <div className="admin-voice-state">

          <div className="admin-voice-state-icon">
            🎙
          </div>

          <h2>
            Loading recordings...
          </h2>

        </div>
      )}


      {/* ================================================ */}
      {/* EMPTY */}
      {/* ================================================ */}

      {!loading &&
        !error &&
        submissions.length === 0 && (
          <div className="admin-voice-state">

            <div className="admin-voice-state-icon">
              🎙
            </div>

            <h2>
              No Voice Recordings
            </h2>

            <p>
              No users have submitted
              voice recordings yet.
            </p>

          </div>
        )}


      {/* ================================================ */}
      {/* GROUPED RECORDINGS */}
      {/* ================================================ */}

      {!loading &&
        !error &&
        groupedRecordings.length > 0 && (

          <div className="admin-voice-groups">

            {groupedRecordings.map(
              ([date, recordings]) => {

                const first =
                  recordings[0];

                const challenge =
                  first?.challenge || {};

                return (
                  <section
                    className="admin-voice-date-group"
                    key={date}
                  >

                    {/* -------------------------------- */}
                    {/* DATE HEADER */}
                    {/* -------------------------------- */}

                    <div className="admin-voice-date-header">

                      <div>

                        <div className="admin-voice-date-label">
                          CHALLENGE DATE
                        </div>

                        <h2>
                          {formatDate(
                            date
                          )}
                        </h2>

                        <p>
                          {challenge.title ||
                            "Daily Challenge"}
                        </p>

                      </div>


                      <div className="admin-voice-count">
                        {recordings.length}{" "}
                        {recordings.length === 1
                          ? "recording"
                          : "recordings"}
                      </div>

                    </div>


                    {/* -------------------------------- */}
                    {/* RECORDINGS */}
                    {/* -------------------------------- */}

                    <div className="admin-voice-recording-list">

                      {recordings.map(
                        (submission) => {

                          const profile =
                            submission.profile ||
                            {};

                          const userName =
                            profile.full_name ||
                            "Unknown User";

                          const userEmail =
                            profile.email ||
                            "No email";

                          return (
                            <div
                              className="admin-voice-recording-card"
                              key={
                                submission.id
                              }
                            >

                              {/* USER */}

                              <div className="admin-voice-user">

                                <div className="admin-voice-avatar">
                                  {userName
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>


                                <div className="admin-voice-user-info">

                                  <h3>
                                    {userName}
                                  </h3>

                                  <p>
                                    {userEmail}
                                  </p>

                                  <span>
                                    Submitted{" "}
                                    {formatDateTime(
                                      submission.created_at
                                    )}
                                  </span>

                                </div>

                              </div>


                              {/* AUDIO */}

                              <div className="admin-voice-player">

                                {submission.audio_url ? (
                                  <audio
                                    controls
                                    preload="metadata"
                                    src={
                                      submission.audio_url
                                    }
                                  />
                                ) : (
                                  <div className="admin-voice-unavailable">
                                    Audio unavailable
                                  </div>
                                )}

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                  </section>
                );
              }
            )}

          </div>
        )}

    </div>
  );
}


export default AdminVoiceRecordings;