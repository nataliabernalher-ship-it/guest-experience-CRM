import { useEffect, useState } from "react";
import { formatShiftTime, shiftDay } from "../data/shift";

function shiftName(now: Date): string {
  const hour = now.getHours();
  if (hour >= 6 && hour < 14) return "Morning shift";
  if (hour >= 14 && hour < 22) return "Evening shift";
  return "Night shift";
}

const dateLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
}).format(shiftDay);

export function ShiftCorner() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p className="shift-corner">
      <span>{dateLabel}</span>
      <span>{formatShiftTime(now)}</span>
      <span>{shiftName(now)}</span>
    </p>
  );
}
