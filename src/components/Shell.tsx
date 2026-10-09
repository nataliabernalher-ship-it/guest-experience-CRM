import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ShiftCorner } from "./ShiftCorner";

const navItems: { to: string; label: string; end: boolean; icon: ReactNode }[] = [
  { to: "/", label: "Dashboard", end: true, icon: <DashboardIcon /> },
  { to: "/opportunities", label: "Opportunities", end: false, icon: <OpportunitiesIcon /> },
  { to: "/recovery", label: "Recovery", end: false, icon: <RecoveryIcon /> },
  { to: "/guests", label: "Guest Profiles", end: false, icon: <GuestsIcon /> },
  { to: "/automations", label: "Automations", end: false, icon: <AutomationsIcon /> },
];

function linkIsActive(to: string, end: boolean, pathname: string): boolean {
  if (to === "/opportunities") return pathname === "/opportunities" || pathname.startsWith("/opportunities/");
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function DashboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M3.5 3.5h5.5v5.5H3.5V3.5Zm7.5 0H16.5v5.5H11V3.5ZM3.5 11H9v5.5H3.5V11Zm7.5 0h5.5v5.5H11V11Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OpportunitiesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 2.4 11.4 7.6 16.8 9 11.4 10.4 10 15.6 8.6 10.4 3.2 9 8.6 7.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RecoveryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="rotate(-32 10 10)"
      >
        <rect x="3" y="7.2" width="14" height="5.6" rx="1.8" />
        <path d="M7.8 7.2v5.6M12.2 7.2v5.6" />
        <path d="M9.1 8.8v2.4M10.9 8.8v2.4M10 9.4v1.2" />
      </g>
    </svg>
  );
}

function GuestsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 10.2a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2ZM4.2 16.2c.7-2.4 2.8-3.8 5.8-3.8s5.1 1.4 5.8 3.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AutomationsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 3.2v2.2M10 14.6v2.2M3.2 10h2.2M14.6 10h2.2M5.2 5.2l1.5 1.5M13.3 13.3l1.5 1.5M14.8 5.2 13.3 6.7M6.7 13.3 5.2 14.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="10" cy="10" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M3 7h8M8 3.5 11.5 7 8 10.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M5 5l10 10M15 5 5 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Shell() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <div className={menuOpen ? "app is-menu-open" : "app"}>
      <header className="topbar">
        <div className="topbar-lead">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              G
            </span>
            <span className="brand-name">Guest Experience</span>
          </div>
          <button
            type="button"
            className="topbar-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        <nav id="primary-nav" className="top-nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to === "/opportunities" ? "/opportunities/check-ins" : item.to}
              end={item.end}
              className={() =>
                linkIsActive(item.to, item.end, pathname) ? "top-nav-link is-active" : "top-nav-link"
              }
            >
              <span className="top-nav-icon">{item.icon}</span>
              <span className="top-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="topbar-user">
          <div className="topbar-user-row">
            <p className="topbar-username">Clara Mendes</p>
            <button type="button" className="topbar-logout">
              <LogoutIcon />
              Log out
            </button>
          </div>
          <ShiftCorner />
        </div>
      </header>

      {menuOpen ? (
        <button
          type="button"
          className="topbar-menu-backdrop"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
