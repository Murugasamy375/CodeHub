import { useEffect, useState } from "react";

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
  // TASKS
  // =========================================================

  if (page === "tasks") {

    return (
      <Tasks
        onBack={() =>
          setPage("dashboard")
        }
      />
    );

  }


  // =========================================================
  // CODE EDITOR
  // =========================================================

  if (page === "code-editor") {

    return (
      <CodeEditor
        onBack={() =>
          setPage("dashboard")
        }
      />
    );

  }


  // =========================================================
  // DISCUSSIONS
  // =========================================================

  if (page === "discussions") {

    return (
      <Discussions
        onBack={() =>
          setPage("dashboard")
        }
      />
    );

  }
 if (page === "admin-voice-recordings") {
  return (
    <AdminVoiceRecordings
      onBack={() =>
        setPage("dashboard")
      }
    />
  );
}

  // =========================================================
  // CREATE MEETING
  // =========================================================

  if (page === "create-meeting") {

    return (
      <CreateMeeting
        onBack={() =>
          setPage("dashboard")
        }
      />
    );

  }


  // =========================================================
  // DAILY CHALLENGE
  // =========================================================

  if (page === "challenge") {

    return (
      <DailyChallenge
        isAdmin={
          profile.role === "admin"
        }
        onBack={() =>
          setPage("dashboard")
        }
      />
    );

  }


  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <Dashboard
      session={session}
      profile={profile}
      onNavigate={setPage}
    />
  );
}


export default App;