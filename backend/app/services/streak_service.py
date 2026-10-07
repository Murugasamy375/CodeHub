import os
from datetime import date, timedelta

from supabase import create_client


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY"
)

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


def update_user_streak(
    user_id: str,
    challenge_date: date,
):
    """
    Update the user's streak after a valid
    Daily Challenge submission.

    A streak is updated only when the challenge
    is completed on its actual challenge date.
    """

    today = date.today()

    # --------------------------------------------------
    # 1. Only today's challenge can affect today's streak
    # --------------------------------------------------

    if challenge_date != today:
        return {
            "updated": False,
            "reason": "Challenge was not completed on its actual date.",
        }

    # --------------------------------------------------
    # 2. Get current profile streak data
    # --------------------------------------------------

    response = (
        supabase
        .table("profiles")
        .select(
            "current_streak,"
            "longest_streak,"
            "last_challenge_date"
        )
        .eq("id", user_id)
        .limit(1)
        .execute()
    )

    if not response or not response.data:
        raise ValueError("User profile not found.")

    profile = response.data[0]

    current_streak = (
        profile.get("current_streak") or 0
    )

    longest_streak = (
        profile.get("longest_streak") or 0
    )

    last_challenge_date = profile.get(
        "last_challenge_date"
    )

    # --------------------------------------------------
    # 3. Prevent duplicate streak update
    # --------------------------------------------------

    if last_challenge_date == today.isoformat():
        return {
            "updated": False,
            "reason": "Today's challenge already counted.",
            "current_streak": current_streak,
            "longest_streak": longest_streak,
        }

    # --------------------------------------------------
    # 4. Calculate new streak
    # --------------------------------------------------

    if last_challenge_date:
        previous_date = date.fromisoformat(
            last_challenge_date
        )

        if previous_date == today - timedelta(days=1):
            # Consecutive day
            current_streak += 1

        else:
            # Missed one or more days
            current_streak = 1

    else:
        # First ever completed challenge
        current_streak = 1

    # --------------------------------------------------
    # 5. Update longest streak
    # --------------------------------------------------

    longest_streak = max(
        longest_streak,
        current_streak
    )

    # --------------------------------------------------
    # 6. Save to profiles
    # --------------------------------------------------

    update_response = (
        supabase
        .table("profiles")
        .update(
            {
                "current_streak": current_streak,
                "longest_streak": longest_streak,
                "last_challenge_date": today.isoformat(),
            }
        )
        .eq("id", user_id)
        .execute()
    )

    if not update_response or not update_response.data:
        raise ValueError(
            "Failed to update user streak."
        )

    return {
        "updated": True,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "last_challenge_date": today.isoformat(),
    }