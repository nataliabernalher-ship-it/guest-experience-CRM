import { categoryLabels, type Category } from "../data/shift";

function CategoryIcon({ category }: { category: Category }) {
  if (category === "upselling") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 1.4 9.15 6.15 14 8 9.15 9.85 8 14.6 6.85 9.85 2 8 6.85 6.15Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (category === "loyalty") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 2.1 13.1 8 8 13.9 2.9 8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (category === "recovery") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="rotate(-32 8 8)"
        >
          <rect x="2" y="5.7" width="12" height="4.6" rx="1.5" />
          <path d="M6.3 5.7v4.6M9.7 5.7v4.6" />
          <path d="M7.3 7v2M8.7 7v2M8 7.5v1" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 13.3S2.6 9.7 2.6 6.3A2.7 2.7 0 0 1 8 5.1a2.7 2.7 0 0 1 5.4 1.2c0 3.4-5.4 7-5.4 7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CategoryPill({ category }: { category: Category }) {
  return (
    <span className="category-pill" data-category={category}>
      <CategoryIcon category={category} />
      {categoryLabels[category]}
    </span>
  );
}
