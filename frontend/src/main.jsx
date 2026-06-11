import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "react-day-picker/dist/style.css";
import { HolidayProvider } from "./context/HolidayContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <HolidayProvider>
        <App />
      </HolidayProvider>
    </AuthProvider>
  </StrictMode>,
);
