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
