import { NavLink, Outlet } from "react-router-dom";

const navGroups = [
  [{ to: "/", label: "Dashboard", end: true }],
  [
    { to: "/check-ins", label: "Check-ins", end: true },
    { to: "/in-house", label: "In-house", end: true },
    { to: "/check-outs", label: "Check-outs", end: true },
  ],
  [
    { to: "/opportunities", label: "Opportunities", end: false },
    { to: "/recovery", label: "Recovery", end: false },
  ],
  [{ to: "/guests", label: "Guest Profiles", end: false }],
];

export function Shell() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            G
          </span>
          <span>
            <span className="brand-name">Guest Experience</span>
            <span className="brand-note">Front desk</span>
          </span>
        </div>
        <nav className="nav" aria-label="Primary">
          {navGroups.map((group, index) => (
            <div key={group[0].to} className="nav-group">
              {index > 0 ? <div className="nav-rule" role="separator" /> : null}
              {group.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => (isActive ? "nav-link is-active" : "nav-link")}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <p className="sidebar-user">Clara Mendes</p>
          <div className="nav-rule" role="separator" />
          <NavLink
            to="/configuration"
            className={({ isActive }) => (isActive ? "nav-link is-active" : "nav-link")}
          >
            Configuration
          </NavLink>
          <button type="button" className="sidebar-logout">
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
            Log out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
