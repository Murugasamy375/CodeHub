import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function AnnouncementsPopup({
  open,
  onClose,
  profile,
  announcements = [],
  loading = false,
  error = "",
  onPublish,
  onDelete,
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const isAdmin = profile?.role === "admin";

  const latestAnnouncements = useMemo(
    () =>
      [...announcements]
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        )
        .slice(0, 2),
    [announcements]
  );

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!audioFile) {
      setAudioPreviewUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(audioFile);
    setAudioPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioFile]);

  useEffect(
    () => () => {
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  if (!open || typeof document === "undefined") return null;

  const startRecording = async () => {
    try {
      setFormError("");

      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        throw new Error("Voice recording requires a supported browser and HTTPS or localhost.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const supportedType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      const recorder = supportedType
        ? new MediaRecorder(stream, { mimeType: supportedType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const extension = mimeType.includes("mp4") ? "m4a" : "webm";

        if (blob.size > 0) {
          setAudioFile(
            new File([blob], `announcement-${Date.now()}.${extension}`, {
              type: mimeType,
            })
          );
        }

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      setFormError(err?.message || "Could not start voice recording.");
      setRecording(false);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const handlePublish = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Enter an announcement title.");
      return;
    }

    if (!message.trim() && !audioFile) {
      setFormError("Enter a message or record/upload audio.");
      return;
    }

    if (!onPublish) {
      setFormError("Publishing is not connected.");
      return;
    }

    try {
      setSubmitting(true);
      await onPublish({
        title: title.trim(),
        description: message.trim(),
        file: audioFile,
      });
      setTitle("");
      setMessage("");
      setAudioFile(null);
    } catch (err) {
      setFormError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to publish announcement."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (announcement) => {
    if (!onDelete) return;
    if (!window.confirm(`Delete "${announcement.title}"?`)) return;

    setFormError("");
    try {
      await onDelete(announcement.id);
    } catch (err) {
      setFormError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to delete announcement."
      );
    }
  };

  return createPortal(
    <div
      className="announcement-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        className="announcement-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-heading"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="announcement-modal-header">
          <div>
            <span className="announcement-eyebrow">CODEHUB UPDATES</span>
            <h2 id="announcement-heading">Announcements</h2>
            <p>Updates and voice messages from your admin.</p>
          </div>
          <button
            type="button"
            className="announcement-close"
            onClick={onClose}
            aria-label="Close announcements"
          >
            Close
          </button>
        </header>

        {isAdmin && (
          <form className="announcement-admin-form" onSubmit={handlePublish}>
            <h3>Publish an announcement</h3>

            <label htmlFor="announcement-title">Announcement title</label>
            <input
              id="announcement-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter announcement title"
              maxLength={150}
              required
            />

            <label htmlFor="announcement-message">Message</label>
            <textarea
              id="announcement-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write your announcement..."
              rows={3}
            />

            <label htmlFor="announcement-audio">Upload audio (optional)</label>
            <input
              id="announcement-audio"
              type="file"
              accept="audio/*,.webm,.m4a"
              onChange={(event) => setAudioFile(event.target.files?.[0] || null)}
            />

            {audioFile && (
              <div className="announcement-audio-preview">
                <span>{audioFile.name}</span>
                {audioPreviewUrl && <audio controls preload="metadata" src={audioPreviewUrl} />}
                <button type="button" onClick={() => setAudioFile(null)}>
                  Remove audio
                </button>
              </div>
            )}

            <div className="announcement-form-actions">
              <button
                type="button"
                className="announcement-secondary-button"
                onClick={recording ? stopRecording : startRecording}
                disabled={submitting}
              >
                {recording ? "Stop recording" : "Record voice"}
              </button>

              <button
                type="submit"
                className="announcement-publish-button"
                disabled={submitting || recording}
              >
                {submitting ? "Publishing..." : "Publish announcement"}
              </button>
            </div>
          </form>
        )}

        {formError && <p className="announcement-error">{formError}</p>}

        <div className="announcement-list">
          <div className="announcement-list-heading">
            <h3>Latest announcements</h3>
            <span>Showing up to 2</span>
          </div>

          {loading ? (
            <p>Loading announcements...</p>
          ) : error ? (
            <p className="announcement-error">{error}</p>
          ) : latestAnnouncements.length === 0 ? (
            <div className="announcement-empty">
              <h3>No announcements yet</h3>
              <p>New updates will appear here.</p>
            </div>
          ) : (
            latestAnnouncements.map((announcement) => (
              <article className="announcement-item" key={announcement.id}>
                <div className="announcement-item-heading">
                  <h3>{announcement.title}</h3>
                  {isAdmin && (
                    <button
                      type="button"
                      className="announcement-delete-button"
                      onClick={() => handleDelete(announcement)}
                    >
                      Delete
                    </button>
                  )}
                </div>

                {announcement.description && <p>{announcement.description}</p>}

                {(announcement.resource_url || announcement.audio_url) && (
                  <audio
                    controls
                    preload="none"
                    src={announcement.resource_url || announcement.audio_url}
                  />
                )}

                <span className="announcement-date">
                  {announcement.created_at
                    ? new Date(announcement.created_at).toLocaleString()
                    : ""}
                </span>
              </article>
            ))
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}
