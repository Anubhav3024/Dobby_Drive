import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { DriveIcon } from "../components/Icons";
import { useAuth } from "../providers/AuthProvider";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signup({ name, email, password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign up");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-brand" aria-label="Dobby Drive">
          <span className="auth-mark" aria-hidden="true">
            <DriveIcon width="34" height="34" />
          </span>
          <div className="auth-brand-name">Dobby Drive</div>
          <div className="auth-brand-sub">Create your account</div>
        </div>

        <form onSubmit={onSubmit}>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Password (min 6 chars)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
          {error ? <div className="alert">{error}</div> : null}
          <div className="form-actions" style={{ marginTop: "1.1rem" }}>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Sign up"}
            </Button>
          </div>
        </form>

        <div className="muted" style={{ marginTop: "1.15rem" }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
