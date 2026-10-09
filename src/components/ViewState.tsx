import type { ReactNode } from "react";

type ViewStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  testId?: string;
};

export function LoadingState({
  title = "Loading",
  description = "Please wait while we prepare this view.",
  testId = "view-loading",
}: Partial<ViewStateProps>) {
  return (
    <div className="view-state is-loading" data-testid={testId} role="status" aria-live="polite">
      <span className="view-state-spinner" aria-hidden="true" />
      <div className="view-state-copy">
        <h3 className="view-state-title">{title}</h3>
        <p className="view-state-description">{description}</p>
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action, testId = "view-empty" }: ViewStateProps) {
  return (
    <div className="view-state is-empty" data-testid={testId}>
      <div className="view-state-copy">
        <h3 className="view-state-title">{title}</h3>
        <p className="view-state-description">{description}</p>
      </div>
      {action ? <div className="view-state-action">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title, description, action, testId = "view-error" }: ViewStateProps) {
  return (
    <div className="view-state is-error" data-testid={testId} role="alert">
      <div className="view-state-copy">
        <h3 className="view-state-title">{title}</h3>
        <p className="view-state-description">{description}</p>
      </div>
      {action ? <div className="view-state-action">{action}</div> : null}
    </div>
  );
}
