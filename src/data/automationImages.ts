import imgAmenities from "../assets/automations/amenities.jpg";
import imgBirthday from "../assets/automations/birthday.jpg";
import imgBreakfast from "../assets/automations/breakfast.jpg";
import imgCityTours from "../assets/automations/city-tours.jpg";
import imgFlamenco from "../assets/automations/flamenco.jpg";
import imgLoyalty from "../assets/automations/loyalty.svg";
import imgReturning from "../assets/automations/returning.jpg";
import imgSpa from "../assets/automations/spa.jpg";
import imgSpecialDinner from "../assets/automations/special-dinner.jpg";
import imgThemePark from "../assets/automations/theme-park.jpg";
import imgTransfer from "../assets/automations/transfer.jpg";
import imgUpgrade from "../assets/automations/upgrade.jpg";

/** Pool of themed cover images used by seed data and the AI mock. */
export const automationImagePool = [
  imgSpa,
  imgLoyalty,
  imgBirthday,
  imgReturning,
  imgBreakfast,
  imgTransfer,
  imgFlamenco,
  imgUpgrade,
  imgThemePark,
  imgCityTours,
  imgSpecialDinner,
  imgAmenities,
] as const;

export const automationImages = {
  spa: imgSpa,
  loyalty: imgLoyalty,
  birthday: imgBirthday,
  returning: imgReturning,
  breakfast: imgBreakfast,
  transfer: imgTransfer,
  flamenco: imgFlamenco,
  upgrade: imgUpgrade,
  themePark: imgThemePark,
  cityTours: imgCityTours,
  specialDinner: imgSpecialDinner,
  amenities: imgAmenities,
} as const;

/** Pick a pool image that best matches an automation name or action label. */
export function imageForAutomationText(...parts: Array<string | undefined>): string {
  const text = parts.filter(Boolean).join(" ").toLowerCase();
  if (/spa|massage/.test(text)) return automationImages.spa;
  if (/loyalty/.test(text)) return automationImages.loyalty;
  if (/birthday/.test(text)) return automationImages.birthday;
  if (/returning|welcome back/.test(text)) return automationImages.returning;
  if (/anniversary|amenit|welcome|gift/.test(text)) return automationImages.amenities;
  if (/breakfast/.test(text)) return automationImages.breakfast;
  if (/transfer|airport/.test(text)) return automationImages.transfer;
  if (/flamenco/.test(text)) return automationImages.flamenco;
  if (/upgrade/.test(text)) return automationImages.upgrade;
  if (/theme\s*park|park ticket/.test(text)) return automationImages.themePark;
  if (/city\s*tour|tour/.test(text)) return automationImages.cityTours;
  if (/dinner|restaurant/.test(text)) return automationImages.specialDinner;

  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return automationImagePool[hash % automationImagePool.length];
}

/** Exact automation match first; otherwise keyword fallback from the action label. */
export function resolveAutomationImage(
  automations: Array<{ actionLabel: string; imageUrl?: string }>,
  label: string,
): string | undefined {
  const exact = automations.find((item) => item.actionLabel === label)?.imageUrl;
  if (exact) return exact;
  if (!label.trim()) return undefined;
  return imageForAutomationText(label);
}
