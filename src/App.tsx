import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { Shell } from "./components/Shell";
import { Dashboard } from "./pages/Dashboard";
import { ListingPage } from "./pages/ListingPage";
import { GuestProfile } from "./pages/GuestProfile";
import { GuestsPage } from "./pages/GuestsPage";
import { AutomationsPage } from "./pages/AutomationsPage";
import type { ListingId } from "./data/shift";

const opportunityMoments = ["check-ins", "in-house", "check-outs"] as const;
type OpportunityMoment = (typeof opportunityMoments)[number];

function isOpportunityMoment(value: string | undefined): value is OpportunityMoment {
  return opportunityMoments.includes(value as OpportunityMoment);
}

function OpportunitiesListingRoute() {
  const { moment } = useParams();
  if (!isOpportunityMoment(moment)) {
    return <Navigate to="/opportunities/check-ins" replace />;
  }
  return <ListingPage listingId={moment satisfies ListingId} />;
}

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Dashboard />} />
        <Route path="opportunities" element={<Navigate to="/opportunities/check-ins" replace />} />
        <Route path="opportunities/:moment" element={<OpportunitiesListingRoute />} />
        <Route path="check-ins" element={<Navigate to="/opportunities/check-ins" replace />} />
        <Route path="in-house" element={<Navigate to="/opportunities/in-house" replace />} />
        <Route path="check-outs" element={<Navigate to="/opportunities/check-outs" replace />} />
        <Route path="recovery" element={<ListingPage listingId="recovery" />} />
        <Route path="guests/:guestId" element={<GuestProfile />} />
        <Route path="guests" element={<GuestsPage />} />
        <Route path="automations" element={<AutomationsPage />} />
        <Route path="configuration" element={<Navigate to="/automations" replace />} />
      </Route>
    </Routes>
  );
}
