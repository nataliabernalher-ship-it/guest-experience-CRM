import { Link } from "react-router-dom";

export function LaterPage({ title }: { title: string }) {
  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">
          <Link to="/" className="back-link">
            Dashboard
          </Link>
        </p>
        <h1>{title}</h1>
        <p className="lede">This area is not part of the current step.</p>
      </header>
    </div>
  );
}
