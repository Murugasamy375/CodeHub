import { useEffect, useState } from "react";

import { signOut } from "../services/authService";
import { getTaskCount } from "../services/taskService";
import { getCurrentMeeting } from "../services/meetingService";

import "./dashboard.css";


function Dashboard({ session,profile, onNavigate }) {
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const [loggingOut, setLoggingOut] = useState(false);

  // --------------------------------------------------
  // TASKS
  // --------------------------------------------------

  const [taskCount, setTaskCount] = useState(0);
  const [taskCountLoading, setTaskCountLoading] = useState(true);

  // --------------------------------------------------
  // MEETING
  // --------------------------------------------------

  const [meeting, setMeeting] = useState(null);
  const [meetingLoading, setMeetingLoading] = useState(true);

  // --------------------------------------------------
  // PROFILE / ADMIN
  // --------------------------------------------------

  // --------------------------------------------------
  // CALENDAR
  // --------------------------------------------------

  const [currentMonth, setCurrentMonth] = useState(
    new Date()
  );

  // --------------------------------------------------
  // USER DETAILS
  // --------------------------------------------------

  const userName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split("@")[0] ||
    "User";

  const userEmail =
    session?.user?.email || "";

  // =========================================================
  // LOAD TASK COUNT
  // =========================================================

  useEffect(() => {
    const loadTaskCount = async () => {
      try {
        setTaskCountLoading(true);

        const count = await getTaskCount();

        setTaskCount(count);
      } catch (error) {
        console.error(
          "Failed to load task count:",
          error
        );

        setTaskCount(0);
      } finally {
        setTaskCountLoading(false);
      }
    };

    loadTaskCount();
  }, []);

  // =========================================================
  // LOAD CURRENT MEETING
  // =========================================================

  useEffect(() => {
    const loadMeeting = async () => {
      try {
        setMeetingLoading(true);

        const currentMeeting =
          await getCurrentMeeting();

        setMeeting(currentMeeting);
      } catch (error) {
        console.error(
          "Failed to load meeting:",
          error
        );

        setMeeting(null);
      } finally {
        setMeetingLoading(false);
      }
    };

    loadMeeting();
  }, []);

  // =========================================================
  

  // =========================================================
  // NAVIGATION
  // =========================================================

  const handleNavigation = (menu) => {
    setActiveMenu(menu);

    if (menu === "dashboard") {
      onNavigate("dashboard");
      return;
    }

    if (menu === "code-editor") {
      onNavigate("code-editor");
      return;
    }

    if (menu === "tasks") {
      onNavigate("tasks");
      return;
    }

    if (menu === "challenge") {
      onNavigate("challenge");
      return;
    }

    if (menu === "discussions") {
      onNavigate("discussions");
      return;
    }

    if (menu === "create-meeting") {
      onNavigate("create-meeting");
      return;
    }
    if (menu === "admin-voice-recordings") {
  onNavigate("admin-voice-recordings");
  return;
}
    onNavigate("dashboard");
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await signOut();
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );

      setLoggingOut(false);
    }
  };

  // =========================================================
  // CALENDAR
  // =========================================================

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ];

  const year =
    currentMonth.getFullYear();

  const month =
    currentMonth.getMonth();

  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const calendarDays = [];

  // Empty cells before first day
  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    calendarDays.push(null);
  }

  // Actual days
  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    calendarDays.push(day);
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(
        year,
        month - 1,
        1
      )
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(
        year,
        month + 1,
        1
      )
    );
  };

  const goToToday = () => {
    setCurrentMonth(
      new Date()
    );
  };

  const today = new Date();

  const isToday = (day) => {
    if (!day) {
      return false;
    }

    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="dashboard-layout">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="dashboard-sidebar">

        {/* BRAND */}

        <div className="sidebar-brand">

          <div className="brand-logo">
            C
          </div>

          <div>
            <h2>CodeHub</h2>

            <span>
              Developer Workspace
            </span>
          </div>

        </div>


        {/* NAVIGATION */}

        <nav className="sidebar-nav">

          {/* DASHBOARD */}

          <button
            className={
              activeMenu === "dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              handleNavigation("dashboard")
            }
          >
            <span className="nav-icon">
              ⌂
            </span>

            Dashboard
          </button>


          {/* CODE EDITOR */}

          <button
            className={
              activeMenu === "code-editor"
                ? "active"
                : ""
            }
            onClick={() =>
              handleNavigation("code-editor")
            }
          >
            <span className="nav-icon">
              {"</>"}
            </span>

            Code Editor
          </button>


          {/* TODAY'S CHALLENGE */}

          <button
            className={
              activeMenu === "challenge"
                ? "active"
                : ""
            }
            onClick={() =>
              handleNavigation("challenge")
            }
          >
            <span className="nav-icon">
              ⚡
            </span>

            Today's Challenge
          </button>


          {/* MY TASKS */}

          <button
            className={
              activeMenu === "tasks"
                ? "active"
                : ""
            }
            onClick={() =>
              handleNavigation("tasks")
            }
          >
            <span className="nav-icon">
              ✓
            </span>

            My Tasks
          </button>


          {/* DISCUSSIONS */}

          <button
            className={
              activeMenu === "discussions"
                ? "active"
                : ""
            }
            onClick={() =>
              handleNavigation("discussions")
            }
          >
            <span className="nav-icon">
              💬
            </span>

            Discussions
          </button>


          {/* =================================================
              ADMIN
          ================================================= */}

          {profile?.role === "admin" && (
  <>
    <div className="sidebar-nav-divider" />

    <div className="sidebar-section-label">
      ADMIN
    </div>

    <button
      className={
        activeMenu === "create-meeting"
          ? "active"
          : ""
      }
      onClick={() =>
        handleNavigation(
          "create-meeting"
        )
      }
    >
      <span className="nav-icon">
        📅
      </span>

      Create Meeting
    </button>

    <button
      className={
        activeMenu ===
        "admin-voice-recordings"
          ? "active"
          : ""
      }
      onClick={() =>
        handleNavigation(
          "admin-voice-recordings"
        )
      }
    >
      <span className="nav-icon">
        🎙
      </span>

      Voice Recordings
    </button>
  </>
)}

        </nav>


        {/* USER */}

        <div className="sidebar-bottom">

          <div className="sidebar-user">

            <div className="user-avatar">
              {userName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="user-details">

              <strong>
                {userName}
              </strong>

              <span>
                {userEmail}
              </span>

            </div>

          </div>


          <button
            className="logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <span>↪</span>

            {loggingOut
              ? "Signing out..."
              : "Sign Out"}
          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="dashboard-main">

        {/* TOP BAR */}

        <header className="dashboard-topbar">

          <div>

            <span className="dashboard-eyebrow">
              OVERVIEW
            </span>

            <h1>
              Dashboard
            </h1>

          </div>


          <div className="topbar-user">

            <div className="topbar-avatar">
              {userName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>

              <strong>
                {userName}
              </strong>

              <span>
                {profile?.role === "admin"
                  ? "Admin"
                  : "Member"}
              </span>

            </div>

          </div>

        </header>


        {/* =====================================================
            WELCOME
        ===================================================== */}

        <section className="welcome-section">

          <span className="welcome-label">
            WELCOME BACK 👋
          </span>

          <h2>
            Ready to build something,{" "}
            {userName.split(" ")[0]}?
          </h2>

          <p>
            Keep your coding practice,
            challenges and tasks organized.
          </p>

        </section>


        {/* =====================================================
            DASHBOARD CARDS
        ===================================================== */}

        <section className="dashboard-cards">

          {/* TODAY'S CHALLENGE */}

          <div className="dashboard-card">

            <div className="card-header">

              <div>

                <span className="card-label">
                  PRACTICE
                </span>

                <h2>
                  Today's Challenge
                </h2>

              </div>

              <span className="card-icon">
                ⚡
              </span>

            </div>


            <div className="challenge-card-content">

              <div className="challenge-number">
                05
              </div>

              <div>

                <strong>
                  Coding Challenges
                </strong>

                <p>
                  Complete today's problems
                  and improve your skills.
                </p>

              </div>

            </div>


            <button
              className="card-action-button"
              onClick={() =>
                handleNavigation(
                  "challenge"
                )
              }
            >
              Start Challenge →
            </button>

          </div>


          {/* MY TASKS */}

          <div className="dashboard-card">

            <div className="card-header">

              <div>

                <span className="card-label">
                  PRODUCTIVITY
                </span>

                <h2>
                  My Tasks
                </h2>

              </div>

              <span className="card-icon">
                ✓
              </span>

            </div>


            <div className="task-count-content">

              {taskCountLoading ? (

                <div className="task-count-loading">
                  Loading...
                </div>

              ) : (

                <>
                  <div className="task-count-number">
                    {taskCount}
                  </div>

                  <div className="task-count-label">
                    {taskCount === 1
                      ? "task for today"
                      : "tasks for today"}
                  </div>
                </>

              )}

            </div>


            <button
              className="view-tasks-button"
              onClick={() =>
                handleNavigation("tasks")
              }
            >
              Manage Tasks →
            </button>

          </div>

        </section>


        {/* =====================================================
            SUNDAY MEETING
        ===================================================== */}

        <section className="dashboard-meeting-section">

          <div className="dashboard-section-header">

            <span className="card-label">
              COMMUNITY
            </span>

            <h2>
              Sunday Meeting
            </h2>

          </div>


          {meetingLoading ? (

            <div className="meeting-dashboard-card">

              <div className="meeting-card-content">

                <h3>
                  Loading meeting...
                </h3>

              </div>

            </div>

          ) : meeting ? (

            <div className="meeting-dashboard-card">

              <div className="meeting-card-content">

                <span className="meeting-label">
                  UPCOMING MEETING
                </span>

                <h3>
                  {meeting.title}
                </h3>

                <div className="meeting-details">

                  <span>
                    📅 {meeting.meeting_date}
                  </span>

                  <span>
                    🕐 {meeting.meeting_time}
                  </span>

                </div>

              </div>


              <a
                href={meeting.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="join-meeting-button"
              >
                Join Meeting
              </a>

            </div>

          ) : (

            <div className="meeting-dashboard-card empty">

              <h3>
                No meeting scheduled
              </h3>

              <p>
                The next CodeHub Sunday meeting
                will appear here when the admin
                publishes it.
              </p>

            </div>

          )}

        </section>


        {/* =====================================================
            CALENDAR
        ===================================================== */}

        <section className="calendar-card">

          {/* CALENDAR HEADER */}

          <div className="calendar-header">

            <div>

              <span className="card-label">
                ACTIVITY
              </span>

              <h2>
                Calendar
              </h2>

              <p>
                Track your daily coding activity
              </p>

            </div>


            <div className="calendar-controls">

              <button
                onClick={
                  goToPreviousMonth
                }
                title="Previous month"
              >
                ‹
              </button>

              <button
                className="calendar-today-button"
                onClick={goToToday}
              >
                Today
              </button>

              <button
                onClick={
                  goToNextMonth
                }
                title="Next month"
              >
                ›
              </button>

            </div>

          </div>


          {/* MONTH */}

          <div className="calendar-month-title">
            {monthNames[month]} {year}
          </div>


          {/* CALENDAR GRID */}

          <div className="simple-calendar-grid">

            {weekDays.map(
              (day) => (

                <div
                  key={day}
                  className="simple-calendar-weekday"
                >
                  {day}
                </div>

              )
            )}


            {calendarDays.map(
              (day, index) => (

                <div
                  key={index}
                  className={`simple-calendar-day ${
                    !day
                      ? "empty-day"
                      : ""
                  } ${
                    day &&
                    isToday(day)
                      ? "calendar-today"
                      : ""
                  }`}
                >
                  {day}
                </div>

              )
            )}

          </div>

        </section>


        {/* =====================================================
            QUICK ACCESS
        ===================================================== */}

        <section className="quick-access-section">

          <div className="section-heading">

            <span className="card-label">
              QUICK ACCESS
            </span>

            <h2>
              Continue Learning
            </h2>

          </div>


          <div className="quick-access-grid">

            {/* CODE EDITOR */}

            <button
              className="quick-access-card"
              onClick={() =>
                handleNavigation(
                  "code-editor"
                )
              }
            >

              <span className="quick-icon">
                {"</>"}
              </span>

              <div>

                <strong>
                  Code Editor
                </strong>

                <p>
                  Practice Python and Java
                </p>

              </div>

              <span className="quick-arrow">
                →
              </span>

            </button>


            {/* DAILY CHALLENGE */}

            <button
              className="quick-access-card"
              onClick={() =>
                handleNavigation(
                  "challenge"
                )
              }
            >

              <span className="quick-icon">
                ⚡
              </span>

              <div>

                <strong>
                  Daily Challenge
                </strong>

                <p>
                  Solve today's problems
                </p>

              </div>

              <span className="quick-arrow">
                →
              </span>

            </button>


            {/* TASKS */}

            <button
              className="quick-access-card"
              onClick={() =>
                handleNavigation("tasks")
              }
            >

              <span className="quick-icon">
                ✓
              </span>

              <div>

                <strong>
                  My Tasks
                </strong>

                <p>
                  Manage your tasks
                </p>

              </div>

              <span className="quick-arrow">
                →
              </span>

            </button>

          </div>

        </section>

      </main>

    </div>
  );
}


export default Dashboard;