import React from "react";
import ReactDOM from "react-dom/client";
import {HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import AppContextProvider from "./context/AppContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <HashRouter>
    <AppContextProvider>
      <App />
    </AppContextProvider>
  </HashRouter>
);
