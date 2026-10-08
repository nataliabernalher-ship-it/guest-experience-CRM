import { useEffect, useState } from "react";
import { shiftDay } from "../data/shift";

function shiftName(now: Date): string {
  const hour = now.getHours();
  if (hour >= 6 && hour < 14) return "Morning shift";
  if (hour >= 14 && hour < 22) return "Evening shift";
  return "Night shift";
}

const weekdayLabel = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(shiftDay);
const dateLabel = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
}).format(shiftDay);

export function ShiftCorner() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p className="shift-corner">
      <span>{dateLabel}</span>
      <span>{weekdayLabel}</span>
      <span>{shiftName(now)}</span>
    </p>
  );
}
