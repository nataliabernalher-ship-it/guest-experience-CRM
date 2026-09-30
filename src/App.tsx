import { Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { Dashboard } from "./pages/Dashboard";
import { ListingPage } from "./pages/ListingPage";
import { GuestProfile } from "./pages/GuestProfile";
import { LaterPage } from "./pages/LaterPage";

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Dashboard />} />
        <Route path="check-ins" element={<ListingPage listingId="check-ins" />} />
        <Route path="check-outs" element={<ListingPage listingId="check-outs" />} />
        <Route path="in-house" element={<ListingPage listingId="in-house" />} />
        <Route path="recovery" element={<ListingPage listingId="recovery" />} />
        <Route path="opportunities" element={<LaterPage title="Opportunities" />} />
        <Route path="guests/:guestId" element={<GuestProfile />} />
        <Route path="guests" element={<LaterPage title="Guests" />} />
      </Route>
    </Routes>
  );
}
