import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DriveIcon } from "../components/Icons";

function prefersReducedMotion() {
  try {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  } catch {
    return false;
  }
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const rm = useMemo(() => prefersReducedMotion(), []);

  const goToLogin = () => {
    if (leaving) return;
    if (rm) {
      navigate("/login", { state: { fromLanding: true } });
      return;
    }

    setLeaving(true);
    window.setTimeout(() => {
      navigate("/login", { state: { fromLanding: true } });
    }, 650);
  };

  return (
    <div className={`landing-page ${leaving ? "landing-page--leaving" : ""}`}>
      <div className="landing-bg" aria-hidden="true" />

      <div className="landing-card">
        <div className="landing-card-top">
          <button
            type="button"
            className="landing-mark-btn"
            onClick={goToLogin}
            aria-label="Open sign in"
            title="Click to continue"
          >
            <span className="landing-mark" aria-hidden="true">
              <DriveIcon />
            </span>
          </button>
        </div>
        <div className="landing-title">Dobby Drive</div>
        <div className="landing-subtitle">
          A simple, fast workspace for folders and files.
        </div>
        <button
          type="button"
          className="btn btn-primary landing-start-btn"
          onClick={goToLogin}
        >
          Continue to start
        </button>
      </div>

      <div className="landing-wipe" aria-hidden="true" />
    </div>
  );
}
