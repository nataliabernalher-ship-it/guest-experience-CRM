import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AutomationsProvider } from "./state/AutomationsState";
import { ShiftProvider } from "./state/ShiftState";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ShiftProvider>
        <AutomationsProvider>
          <App />
        </AutomationsProvider>
      </ShiftProvider>
    </BrowserRouter>
  </StrictMode>,
);
