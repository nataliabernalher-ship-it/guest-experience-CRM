import { useEffect } from "react";

export function InsightPage() {
  useEffect(() => {
    document.title = "Insight · Guest Experience";
  }, []);

  return (
    <div className="page" data-testid="insight">
      <header className="page-header">
        <div className="page-header-bar">
          <h1>Insight</h1>
        </div>
      </header>
      <section className="table-card insight-placeholder">
        <p className="insight-placeholder-copy">
          Insight will bring deeper guest and revenue analytics. This page is coming soon.
        </p>
      </section>
    </div>
  );
}
