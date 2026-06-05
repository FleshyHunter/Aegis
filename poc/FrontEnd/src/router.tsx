import React from "react";
import { createBrowserRouter } from "react-router-dom";
import Home from "./containers/Home/Home";
import BAList from "./containers/BAList/BAList";
import BAEntry from "./containers/BAList/BAEntry";
import TicketList from "./containers/TicketList/TicketList";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/ba",
    element: <BAList />,
  },
  {
    path: "/ba/:id",
    element: <BAEntry />,
  },
  {
    path: "/tickets",
    element: <TicketList />,
  },
]);

export default router;
