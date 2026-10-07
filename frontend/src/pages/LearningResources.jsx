import { useEffect, useState } from "react";
import {
  getResources,
  createResource,
  deleteResource,
} from "../services/resourceService";

import "./learning-resources.css";

function LearningResources({ profile, onBack }) {
  const isAdmin = profile?.role === "admin";

  // =========================================================
  // RESOURCE STATE
  // =========================================================

  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [resourceError, setResourceError] = useState("");

  // =========================================================
  // ADD RESOURCE STATE
  // =========================================================

  const [showAddResource, setShowAddResource] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    category: "",
    topic: "",
    resource_type: "pdf",
    url: "",
    file: null,
  });

  // =========================================================
  // LOAD RESOURCES
  // =========================================================

  const loadResources = async () => {
    try {
      setLoadingResources(true);
      setResourceError("");

      const data = await getResources();

      setResources(data);
    } catch (error) {
      console.error("Failed to load resources:", error);

      setResourceError(
        error?.response?.data?.detail ||
          error?.message ||
          "Failed to load resources."
      );
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  // =========================================================
  // OPEN ADD RESOURCE MODAL
  // =========================================================

  const openAddResource = (category = "", topic = "") => {
    setSubmitError("");

    setResourceForm({
      title: "",
      description: "",
      category,
      topic,
      resource_type: "pdf",
      url: "",
      file: null,
    });

    setShowAddResource(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeAddResource = () => {
    if (isSubmitting) {
      return;
    }

    setShowAddResource(false);
    setSubmitError("");
  };

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setResourceForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Clear topic when category changes
    if (name === "category") {
      setResourceForm((previous) => ({
        ...previous,
        category: value,
        topic: "",
      }));
    }

    // Clear URL when changing to file type
    if (
      name === "resource_type" &&
      value !== "link" &&
      value !== "youtube"
    ) {
      setResourceForm((previous) => ({
        ...previous,
        resource_type: value,
        url: "",
      }));
    }

    // Clear file when changing to URL type
    if (
      name === "resource_type" &&
      (value === "link" || value === "youtube")
    ) {
      setResourceForm((previous) => ({
        ...previous,
        resource_type: value,
        file: null,
      }));
    }
  };

  // =========================================================
  // FILE CHANGE
  // =========================================================

  const handleFileChange = (event) => {
    setResourceForm((previous) => ({
      ...previous,
      file: event.target.files?.[0] || null,
    }));
  };

  // =========================================================
  // SUBMIT RESOURCE
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitError("");
    setIsSubmitting(true);

    try {
      await createResource(resourceForm);

      // Reload resources so the new resource appears immediately
      await loadResources();

      setShowAddResource(false);

      setResourceForm({
        title: "",
        description: "",
        category: "",
        topic: "",
        resource_type: "pdf",
        url: "",
        file: null,
      });

      alert("Resource added successfully!");
    } catch (error) {
      console.error("Failed to add resource:", error);

      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to add resource.";

      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // DELETE RESOURCE
  // =========================================================

  const handleDeleteResource = async (resourceId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resource?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteResource(resourceId);

      await loadResources();

      alert("Resource deleted successfully!");
    } catch (error) {
      console.error("Failed to delete resource:", error);

      alert(
        error?.response?.data?.detail ||
          error?.message ||
          "Failed to delete resource."
      );
    }
  };

  // =========================================================
  // RENDER RESOURCE LIST
  // =========================================================

  const renderResources = (category, topic = null) => {
    const filteredResources = resources.filter((resource) => {
      if (resource.category !== category) {
        return false;
      }

      if (topic && resource.topic !== topic) {
        return false;
      }

      return true;
    });

    if (filteredResources.length === 0) {
      return null;
    }

    return (
      <div className="uploaded-resources">
        <div className="uploaded-resources-title">
          Uploaded Resources
        </div>

        <div className="uploaded-resource-list">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="uploaded-resource-card"
            >
              {/* ICON */}
              <div className="uploaded-resource-icon">
                {resource.type === "pdf"
                  ? "📕"
                  : resource.type === "document"
                  ? "📄"
                  : resource.type === "youtube"
                  ? "▶️"
                  : "🔗"}
              </div>

              {/* INFORMATION */}
              <div className="uploaded-resource-info">
                <h4>{resource.title}</h4>

                {resource.description && (
                  <p>{resource.description}</p>
                )}

                <span className="uploaded-resource-type">
                  {resource.type?.toUpperCase()}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="uploaded-resource-actions">
                {/* PDF / DOCUMENT */}
                {(resource.type === "pdf" ||
                  resource.type === "document") &&
                  resource.resource_url && (
                    <>
                      <a
                        href={resource.resource_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resource-open-button"
                      >
                        Open
                      </a>

                      
                    </>
                  )}

                {/* LINK / YOUTUBE */}
                {(resource.type === "link" ||
                  resource.type === "youtube") &&
                  resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resource-open-button"
                    >
                      Open
                    </a>
                  )}

                {/* ADMIN DELETE */}
                {isAdmin && (
                  <button
                    type="button"
                    className="resource-delete-button"
                    onClick={() =>
                      handleDeleteResource(resource.id)
                    }
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="learning-resources-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="learning-resources-header">
        <div>
          <span className="learning-resources-eyebrow">
            KNOWLEDGE HUB
          </span>

          <h1>Learning Resources</h1>

          <p>
            Study materials, references and preparation resources
            for your learning journey.
          </p>
        </div>

        <button
          type="button"
          className="learning-resources-back"
          onClick={onBack}
        >
          ← Dashboard
        </button>
      </header>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="learning-resources-content">

        {/* ===================================================
            RESOURCE ERROR
        =================================================== */}

        {resourceError && (
          <div className="resource-page-error">
            {resourceError}

            <button
              type="button"
              onClick={loadResources}
            >
              Retry
            </button>
          </div>
        )}

        {/* ===================================================
            LOADING
        =================================================== */}

        {loadingResources && (
          <div className="resource-loading">
            Loading resources...
          </div>
        )}

        {/* ===================================================
            APTITUDE
        =================================================== */}

        <section className="resource-section-card">

          <div className="resource-section-header">

            <div className="resource-section-title">

              <div className="resource-section-icon aptitude-icon">
                🧮
              </div>

              <div>
                <span className="resource-section-label">
                  PRACTICE MATERIAL
                </span>

                <h2>Aptitude</h2>

                <p>
                  Formulas and preparation material for aptitude
                  practice.
                </p>
              </div>

            </div>

            {isAdmin && (
              <button
                type="button"
                className="add-resource-button"
                onClick={() =>
                  openAddResource("aptitude")
                }
              >
                + Add Resource
              </button>
            )}

          </div>

          <div className="resource-topic-grid">

            {/* FORMULAS */}

            <div className="resource-topic-card">
              <span className="resource-topic-icon">
                📐
              </span>

              <div>
                <h3>Formulas</h3>

                <p>
                  Important formulas for aptitude preparation.
                </p>
              </div>
            </div>

            {renderResources(
              "aptitude",
              "formulas"
            )}

            {/* PDFS */}

            <div className="resource-topic-card">
              <span className="resource-topic-icon">
                📄
              </span>

              <div>
                <h3>PDFs</h3>

                <p>
                  Aptitude preparation and practice materials.
                </p>
              </div>
            </div>

            {renderResources(
              "aptitude",
              "pdfs"
            )}

          </div>

        </section>

        {/* ===================================================
            CORE CS
        =================================================== */}

        <section className="resource-section-card">

          <div className="resource-section-header">

            <div className="resource-section-title">

              <div className="resource-section-icon core-cs-icon">
                🧠
              </div>

              <div>
                <span className="resource-section-label">
                  COMPUTER SCIENCE
                </span>

                <h2>Core CS</h2>

                <p>
                  Essential computer science subjects for
                  interviews and placements.
                </p>
              </div>

            </div>

            {isAdmin && (
              <button
                type="button"
                className="add-resource-button"
                onClick={() =>
                  openAddResource("core_cs")
                }
              >
                + Add Resource
              </button>
            )}

          </div>

          <div className="resource-topic-grid">

            {/* COMPUTER NETWORKS */}

            <div className="resource-topic-card">

              <span className="resource-topic-icon">
                🌐
              </span>

              <div>
                <h3>Computer Networks</h3>

                <span className="resource-topic-code">
                  CN
                </span>

                <p>
                  Networking concepts and interview material.
                </p>
              </div>

            </div>

            {renderResources(
              "core_cs",
              "cn"
            )}

            {/* OPERATING SYSTEMS */}

            <div className="resource-topic-card">

              <span className="resource-topic-icon">
                ⚙️
              </span>

              <div>
                <h3>Operating Systems</h3>

                <span className="resource-topic-code">
                  OS
                </span>

                <p>
                  OS concepts and placement preparation.
                </p>
              </div>

            </div>

            {renderResources(
              "core_cs",
              "os"
            )}

            {/* DBMS */}

            <div className="resource-topic-card">

              <span className="resource-topic-icon">
                🗄️
              </span>

              <div>
                <h3>DBMS</h3>

                <span className="resource-topic-code">
                  DBMS
                </span>

                <p>
                  Database concepts, SQL and interview material.
                </p>
              </div>

            </div>

            {renderResources(
              "core_cs",
              "dbms"
            )}

          </div>

        </section>

        {/* ===================================================
            CODING
        =================================================== */}

        <section className="resource-section-card">

          <div className="resource-section-header">

            <div className="resource-section-title">

              <div className="resource-section-icon coding-icon">
                💻
              </div>

              <div>
                <span className="resource-section-label">
                  PROBLEM SOLVING
                </span>

                <h2>Coding</h2>

                <p>
                  Resources to improve your coding and DSA skills.
                </p>
              </div>

            </div>

            {isAdmin && (
              <button
                type="button"
                className="add-resource-button"
                onClick={() =>
                  openAddResource("coding")
                }
              >
                + Add Resource
              </button>
            )}

          </div>

          <div className="resource-topic-grid">

            {/* DSA */}

            <div className="resource-topic-card">

              <span className="resource-topic-icon">
                🔥
              </span>

              <div>
                <h3>DSA</h3>

                <p>
                  Data structures, algorithms and interview
                  preparation resources.
                </p>
              </div>

            </div>

            {renderResources(
              "coding",
              "dsa"
            )}

          </div>

        </section>

      </main>

      {/* =====================================================
          ADD RESOURCE MODAL
      ===================================================== */}

      {showAddResource && (
        <div className="resource-modal-overlay">

          <div className="resource-modal">

            {/* MODAL HEADER */}

            <div className="resource-modal-header">

              <div>
                <span className="resource-section-label">
                  ADMIN
                </span>

                <h2>Add Resource</h2>
              </div>

              <button
                type="button"
                className="resource-modal-close"
                onClick={closeAddResource}
                disabled={isSubmitting}
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit}>

              {/* TITLE */}

              <div className="resource-form-group">

                <label>
                  Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={resourceForm.title}
                  onChange={handleInputChange}
                  placeholder="Enter resource title"
                  required
                />

              </div>

              {/* DESCRIPTION */}

              <div className="resource-form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={resourceForm.description}
                  onChange={handleInputChange}
                  placeholder="Enter a short description"
                  rows="3"
                />

              </div>

              {/* CATEGORY + TOPIC */}

              <div className="resource-form-row">

                {/* CATEGORY */}

                <div className="resource-form-group">

                  <label>
                    Category
                  </label>

                  <select
                    name="category"
                    value={resourceForm.category}
                    onChange={handleInputChange}
                    required
                  >

                    <option value="">
                      Select category
                    </option>

                    <option value="aptitude">
                      Aptitude
                    </option>

                    <option value="core_cs">
                      Core CS
                    </option>

                    <option value="coding">
                      Coding
                    </option>

                  </select>

                </div>

                {/* TOPIC */}

                <div className="resource-form-group">

                  <label>
                    Topic
                  </label>

                  <select
                    name="topic"
                    value={resourceForm.topic}
                    onChange={handleInputChange}
                    required
                  >

                    <option value="">
                      Select topic
                    </option>

                    {resourceForm.category ===
                      "aptitude" && (
                      <>
                        <option value="formulas">
                          Formulas
                        </option>

                        <option value="pdfs">
                          PDFs
                        </option>
                      </>
                    )}

                    {resourceForm.category ===
                      "core_cs" && (
                      <>
                        <option value="cn">
                          Computer Networks
                        </option>

                        <option value="os">
                          Operating Systems
                        </option>

                        <option value="dbms">
                          DBMS
                        </option>
                      </>
                    )}

                    {resourceForm.category ===
                      "coding" && (
                      <option value="dsa">
                        DSA
                      </option>
                    )}

                  </select>

                </div>

              </div>

              {/* RESOURCE TYPE */}

              <div className="resource-form-group">

                <label>
                  Resource Type
                </label>

                <select
                  name="resource_type"
                  value={resourceForm.resource_type}
                  onChange={handleInputChange}
                >

                  <option value="pdf">
                    PDF
                  </option>

                  <option value="document">
                    Document
                  </option>

                  <option value="link">
                    Link
                  </option>

                  <option value="youtube">
                    YouTube
                  </option>

                </select>

              </div>

              {/* URL */}

              {(resourceForm.resource_type === "link" ||
                resourceForm.resource_type ===
                  "youtube") && (
                <div className="resource-form-group">

                  <label>
                    URL
                  </label>

                  <input
                    type="url"
                    name="url"
                    value={resourceForm.url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    required
                  />

                </div>
              )}

              {/* FILE */}

              {(resourceForm.resource_type === "pdf" ||
                resourceForm.resource_type ===
                  "document") && (
                <div className="resource-form-group">

                  <label>
                    Upload File
                  </label>

                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept={
                      resourceForm.resource_type ===
                      "pdf"
                        ? ".pdf"
                        : ".pdf,.doc,.docx,.txt"
                    }
                    required
                  />

                </div>
              )}

              {/* ERROR */}

              {submitError && (
                <div className="resource-submit-error">
                  {submitError}
                </div>
              )}

              {/* ACTIONS */}

              <div className="resource-modal-actions">

                <button
                  type="button"
                  className="resource-cancel-button"
                  onClick={closeAddResource}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="resource-submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Adding..."
                    : "Add Resource"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default LearningResources;