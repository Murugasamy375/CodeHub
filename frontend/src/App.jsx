import { useEffect, useState } from "react";
import SQLEditor from "./pages/SQLEditor";
import {
  getCurrentSession,
  subscribeToAuthChanges,
} from "./services/authService";

import { getMyProfile } from "./services/profileService";

import AdminVoiceRecordings from "./pages/AdminVoiceRecordings";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import CodeEditor from "./pages/CodeEditor";
import Tasks from "./pages/Tasks";
import Discussions from "./pages/Discussions";
import CreateMeeting from "./pages/CreateMeeting";
import DailyChallenge from "./pages/DailyChallenge";
import DailyChallengeCode from "./pages/DailyChallengeCode";
import LearningResources from "./pages/LearningResources";

import "./App.css";

function App() {
  const [session, setSession] = useState(null);

  const [profile, setProfile] = useState(null);

  const [page, setPage] = useState("dashboard");

  const [authPage, setAuthPage] =
    useState("signin");

  const [loading, setLoading] =
    useState(true);


  // =========================================================
  // LOAD PROFILE FROM BACKEND
  // =========================================================

  const loadProfile = async () => {
    try {
      const currentProfile =
        await getMyProfile();

      setProfile(currentProfile);

      return currentProfile;

    } catch (error) {

      console.error(
        "Failed to load user profile:",
        error
      );

      setProfile(null);

      return null;
    }
  };


  // =========================================================
  // AUTH INITIALIZATION
  // =========================================================

  useEffect(() => {

    const initializeAuth = async () => {

      try {

        const currentSession =
          await getCurrentSession();

        setSession(currentSession);


        if (currentSession) {
          await loadProfile();
        }

      } catch (error) {

        console.error(
          "Failed to initialize authentication:",
          error
        );

      } finally {

        setLoading(false);

      }

    };


    initializeAuth();


    // =====================================================
    // AUTH STATE CHANGES
    // =====================================================

    const subscription =
      subscribeToAuthChanges(
        async (newSession) => {

          setSession(newSession);


          if (!newSession) {

            setProfile(null);

            setPage("dashboard");

            setAuthPage("signin");

            return;
          }


          // User signed in / session refreshed
          await loadProfile();

        }
      );


    return () => {

      subscription.unsubscribe();

    };

  }, []);


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (
      <div className="app-loading">
        Loading CodeHub...
      </div>
    );

  }


  // =========================================================
  // AUTHENTICATION
  // =========================================================

  if (!session) {

    if (authPage === "signup") {

      return (
        <SignUp
          onSwitchToSignIn={() =>
            setAuthPage("signin")
          }
        />
      );

    }


    return (
      <SignIn
        onSwitchToSignUp={() =>
          setAuthPage("signup")
        }
      />
    );

  }


  // =========================================================
  // PROFILE LOADING
  // =========================================================

  if (!profile) {

    return (
      <div className="app-loading">
        Loading your profile...
      </div>
    );

  }


  // =========================================================
  // LEARNING RESOURCES
  // =========================================================

  if (page === "learning-resources") {

    return (
      <div className="app-page-with-credit">

        <LearningResources
          profile={profile}
          onBack={() =>
            setPage("dashboard")
          }
        />

        <DeveloperCredit />

      </div>
    );

  }


  // =========================================================
  // TASKS
  // =========================================================

  if (page === "tasks") {

    return (
      <div className="app-page-with-credit">

        <Tasks
          onBack={() =>
            setPage("dashboard")
          }
        />

        <DeveloperCredit />

      </div>
    );

  }


  // =========================================================
  // CODE EDITOR
  // =========================================================

  if (page === "code-editor") {

    return (
      <div className="app-page-with-credit">

        <CodeEditor
          onBack={() =>
            setPage("dashboard")
          }
          onNavigate={setPage}
        />

        <DeveloperCredit />

      </div>
    );

  }


  // =========================================================
  // DISCUSSIONS
  // =========================================================

  if (page === "discussions") {

    return (
      <div className="app-page-with-credit">

        <Discussions
          onBack={() =>
            setPage("dashboard")
          }
        />

        <DeveloperCredit />

      </div>
    );

  }

if (page === "sql-editor") {
  return (
    <SQLEditor
      onBack={() => setPage("dashboard")}
    />
  );
}
  // =========================================================
  // ADMIN VOICE RECORDINGS
  // =========================================================

  if (page === "admin-voice-recordings") {

    return (
      <div className="app-page-with-credit">

        <AdminVoiceRecordings
          onBack={() =>
            setPage("dashboard")
          }
        />

        <DeveloperCredit />

      </div>
    );

  }


  // =========================================================
  // CREATE MEETING
  // =========================================================

  if (page === "create-meeting") {

    return (
      <div className="app-page-with-credit">

        <CreateMeeting
          onBack={() =>
            setPage("dashboard")
          }
        />

        <DeveloperCredit />

      </div>
    );

  }


  // =========================================================
  // DAILY CHALLENGE
  // =========================================================

  if (page === "challenge") {

    return (
      <div className="app-page-with-credit">

        <DailyChallenge
          isAdmin={
            profile.role === "admin"
          }
          onBack={() =>
            setPage("dashboard")
          }
          onNavigate={setPage}
        />

        <DeveloperCredit />

      </div>
    );

  }


  // =========================================================
  // DAILY CHALLENGE CODE SUBMISSION
  // =========================================================

  if (page === "daily-challenge-code") {

    return (
      <div className="app-page-with-credit">

        <DailyChallengeCode
          onBack={() =>
            setPage("challenge")
          }
        />

        <DeveloperCredit />

      </div>
    );

  }


  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div className="app-page-with-credit">

      <Dashboard
        session={session}
        profile={profile}
        onNavigate={setPage}
      />

      <DeveloperCredit />

    </div>
  );
}


// =============================================================
// DEVELOPER CREDIT
// =============================================================

function DeveloperCredit() {
  return (
    <footer className="developer-credit">

      <span>
        Built by {" "}
      </span>

      <a
        href="https://portfolio-weld-nine-66.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="developer-name"
        title="Visit my portfolio"
      >
         Murugasamy
      </a>

      <span>
        {" "}• Ex-Deloitte
      </span>

    </footer>
  );
}


export default App;