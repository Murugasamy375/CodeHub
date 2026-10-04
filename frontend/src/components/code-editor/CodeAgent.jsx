import { useState } from "react";

import {
  sendCodeAgentMessage,
} from "../../services/codeAgentService";


function CodeAgent() {

  const [isOpen, setIsOpen] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [copiedCode, setCopiedCode] =
    useState(null);


  /* =========================================
     COPY CODE
  ========================================= */

  const handleCopyCode = async (
    code,
    codeId
  ) => {

    try {

      await navigator.clipboard.writeText(
        code
      );

      setCopiedCode(codeId);

      setTimeout(() => {
        setCopiedCode(null);
      }, 1500);

    } catch (error) {

      console.error(
        "Failed to copy code:",
        error
      );

    }
  };


  /* =========================================
     RENDER AI MESSAGE
  ========================================= */

  const renderMessageContent = (
    content,
    messageIndex
  ) => {

    const parts = content.split(
      /(```[\s\S]*?```)/g
    );

    return parts.map(
      (part, partIndex) => {

        /*
         * Normal text
         */

        if (
          !part.startsWith("```")
        ) {
          return (
            <span key={partIndex}>
              {part}
            </span>
          );
        }


        /*
         * Extract language
         *
         * Example:
         *
         * ```java
         * code
         * ```
         */

        const languageMatch =
          part.match(
            /^```([a-zA-Z0-9+#.-]*)/
          );

        const language =
          languageMatch?.[1] || "code";


        /*
         * Remove markdown fences
         */

        const codeContent =
          part
            .replace(
              /^```[a-zA-Z0-9+#.-]*\n?/,
              ""
            )
            .replace(
              /```$/,
              ""
            );


        /*
         * Unique ID for this
         * particular code block
         */

        const codeId =
          `${messageIndex}-${partIndex}`;


        return (
          <div
            key={partIndex}
            className="code-agent-code-wrapper"
          >

            {/* Code Header */}

            <div className="code-agent-code-header">

              <span>
                {language}
              </span>


              <button
                type="button"
                className="code-agent-copy-button"
                onClick={() =>
                  handleCopyCode(
                    codeContent,
                    codeId
                  )
                }
              >
                {copiedCode === codeId
                  ? "✓ Copied"
                  : "Copy"}
              </button>

            </div>


            {/* Code */}

            <pre className="code-agent-code-block">

              <code>
                {codeContent}
              </code>

            </pre>

          </div>
        );

      }
    );
  };


  /* =========================================
     SEND MESSAGE
  ========================================= */

  const handleSendMessage = async () => {

    const trimmedMessage =
      message.trim();


    if (
      !trimmedMessage ||
      isLoading
    ) {
      return;
    }


    setError("");


    /*
     * Current user message
     */

    const userMessage = {
      role: "user",
      content: trimmedMessage,
    };


    /*
     * Add user message to UI
     */

    const updatedMessages = [
      ...messages,
      userMessage,
    ];


    setMessages(
      updatedMessages
    );


    /*
     * Clear input
     */

    setMessage("");


    /*
     * Start loading
     */

    setIsLoading(true);


    try {

      /*
       * Send ONLY:
       *
       * 1. Current message
       * 2. Previous chat memory
       *
       * No editor code.
       * No terminal.
       * No filesystem.
       */

      const result =
        await sendCodeAgentMessage({
          message: trimmedMessage,
          messages: messages,
        });


      /*
       * AI response
       */

      const assistantMessage = {
        role: "assistant",
        content: result.response,
      };


      /*
       * Add AI response
       */

      setMessages([
        ...updatedMessages,
        assistantMessage,
      ]);

    } catch (error) {

      console.error(
        "Code Agent Error:",
        error
      );


      setError(
        error.response?.data?.detail ||
        "Failed to get AI response."
      );

    } finally {

      setIsLoading(false);

    }
  };


  /* =========================================
     CLEAR CHAT
  ========================================= */

  const handleClearChat = () => {

    if (isLoading) {
      return;
    }


    setMessages([]);

    setMessage("");

    setError("");

    setCopiedCode(null);

  };


  /* =========================================
     KEYBOARD HANDLER
  ========================================= */

  const handleKeyDown = (
    event
  ) => {

    /*
     * Enter
     * → Send
     *
     * Shift + Enter
     * → New line
     */

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      handleSendMessage();

    }

  };


  /* =========================================
     COMPONENT
  ========================================= */

  return (
    <>

      {/* =====================================
          FLOATING AI BUTTON
      ===================================== */}

      {!isOpen && (
        <button
          type="button"
          className="code-agent-floating-button"
          onClick={() =>
            setIsOpen(true)
          }
          title="Open AI Assistant"
        >
          🤖
        </button>
      )}


      {/* =====================================
          AI CHAT PANEL
      ===================================== */}

      {isOpen && (
        <div className="code-agent-panel">


          {/* =================================
              HEADER
          ================================= */}

          <div className="code-agent-header">

            <div>

              <strong>
                🤖 CodeHub AI
              </strong>

              <span>
                Coding Assistant
              </span>

            </div>


            <div className="code-agent-header-actions">

              {/* Clear Chat */}

              <button
                type="button"
                className="code-agent-clear"
                onClick={handleClearChat}
                disabled={isLoading}
                title="Clear conversation"
              >
                Clear
              </button>


              {/* Close */}

              <button
                type="button"
                className="code-agent-close"
                onClick={() =>
                  setIsOpen(false)
                }
                title="Close"
              >
                ✕
              </button>

            </div>

          </div>


          {/* =================================
              MESSAGES
          ================================= */}

          <div className="code-agent-messages">


            {/* Welcome */}

            {messages.length === 0 && (
              <div className="code-agent-welcome">

                <div className="code-agent-welcome-icon">
                  🤖
                </div>


                <h3>
                  How can I help?
                </h3>


                <p>
                  Paste your code or error
                  message here and I'll help
                  you understand or fix it.
                </p>


                <small>
                  I don't automatically access
                  your editor or terminal.
                </small>

              </div>
            )}


            {/* Conversation */}

            {messages.map(
              (item, index) => (

                <div
                  key={index}
                  className={
                    item.role === "user"
                      ? "code-agent-message user"
                      : "code-agent-message assistant"
                  }
                >

                  {/* Role */}

                  <div className="code-agent-message-role">

                    {item.role === "user"
                      ? "You"
                      : "🤖 AI"}

                  </div>


                  {/* Content */}

                  <div className="code-agent-message-content">

                    {item.role === "assistant"
                      ? renderMessageContent(
                          item.content,
                          index
                        )
                      : item.content}

                  </div>

                </div>

              )
            )}


            {/* Loading */}

            {isLoading && (
              <div className="code-agent-message assistant">

                <div className="code-agent-message-role">
                  🤖 AI
                </div>

                <div className="code-agent-typing">
                  Thinking...
                </div>

              </div>
            )}

          </div>


          {/* =================================
              ERROR
          ================================= */}

          {error && (
            <div className="code-agent-error">
              {error}
            </div>
          )}


          {/* =================================
              INPUT
          ================================= */}

          <div className="code-agent-input-area">

            <textarea
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              onKeyDown={handleKeyDown}
              placeholder="Paste your code or error..."
              rows={3}
              disabled={isLoading}
            />


            <button
              type="button"
              onClick={
                handleSendMessage
              }
              disabled={
                isLoading ||
                !message.trim()
              }
            >
              {isLoading
                ? "..."
                : "Send"}
            </button>

          </div>

        </div>
      )}

    </>
  );
}


export default CodeAgent;