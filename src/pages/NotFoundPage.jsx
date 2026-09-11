import { Link } from "react-router-dom";
import { PATHS } from "../routes/paths";

export default function NotFoundPage() {
  return (
    <div className="min-h-dvh bg-(--color-bg) grid place-items-center px-4 py-10">
      <div className="card text-center max-w-md w-full">
        <h2>Page not found</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: "0.5rem 0 1rem" }}>
          The page you are looking for does not exist.
        </p>
        <Link to={PATHS.HOME} className="btn-primary" style={{ maxWidth: 220, margin: "0 auto", textDecoration: "none" }}>
          Go home
        </Link>
      </div>
    </div>
  );
}
