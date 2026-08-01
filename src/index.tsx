import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/main.scss";
import App from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Nie znaleziono elementu o identyfikatorze "root".');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
