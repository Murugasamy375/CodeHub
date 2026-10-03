import {
  useEffect,
  useState,
} from "react";

import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import CodeEditor from "./pages/CodeEditor";
import Tasks from "./pages/Tasks";
import {
  getCurrentSession,
  subscribeToAuthChanges,
} from "./services/authService";


function App() {

  const [page, setPage] =
    useState("dashboard");

  const [session, setSession] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    const loadSession =
      async () => {

        try {

          const currentSession =
            await getCurrentSession();

          setSession(
            currentSession
          );

        } catch (error) {

          console.error(
            "Failed to load session:",
            error
          );

        } finally {

          setLoading(false);

        }
      };


    loadSession();


    const subscription =
      subscribeToAuthChanges(
        (currentSession) => {

          setSession(
            currentSession
          );

          if (!currentSession) {

            setPage("signin");

          }

        }
      );


    return () => {

      subscription.unsubscribe();

    };

  }, []);


  const handleLoginSuccess =
    (currentSession) => {

      setSession(
        currentSession
      );

      setPage(
        "dashboard"
      );

    };


  if (loading) {

    return (
      <div className="app-loading">

        <h2>
          Loading CodeHub...
        </h2>

      </div>
    );

  }


  /*
   * ==============================
   * NOT AUTHENTICATED
   * ==============================
   */

  if (!session) {

    if (page === "signup") {

      return (
        <SignUp
          onSwitchToSignIn={() =>
            setPage("signin")
          }
        />
      );

    }


    return (
      <SignIn
        onSwitchToSignUp={() =>
          setPage("signup")
        }
        onLoginSuccess={
          handleLoginSuccess
        }
      />
    );

  }


  /*
   * ==============================
   * CODE EDITOR
   * ==============================
   */
  if (page === "tasks") {
  return (
    <Tasks
      onBack={() =>
        setPage("dashboard")
      }
    />
  );
}
  if (page === "code-editor") {

  return (
    <CodeEditor
      onBack={() =>
        setPage("dashboard")
      }
    />
  );

}


  /*
   * ==============================
   * DASHBOARD
   * ==============================
   */

  return (
    <Dashboard
      session={session}
      onNavigate={setPage}
    />
  );
}


export default App;