import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, BookOpen, Plus, Sparkles, LogOut, Shield, Pencil, Check, X, Loader2 } from "lucide-react";
import { PATHS } from "../../routes/paths";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { path: PATHS.APP, label: "Add Word", icon: Plus },
  { path: PATHS.WORDS, label: "My Words", icon: BookOpen },
  { path: PATHS.GROUPS, label: "Groups", icon: Layers },
  { path: PATHS.QUIZ, label: "Quiz", icon: Sparkles },
];

export default function Navbar() {
  const { user, displayName, initials, isAdmin, signOut, updateProfile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try { await signOut(); } catch {}
    navigate("/login");
  };

  const handleStartEditName = (e) => {
    e.stopPropagation();
    setNameInput(displayName || "");
    setEditingName(true);
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!nameInput.trim() || savingName) return;
    setSavingName(true);
    try {
      await updateProfile({ fullName: nameInput.trim() });
      setEditingName(false);
    } catch (err) {
      console.warn("Failed to update name", err);
    } finally {
      setSavingName(false);
    }
  };

  const displayEmail = user?.email || "";
  const headerLabel = displayName || displayEmail;

  return (
    <header
      className="sticky top-0 z-20 bg-(--color-surface) border-b border-(--color-border) shadow-(--shadow-card)"
      role="banner"
    >
      <div className="max-w-215 mx-auto px-5 py-3 flex items-center gap-4 max-[768px]:px-4 max-[768px]:py-2.5">
        <div className="shrink-0 min-w-0">
          <h1 className="font-(--font-display) text-[1.5rem] font-extrabold tracking-[-0.02em] text-(--color-text) leading-none max-[768px]:text-[1.3rem]">
            Wort<span className="text-(--color-primary)">Schatz</span>
          </h1>
          <p className="text-[0.72rem] text-(--color-text-muted) mt-[0.15rem] whitespace-nowrap max-[768px]:hidden">
            Your German flashcards — one word at a time.
          </p>
        </div>

        <nav className="flex gap-[0.35rem] flex-1 justify-center max-[768px]:hidden" aria-label="Primary">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === PATHS.APP}
              className={({ isActive }) =>
                [
                  "inline-flex items-center gap-1.5 px-3.5 py-[0.55rem] rounded-full border font-(--font-display) font-bold text-[0.84rem] cursor-pointer whitespace-nowrap active:scale-[0.96] transition-[background-color,color,border-color,transform,box-shadow] duration-150 ease-[var(--ease-out)]",
                  isActive
                    ? "bg-(--color-primary) text-(--color-primary-contrast) border-(--color-primary-strong) shadow-[0_1px_6px_rgba(21,148,106,0.25)]"
                    : "bg-transparent text-(--color-text-muted) border-transparent hover:bg-(--color-surface-raised) hover:text-(--color-text)",
                ].join(" ")
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 flex items-center gap-2">
          <ThemeToggle />
          {user && (
            <div className="relative">
              <button
                onClick={() => { setMenuOpen(v => !v); setEditingName(false); }}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-(--radius-md) bg-(--color-surface-raised) border border-(--color-border) text-(--color-text) text-[0.8rem] font-bold cursor-pointer active:scale-[0.96] transition-[background-color,border-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-(--color-surface-hover)"
                aria-label="User menu"
              >
                <span className="w-7 h-7 rounded-full bg-(--color-primary) text-(--color-primary-contrast) grid place-items-center text-[0.7rem] font-extrabold tracking-tight">{initials}</span>
                <span className="hidden sm:inline max-w-[16ch] truncate">{headerLabel}</span>
                {isAdmin && <Shield size={12} className="text-(--color-primary)" />}
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                    style={{ transformOrigin: "top right" }}
                    className="absolute right-0 mt-2 w-72 rounded-(--radius-md) bg-(--color-surface) border border-(--color-border) shadow-(--shadow-raised) p-2.5 z-30"
                    onMouseLeave={() => { setMenuOpen(false); setEditingName(false); }}
                  >
                    <div className="px-1.5 py-1">
                      <div className="flex items-start gap-2.5">
                        <span className="w-9 h-9 rounded-full bg-(--color-primary) text-(--color-primary-contrast) grid place-items-center text-[0.82rem] font-extrabold shrink-0 tracking-tight">
                          {initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-(--font-display) font-bold text-[0.92rem] text-(--color-text) truncate">
                              {displayName || "What should we call you?"}
                            </span>
                            {!editingName && (
                              <button
                                onClick={handleStartEditName}
                                className="text-(--color-text-faint) hover:text-(--color-primary) p-0.5 rounded cursor-pointer transition-colors"
                                title={displayName ? "Edit your name" : "Set your name"}
                                aria-label="Edit name"
                              >
                                <Pencil size={12} />
                              </button>
                            )}
                          </div>
                          <div className="text-[0.74rem] text-(--color-text-muted) truncate">{displayEmail}</div>
                          {isAdmin && (
                            <div className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-(--color-primary) mt-0.5">
                              <Shield size={11} /> Admin
                            </div>
                          )}
                        </div>
                      </div>

                      {editingName && (
                        <form onSubmit={handleSaveName} className="mt-2.5 mb-1 p-2 rounded-(--radius-sm) bg-(--color-surface-raised) border border-(--color-border)">
                          <label className="block text-[0.68rem] font-bold text-(--color-text-muted) uppercase tracking-wider mb-1">
                            What should we call you?
                          </label>
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              value={nameInput}
                              onChange={(e) => setNameInput(e.target.value)}
                              placeholder="e.g. Ansh Bhavsar"
                              className="text-input py-1 px-2 text-[0.82rem] flex-1"
                              autoFocus
                              disabled={savingName}
                            />
                            <button
                              type="submit"
                              disabled={savingName || !nameInput.trim()}
                              className="btn-icon small text-(--color-primary)"
                              title="Save name"
                            >
                              {savingName ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingName(false)}
                              disabled={savingName}
                              className="btn-icon small"
                              title="Cancel"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                    <div style={{ height: 1, background: "var(--color-border)", margin: "8px 0" }} />
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left inline-flex items-center gap-2 px-2 py-1.5 rounded-(--radius-sm) text-[0.85rem] font-semibold text-(--color-danger) hover:bg-(--color-danger-soft) cursor-pointer active:scale-[0.98] transition-[background-color,transform] duration-150"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export { NAV_ITEMS };
