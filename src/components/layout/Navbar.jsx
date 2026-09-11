import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Layers, BookOpen, Plus, Sparkles, LogOut, User, Shield } from "lucide-react";
import { PATHS } from "../../routes/paths";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { path: PATHS.HOME, label: "Add Word", icon: Plus },
  { path: PATHS.WORDS, label: "My Words", icon: BookOpen },
  { path: PATHS.GROUPS, label: "Groups", icon: Layers },
  { path: PATHS.QUIZ, label: "Quiz", icon: Sparkles },
];

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const handleSignOut = async () => {
    try { await signOut(); } catch {}
    navigate("/login");
  };
  const displayEmail = user?.email || "";
  const initials = displayEmail ? displayEmail.slice(0,2).toUpperCase() : "??";
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
            ä ö ü ß ready — one word at a time.
          </p>
        </div>

        <nav className="flex gap-[0.35rem] flex-1 justify-center max-[768px]:hidden" aria-label="Primary">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === PATHS.HOME}
              className={({ isActive }) =>
                [
                  "inline-flex items-center gap-1.5 px-3.5 py-[0.55rem] rounded-full border font-(--font-display) font-bold text-[0.84rem] cursor-pointer whitespace-nowrap transition-all duration-180",
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
                onClick={()=>setMenuOpen(v=>!v)}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-(--radius-md) bg-(--color-surface-raised) border border-(--color-border) text-(--color-text) text-[0.8rem] font-bold cursor-pointer hover:bg-(--color-surface-hover)"
                aria-label="User menu"
              >
                <span className="w-7 h-7 rounded-full bg-(--color-primary) text-(--color-primary-contrast) grid place-items-center text-[0.7rem] font-extrabold">{initials}</span>
                <span className="hidden sm:inline max-w-[16ch] truncate">{displayEmail}</span>
                {isAdmin && <Shield size={12} className="text-(--color-primary)" />}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-(--radius-md) bg-(--color-surface) border border-(--color-border) shadow-(--shadow-raised) p-2 z-30" onMouseLeave={()=>setMenuOpen(false)}>
                  <div className="px-2 py-1.5 text-[0.8rem]">
                    <div style={{ display:"flex", alignItems:"center", gap:"0.35rem", fontWeight:700 }}><User size={14}/> {displayEmail}</div>
                    {isAdmin && <div style={{ fontSize:"0.72rem", color:"var(--color-primary)", fontWeight:700, marginTop:2 }}><Shield size={12} style={{display:"inline", marginRight:4}}/>Admin</div>}
                    <div style={{ fontSize:"0.72rem", color:"var(--color-text-muted)", marginTop:2, wordBreak:"break-all" }}>{user.id?.slice(0,8)}…</div>
                  </div>
                  <div style={{ height:1, background:"var(--color-border)", margin:"6px 0" }} />
                  <button onClick={handleSignOut} className="w-full text-left inline-flex items-center gap-2 px-2 py-2 rounded-(--radius-sm) text-[0.85rem] font-semibold text-(--color-danger) hover:bg-(--color-danger-soft) cursor-pointer">
                    <LogOut size={14}/> Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export { NAV_ITEMS };
