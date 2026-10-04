import logging

from fastapi import HTTPException
from groq import Groq

from app.core.config import GROQ_API_KEY
from app.schemas.code_agent import CodeAgentRequest

logger = logging.getLogger(
    "codehub.code_agent.service"
)

groq_client = Groq(
    api_key=GROQ_API_KEY
)

MODEL_NAME = "openai/gpt-oss-120b"


SYSTEM_PROMPT = """
You are the AI coding assistant inside CodeHub.

Your purpose is to help users with programming,
debugging, errors, algorithms, code explanation,
optimization, and related software-development
questions.

IMPORTANT PRIVACY AND ACCESS RULE:

You do NOT have automatic access to:

- The user's code editor
- Monaco Editor
- Terminal output
- Compiler errors
- Runtime output
- Files
- Project folders
- Database
- Operating system
- Any other application state

You only know information that the user explicitly
provides in the conversation.

If the user asks you to debug code or an error but
has not provided the relevant code or error, politely
ask them to paste it.

Do NOT pretend that you can see their editor or
terminal.

CONVERSATION MEMORY:

The conversation history provided to you is short-term
memory for the current chat session.

Use previous messages when they are relevant to the
current question.

For example, if the user previously discussed a Java
class and then says "optimize it", understand that
"it" refers to the previously discussed code.

Do not claim to remember conversations that are not
included in the provided conversation history.

CODING BEHAVIOR:

- Explain concepts clearly.
- Help debug code provided by the user.
- Identify likely causes of errors.
- Suggest fixes.
- Explain why the fix works.
- Provide corrected code when useful.
- Consider edge cases.
- Mention time and space complexity when relevant.
- Do not unnecessarily overcomplicate simple questions.
- If the user's question is ambiguous, ask for the
  missing information.

SECURITY:

Do not claim to execute code, access files, inspect
the terminal, or inspect the user's computer.

Only analyze code, errors, logs, or other information
that the user explicitly provides.

Keep responses practical and reasonably concise.
"""


def chat_with_code_agent(
    request: CodeAgentRequest,
):
    """
    Send the user's message and short-term conversation
    history to the coding assistant.

    No editor code or terminal information is collected
    automatically.
    """

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        }
    ]

    # Add previous conversation messages.
    for message in request.messages:
        messages.append(
            {
                "role": message.role,
                "content": message.content,
            }
        )

    # Add the user's current message.
    messages.append(
        {
            "role": "user",
            "content": request.message,
        }
    )

    try:
        completion = (
            groq_client
            .chat
            .completions
            .create(
                model=MODEL_NAME,
                messages=messages,
                temperature=0.2,
                max_completion_tokens=1200,
            )
        )

        response = (
            completion
            .choices[0]
            .message
            .content
        )

        if not response:
            raise HTTPException(
                status_code=500,
                detail="AI returned an empty response.",
            )

        logger.info(
            "CODE_AGENT_RESPONSE_SUCCESS"
        )

        return {
            "response": response.strip()
        }

    except HTTPException:
        raise

    except Exception as error:
        logger.error(
            "CODE_AGENT_FAILED error=%s",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to get response from AI coding assistant.",
        )