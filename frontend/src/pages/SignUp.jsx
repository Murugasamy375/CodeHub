import { useState } from "react";
import { signUp } from "../services/authService";
import "./auth.css";
function SignUp({ onSwitchToSignIn }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const password = formData.password;

    if (!fullName) {
      setError("Please enter your full name.");
      return;
    }

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const data = await signUp({
        fullName,
        email,
        password,
      });

      if (data.session) {
        setSuccess("Account created successfully.");
      } else {
        setSuccess(
          "Account created. Please check your email and confirm your account."
        );
      }

      setFormData({
        fullName: "",
        email: "",
        password: "",
      });
    } catch (error) {
      setError(error.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Brand */}

        <div className="brand">
          <div className="brand-logo">
            C
          </div>

          <div>
            <h1>CodeHub</h1>
            <p>Learn. Practice. Improve.</p>
          </div>
        </div>

        {/* Heading */}

        <div className="form-section">
          <h2>Create your account</h2>

          <p className="subtitle">
            Join CodeHub and start your learning journey.
          </p>

          <form onSubmit={handleSubmit}>

            {/* Full Name */}

            <div className="form-group">
              <label htmlFor="fullName">
                Full Name
              </label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                autoComplete="name"
              />
            </div>

            {/* Email */}

            <div className="form-group">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            {/* Password */}

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <div className="password-wrapper">

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>
            </div>

            {/* Error */}

            {error && (
              <div className="message error-message">
                {error}
              </div>
            )}

            {/* Success */}

            {success && (
              <div className="message success-message">
                {success}
              </div>
            )}

            {/* Submit */}

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Create Account"}
            </button>

          </form>

          {/* Switch to Sign In */}

          <div className="switch-text">
            Already have an account?{" "}

            <button
              type="button"
              onClick={onSwitchToSignIn}
            >
              Sign In
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default SignUp;