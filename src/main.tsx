import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { ShiftProvider } from "./state/ShiftState";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ShiftProvider>
        <App />
      </ShiftProvider>
    </BrowserRouter>
  </StrictMode>,
);
