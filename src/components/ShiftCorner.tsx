import { useEffect, useState } from "react";
import { formatShiftTime, shiftDateLabel } from "../data/shift";

function shiftName(now: Date): string {
  const hour = now.getHours();
  if (hour >= 6 && hour < 14) return "Morning shift";
  if (hour >= 14 && hour < 22) return "Evening shift";
  return "Night shift";
}

type ShiftCornerProps = {
  showShift?: boolean;
};

export function ShiftCorner({ showShift = false }: ShiftCornerProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p className="shift-corner">
      <span>{shiftDateLabel}</span>
      <span>{formatShiftTime(now)}</span>
      {showShift ? <span>{shiftName(now)}</span> : null}
    </p>
  );
}
