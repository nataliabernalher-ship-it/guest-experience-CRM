import { NavLink, Outlet } from "react-router-dom";

const nav = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/opportunities", label: "Opportunities", end: false },
  { to: "/guests", label: "Guests", end: false },
  { to: "/recovery", label: "Recovery", end: false },
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
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "nav-link is-active" : "nav-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
