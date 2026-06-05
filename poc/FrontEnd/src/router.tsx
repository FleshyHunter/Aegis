import React from "react";
import { createBrowserRouter } from "react-router-dom";
import Home from "./containers/Home/Home";
import BAList from "./containers/BAList/BAList";
import BAEntry from "./containers/BAList/BAEntry";
import BuildingBlocks from "./containers/BuildingBlocks/BuildingBlocks";
import BuildingBlockEntry from "./containers/BuildingBlocks/BuildingBlockEntry";
import TicketList from "./containers/TicketList/TicketList";
import TicketSets from "./containers/TicketSets/TicketSets";
import TicketSetEntry from "./containers/TicketSets/TicketSetEntry";

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
    path: "/building-blocks",
    element: <BuildingBlocks />,
  },
  {
    path: "/building-blocks/:id",
    element: <BuildingBlockEntry />,
  },
  {
    path: "/ticket-sets",
    element: <TicketSets />,
  },
  {
    path: "/ticket-sets/:id",
    element: <TicketSetEntry />,
  },
  {
    path: "/tickets",
    element: <TicketList />,
  },
]);

export default router;
