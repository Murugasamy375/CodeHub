import { useEffect, useRef, useState } from "react";

import { connectToDiscussion } from "../services/discussionService";

import "./discussions.css";


function Discussions({ onBack }) {

  const [messages, setMessages] = useState([]);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [connected, setConnected] = useState(false);

  const websocketRef = useRef(null);

  const messagesEndRef = useRef(null);


  useEffect(() => {

    let active = true;

    const connect = async () => {

      try {

        setLoading(true);
        setError("");

        const websocket = await connectToDiscussion({

          onHistory: (history) => {

            if (!active) return;

            setMessages(history);

            setLoading(false);

          },

          onMessage: (newMessage) => {

            if (!active) return;

            setMessages((previous) => [
              ...previous,
              newMessage,
            ]);

          },

          onError: (message) => {

            if (!active) return;

            setError(message);

          },

          onClose: () => {

            if (!active) return;

            setConnected(false);

          },

        });

        websocketRef.current = websocket;

        websocket.addEventListener(
          "open",
          () => {

            if (active) {
              setConnected(true);
            }

          }
        );

      } catch (error) {

        if (!active) return;

        setError(
          error.message ||
          "Failed to connect to discussion."
        );

        setLoading(false);

      }

    };

    connect();

    return () => {

      active = false;

      if (websocketRef.current) {

        websocketRef.current.close();

        websocketRef.current = null;

      }

    };

  }, []);


  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages]);


  const sendMessage = (event) => {

    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    const websocket = websocketRef.current;

    if (
      !websocket ||
      websocket.readyState !== WebSocket.OPEN
    ) {

      setError("Discussion connection is not available.");

      return;

    }

    websocket.send(
      JSON.stringify({
        message: trimmedMessage,
      })
    );

    setMessage("");

  };


  return (

    <div className="discussion-page">

      <header className="discussion-header">

        <button
          className="discussion-back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <div>

          <h1>Discussion</h1>

          <p>
            Discuss today's challenges with other members.
          </p>

        </div>

        <div
          className={`connection-status ${
            connected ? "online" : "offline"
          }`}
        >
          <span></span>

          {connected ? "Connected" : "Disconnected"}

        </div>

      </header>


      <main className="discussion-container">

        <div className="discussion-card">

          <div className="discussion-title">

            <div>

              <span className="discussion-label">
                TODAY
              </span>

              <h2>Community Discussion</h2>

            </div>

            <span className="message-count">
              {messages.length} messages
            </span>

          </div>


          <div className="discussion-messages">

            {loading && (

              <div className="discussion-empty">
                Loading discussion...
              </div>

            )}


            {!loading && messages.length === 0 && (

              <div className="discussion-empty">

                <div className="empty-icon">
                  💬
                </div>

                <h3>
                  No messages yet
                </h3>

                <p>
                  Start the discussion for today.
                </p>

              </div>

            )}


            {!loading &&
              messages.map((item, index) => (

                <div
                  className="discussion-message"
                  key={`${item.created_at}-${index}`}
                >

                  <div className="message-avatar">
                    {item.full_name
                      ?.charAt(0)
                      ?.toUpperCase() || "U"}
                  </div>

                  <div className="message-content">

                    <div className="message-meta">

                      <strong>
                        {item.full_name}
                      </strong>

                      <span>
                        {new Date(
                          item.created_at
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                    </div>

                    <p>
                      {item.message}
                    </p>

                  </div>

                </div>

              ))}

            <div ref={messagesEndRef} />

          </div>


          {error && (

            <div className="discussion-error">
              {error}
            </div>

          )}


          <form
            className="discussion-input-area"
            onSubmit={sendMessage}
          >

            <input
              type="text"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder="Write a message..."
              maxLength={1000}
              disabled={!connected}
            />

            <button
              type="submit"
              disabled={
                !connected ||
                !message.trim()
              }
            >
              Send
            </button>

          </form>

          <div className="discussion-footer">

            Messages are temporary and cleared at the
            end of the day.

          </div>

        </div>

      </main>

    </div>

  );

}


export default Discussions;