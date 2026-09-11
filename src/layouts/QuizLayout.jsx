import { Outlet, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { PATHS } from "../routes/paths";

export default function QuizLayout() {
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh bg-(--color-bg)">
      <div className="min-h-dvh bg-(--color-bg) flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-140">
          <div className="flex items-center justify-between mb-4">
            <span className="font-(--font-display) text-[1.15rem] font-extrabold tracking-[-0.02em] text-(--color-text) leading-none">
              Wort<span className="text-(--color-primary)">Schatz</span>
            </span>
            <button
              className="inline-flex items-center justify-center w-9.5 h-9.5 rounded-sm bg-(--color-surface-raised) border border-(--color-border) text-(--color-text-muted) cursor-pointer hover:bg-(--color-surface-hover) hover:text-(--color-text)"
              onClick={() => navigate(PATHS.HOME)}
              title="Exit quiz"
              aria-label="Exit quiz"
            >
              <X size={18} />
            </button>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
