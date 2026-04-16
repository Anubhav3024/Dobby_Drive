import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { DriveIcon } from "../components/Icons";
import { useAuth } from "../providers/AuthProvider";

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromLanding = useMemo(
    () => Boolean(location.state && location.state.fromLanding),
    [location.state],
  );

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      {fromLanding ? (
        <div className="route-wipe route-wipe--in" aria-hidden="true" />
      ) : null}

      <div className="auth-card">
        <div className="auth-brand" aria-label="Dobby Drive">
          <span className="auth-mark" aria-hidden="true">
            <DriveIcon width="34" height="34" />
          </span>
          <div className="auth-brand-name">Dobby Drive</div>
          <div className="auth-brand-sub">Sign in to continue</div>
        </div>

        <form onSubmit={onSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error ? <div className="alert">{error}</div> : null}

          <div className="form-actions" style={{ marginTop: "1.1rem" }}>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>

        <div className="muted" style={{ marginTop: "1.15rem" }}>
          New here? <Link to="/signup">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
