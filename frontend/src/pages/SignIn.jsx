import { useState } from "react";
import { signIn } from "../services/authService";
import "./auth.css";

function SignIn({ onSwitchToSignUp, onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const email = formData.email.trim();
    const password = formData.password;

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const data = await signIn({
        email,
        password,
      });

      if (data.session) {
        onLoginSuccess(data.session);
      }
    } catch (error) {
      setError(error.message || "Unable to sign in.");
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

        {/* Sign In */}

        <div className="form-section">
          <h2>Welcome back</h2>

          <p className="subtitle">
            Sign in to continue to CodeHub.
          </p>

          <form onSubmit={handleSubmit}>

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
                  autoComplete="current-password"
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

            {/* Submit */}

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>

          {/* Switch */}

          <div className="switch-text">
            Don't have an account?{" "}

            <button
              type="button"
              onClick={onSwitchToSignUp}
            >
              Sign Up
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default SignIn;