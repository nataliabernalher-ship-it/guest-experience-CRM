import { useEffect } from "react";

export function ConfigurationPage() {
  useEffect(() => {
    document.title = "Configuration · Guest Experience";
  }, []);

  return (
    <div className="page" data-testid="configuration">
      <header className="page-header">
        <h1>Configuration</h1>
      </header>
    </div>
  );
}
