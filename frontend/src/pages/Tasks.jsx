import { useEffect, useMemo, useState } from "react";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../services/taskService";
import "./tasks.css";

function Tasks({ onBack }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [adding, setAdding] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [error, setError] = useState("");

  // =========================================================
  // LOAD TASKS
  // =========================================================

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTasks();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setError("Unable to load your tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // =========================================================
  // STATISTICS
  // =========================================================

  const completedCount = useMemo(
    () => tasks.filter((task) => task.is_completed).length,
    [tasks]
  );

  const pendingCount = tasks.length - completedCount;

  // =========================================================
  // ADD TASK
  // =========================================================

  const handleAddTask = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    try {
      setAdding(true);
      setError("");

      const newTask = await createTask({
        title: title.trim(),
        description: description.trim() || null,
      });

      setTasks((current) => [newTask, ...current]);

      setTitle("");
      setDescription("");
    } catch (err) {
      console.error("Failed to create task:", err);
      setError("Unable to create the task.");
    } finally {
      setAdding(false);
    }
  };

  // =========================================================
  // COMPLETE / UNCOMPLETE
  // =========================================================

  const handleToggleTask = async (task) => {
    try {
      setActionId(task.id);
      setError("");

      const updatedTask = await updateTask(task.id, {
        is_completed: !task.is_completed,
      });

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? updatedTask : item
        )
      );
    } catch (err) {
      console.error("Failed to update task:", err);
      setError("Unable to update the task.");
    } finally {
      setActionId(null);
    }
  };

  // =========================================================
  // EDIT
  // =========================================================

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setError("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleSaveEdit = async (taskId) => {
    if (!editTitle.trim()) {
      setError("Task title cannot be empty.");
      return;
    }

    try {
      setActionId(taskId);
      setError("");

      const updatedTask = await updateTask(taskId, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      });

      setTasks((current) =>
        current.map((item) =>
          item.id === taskId ? updatedTask : item
        )
      );

      cancelEditing();
    } catch (err) {
      console.error("Failed to edit task:", err);
      setError("Unable to update the task.");
    } finally {
      setActionId(null);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDeleteTask = async (taskId) => {
    try {
      setActionId(taskId);
      setError("");

      await deleteTask(taskId);

      setTasks((current) =>
        current.filter((task) => task.id !== taskId)
      );
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError("Unable to delete the task.");
    } finally {
      setActionId(null);
    }
  };

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="tasks-page">
      <div className="tasks-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="tasks-header">

          <button
            className="tasks-back-button"
            onClick={onBack}
          >
            <span>←</span>
            Dashboard
          </button>

          <div className="tasks-heading">

            <span className="tasks-eyebrow">
              PRODUCTIVITY
            </span>

            <h1>My Tasks</h1>

            <p>
              Organize what you need to get done today.
            </p>

          </div>

        </header>


        {/* =================================================
            STAT CARDS
        ================================================= */}

        <section className="task-stats">

          <div className="task-stat-card">

            <div className="task-stat-icon total-icon">
              ✓
            </div>

            <div>
              <span>Total Tasks</span>
              <strong>{tasks.length}</strong>
            </div>

          </div>


          <div className="task-stat-card">

            <div className="task-stat-icon completed-icon">
              ✓
            </div>

            <div>
              <span>Completed</span>
              <strong>{completedCount}</strong>
            </div>

          </div>


          <div className="task-stat-card">

            <div className="task-stat-icon pending-icon">
              ◷
            </div>

            <div>
              <span>Pending</span>
              <strong>{pendingCount}</strong>
            </div>

          </div>

        </section>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="task-error">

            <span>!</span>

            {error}

            <button
              onClick={() => setError("")}
            >
              ×
            </button>

          </div>
        )}


        {/* =================================================
            ADD TASK
        ================================================= */}

        <section className="add-task-card">

          <div className="section-title">

            <div className="add-task-icon">
              +
            </div>

            <div>

              <h2>Add a new task</h2>

              <p>
                Create something you want to accomplish.
              </p>

            </div>

          </div>


          <form onSubmit={handleAddTask}>

            <div className="form-group">

              <label>
                Task title
              </label>

              <input
                type="text"
                placeholder="e.g. Practice Spring Boot interview questions"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                maxLength={200}
              />

            </div>


            <div className="form-group">

              <label>

                Description

                <span className="optional-label">
                  Optional
                </span>

              </label>

              <textarea
                placeholder="Add some details about this task..."
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                maxLength={2000}
                rows={3}
              />

            </div>


            <div className="add-task-footer">

              <span>
                {title.length}/200 characters
              </span>

              <button
                type="submit"
                className="add-task-button"
                disabled={adding}
              >

                {adding ? (
                  <>
                    <span className="button-spinner"></span>
                    Adding...
                  </>
                ) : (
                  <>
                    <span>+</span>
                    Add Task
                  </>
                )}

              </button>

            </div>

          </form>

        </section>


        {/* =================================================
            TASK LIST
        ================================================= */}

        <section className="task-list-section">

          <div className="task-list-header">

            <div>

              <span className="tasks-eyebrow">
                YOUR WORK
              </span>

              <h2>
                Today's Tasks
              </h2>

            </div>

            <span className="task-list-count">
              {tasks.length}{" "}
              {tasks.length === 1
                ? "task"
                : "tasks"}
            </span>

          </div>


          {/* LOADING */}

          {loading ? (

            <div className="tasks-loading">

              <div className="loading-spinner"></div>

              <p>
                Loading your tasks...
              </p>

            </div>

          ) : tasks.length === 0 ? (

            /* EMPTY */

            <div className="empty-tasks">

              <div className="empty-task-icon">
                ✓
              </div>

              <h3>
                No tasks yet
              </h3>

              <p>
                You're all clear! Add your first task
                above and start organizing your day.
              </p>

            </div>

          ) : (

            /* TASKS */

            <div className="tasks-list">

              {tasks.map((task) => (

                <div
                  key={task.id}
                  className={`task-item ${
                    task.is_completed
                      ? "completed"
                      : ""
                  }`}
                >

                  {/* EDIT MODE */}

                  {editingId === task.id ? (

                    <div className="task-edit-mode">

                      <input
                        className="edit-task-title"
                        value={editTitle}
                        onChange={(event) =>
                          setEditTitle(event.target.value)
                        }
                        maxLength={200}
                        autoFocus
                      />

                      <textarea
                        className="edit-task-description"
                        value={editDescription}
                        onChange={(event) =>
                          setEditDescription(
                            event.target.value
                          )
                        }
                        maxLength={2000}
                        rows={3}
                        placeholder="Task description..."
                      />

                      <div className="edit-actions">

                        <button
                          className="cancel-edit-button"
                          onClick={cancelEditing}
                          disabled={
                            actionId === task.id
                          }
                        >
                          Cancel
                        </button>

                        <button
                          className="save-edit-button"
                          onClick={() =>
                            handleSaveEdit(task.id)
                          }
                          disabled={
                            actionId === task.id
                          }
                        >
                          {actionId === task.id
                            ? "Saving..."
                            : "Save Changes"}
                        </button>

                      </div>

                    </div>

                  ) : (

                    /* NORMAL MODE */

                    <>

                      <button
                        className={`task-checkbox ${
                          task.is_completed
                            ? "checked"
                            : ""
                        }`}
                        onClick={() =>
                          handleToggleTask(task)
                        }
                        disabled={
                          actionId === task.id
                        }
                        aria-label={
                          task.is_completed
                            ? "Mark task as incomplete"
                            : "Mark task as complete"
                        }
                      >
                        {task.is_completed && "✓"}
                      </button>


                      <div className="task-content">

                        <h3>
                          {task.title}
                        </h3>

                        {task.description && (
                          <p>
                            {task.description}
                          </p>
                        )}

                        <div className="task-meta">

                          <span>
                            {task.is_completed
                              ? "Completed"
                              : "Pending"}
                          </span>

                          {task.created_at && (
                            <>
                              <span className="meta-dot">
                                •
                              </span>

                              <span>
                                {formatDate(
                                  task.created_at
                                )}
                              </span>
                            </>
                          )}

                        </div>

                      </div>


                      <div className="task-actions">

                        <button
                          className="task-action edit"
                          onClick={() =>
                            startEditing(task)
                          }
                          disabled={
                            actionId === task.id
                          }
                          title="Edit task"
                        >
                          ✎
                        </button>

                        <button
                          className="task-action delete"
                          onClick={() =>
                            handleDeleteTask(task.id)
                          }
                          disabled={
                            actionId === task.id
                          }
                          title="Delete task"
                        >
                          ×
                        </button>

                      </div>

                    </>

                  )}

                </div>

              ))}

            </div>

          )}

        </section>

      </div>
    </div>
  );
}

export default Tasks;