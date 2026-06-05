import React from "react";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import { PopupProvider } from "./components/PopUp/PopupContext";

export default function App() {
  return (
    <PopupProvider>
      <RouterProvider router={router} />
    </PopupProvider>
  );
}
