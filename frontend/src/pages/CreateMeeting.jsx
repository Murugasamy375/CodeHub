import { useEffect, useState } from "react";

import {
  createMeeting,
  deleteMeeting,
  getCurrentMeeting,
} from "../services/meetingService";

import "./create-meeting.css";


function CreateMeeting({ onBack }) {

  const [title, setTitle] =
    useState("CodeHub Sunday Meeting");

  const [date, setDate] =
    useState("");

  const [time, setTime] =
    useState("");

  const [meetingLink, setMeetingLink] =
    useState("");

  const [currentMeeting, setCurrentMeeting] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [loadingMeeting, setLoadingMeeting] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  // --------------------------------------------------
  // LOAD CURRENT MEETING
  // --------------------------------------------------

  useEffect(() => {

    const loadCurrentMeeting =
      async () => {

        try {

          setLoadingMeeting(true);

          const meeting =
            await getCurrentMeeting();

          setCurrentMeeting(meeting);

        } catch (err) {

          console.error(
            "Failed to load current meeting:",
            err
          );

        } finally {

          setLoadingMeeting(false);

        }
      };


    loadCurrentMeeting();

  }, []);


  // --------------------------------------------------
  // CREATE MEETING
  // --------------------------------------------------

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setMessage("");
    setError("");


    if (!title.trim()) {

      setError(
        "Meeting title is required."
      );

      return;
    }


    if (!date) {

      setError(
        "Meeting date is required."
      );

      return;
    }


    if (!time) {

      setError(
        "Meeting time is required."
      );

      return;
    }


    if (!meetingLink.trim()) {

      setError(
        "Google Meet link is required."
      );

      return;
    }


    if (
      !meetingLink.startsWith(
        "https://"
      )
    ) {

      setError(
        "Please enter a valid HTTPS meeting link."
      );

      return;
    }


    try {

      setLoading(true);

      const result =
        await createMeeting({

          title: title.trim(),

          meeting_date: date,

          meeting_time: time,

          meeting_link:
            meetingLink.trim(),

        });


      console.log(
        "Meeting created:",
        result
      );


      setCurrentMeeting(
        result.meeting
      );


      setMessage(
        "Meeting published successfully."
      );


      setDate("");
      setTime("");
      setMeetingLink("");


    } catch (err) {

      console.error(
        "Failed to create meeting:",
        err
      );


      setError(
        err.response?.data?.detail ||
        err.message ||
        "Failed to publish meeting."
      );


    } finally {

      setLoading(false);

    }
  };


  // --------------------------------------------------
  // DELETE MEETING
  // --------------------------------------------------

  const handleDeleteMeeting =
    async () => {

      if (!currentMeeting) {

        setError(
          "There is no active meeting to remove."
        );

        return;
      }


      const confirmed =
        window.confirm(
          "Are you sure you want to remove the current meeting?"
        );


      if (!confirmed) {
        return;
      }


      setMessage("");
      setError("");


      try {

        setDeleting(true);


        await deleteMeeting();


        setCurrentMeeting(null);


        setMessage(
          "Meeting removed successfully."
        );


      } catch (err) {

        console.error(
          "Failed to delete meeting:",
          err
        );


        setError(
          err.response?.data?.detail ||
          err.message ||
          "Failed to remove meeting."
        );


      } finally {

        setDeleting(false);

      }
    };


  return (

    <div className="create-meeting-page">


      <div className="create-meeting-header">

        <button
          className="meeting-back-button"
          onClick={onBack}
        >
          ← Back
        </button>


        <div>

          <h1>
            Create Meeting
          </h1>

          <p>
            Publish the upcoming CodeHub meeting.
          </p>

        </div>

      </div>


      <div className="meeting-form-card">


        {/* CURRENT MEETING */}

        {!loadingMeeting &&
          currentMeeting && (

            <div
              style={{
                marginBottom: "24px",
                padding: "18px",
                borderRadius: "10px",
                background: "#161b22",
                border: "1px solid #30363d",
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "20px",
                }}
              >

                <div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#8b949e",
                      marginBottom: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Current Meeting
                  </div>


                  <h3
                    style={{
                      margin: "0 0 8px",
                    }}
                  >
                    {currentMeeting.title}
                  </h3>


                  <p
                    style={{
                      margin: "4px 0",
                      color: "#c9d1d9",
                    }}
                  >
                    📅 {currentMeeting.meeting_date}
                  </p>


                  <p
                    style={{
                      margin: "4px 0",
                      color: "#c9d1d9",
                    }}
                  >
                    🕐 {currentMeeting.meeting_time}
                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    handleDeleteMeeting
                  }
                  disabled={deleting || loading}
                  style={{
                    padding:
                      "10px 16px",
                    borderRadius: "8px",
                    border:
                      "1px solid #dc2626",
                    background:
                      "transparent",
                    color: "#ef4444",
                    cursor:
                      deleting
                        ? "not-allowed"
                        : "pointer",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {deleting
                    ? "Removing..."
                    : "Remove Meeting"}
                </button>

              </div>

            </div>

          )}


        <form
          onSubmit={handleSubmit}
        >


          {/* TITLE */}

          <div
            className="meeting-form-group"
          >

            <label>
              Meeting Title
            </label>


            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="CodeHub Sunday Meeting"
            />

          </div>


          {/* DATE + TIME */}

          <div
            className="meeting-form-row"
          >

            <div
              className="meeting-form-group"
            >

              <label>
                Date
              </label>


              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(
                    event.target.value
                  )
                }
              />

            </div>


            <div
              className="meeting-form-group"
            >

              <label>
                Time
              </label>


              <input
                type="time"
                value={time}
                onChange={(event) =>
                  setTime(
                    event.target.value
                  )
                }
              />

            </div>

          </div>


          {/* MEETING LINK */}

          <div
            className="meeting-form-group"
          >

            <label>
              Google Meet Link
            </label>


            <input
              type="url"
              value={meetingLink}
              onChange={(event) =>
                setMeetingLink(
                  event.target.value
                )
              }
              placeholder="https://meet.google.com/..."
            />

          </div>


          {/* ERROR */}

          {error && (

            <div
              className="meeting-error"
            >
              {error}
            </div>

          )}


          {/* SUCCESS */}

          {message && (

            <div
              className="meeting-success"
            >
              {message}
            </div>

          )}


          {/* PUBLISH */}

          <button
            type="submit"
            className="publish-meeting-button"
            disabled={
              loading ||
              deleting
            }
          >
            {loading
              ? "Publishing..."
              : "Publish Meeting"}
          </button>


        </form>

      </div>

    </div>
  );
}


export default CreateMeeting;