import React from "react";
import { createBrowserRouter } from "react-router-dom";
import Home from "./containers/Home/Home";
import TicketList from "./containers/TicketList/TicketList";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/tickets",
    element: <TicketList />,
  },
]);

export default router;
