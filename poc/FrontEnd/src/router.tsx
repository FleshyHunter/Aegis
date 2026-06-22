import { createBrowserRouter } from "react-router-dom";
import Home from "./containers/Home/Home";
import BAList from "./containers/BAList/BAList";
import BAEntry from "./containers/BAList/BAEntry";
import ProjectContexts from "./containers/ProjectContexts/ProjectContexts";
import ProjectContextEntry from "./containers/ProjectContexts/ProjectContextEntry";
import BuildingBlocks from "./containers/BuildingBlocks/BuildingBlocks";
import BuildingBlockEntry from "./containers/BuildingBlocks/BuildingBlockEntry";
import TicketList from "./containers/TicketList/TicketList";
import TicketSets from "./containers/TicketSets/TicketSets";
import TicketSetEntry from "./containers/TicketSets/TicketSetEntry";
import TicketSetRaw from "./containers/TicketSets/TicketSetRaw";
import TicketSetDerived from "./containers/TicketSets/TicketSetDerived";
import TicketSetPipeline from "./containers/TicketSets/TicketSetPipeline";
import TicketSetResults from "./containers/TicketSets/TicketSetResults";
import TicketSetSummary from "./containers/TicketSets/TicketSetSummary";
import Guide from "./containers/Guide/Guide";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/guide",
    element: <Guide />,
  },
  {
    path: "/ba",
    element: <BAList />,
  },
  {
    path: "/project-contexts",
    element: <ProjectContexts />,
  },
  {
    path: "/project-contexts/:id",
    element: <ProjectContextEntry />,
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
    path: "/ticket-sets/:id/raw",
    element: <TicketSetRaw />,
  },
  {
    path: "/ticket-sets/:id/derived",
    element: <TicketSetDerived />,
  },
  {
    path: "/ticket-sets/:id/pipeline",
    element: <TicketSetPipeline />,
  },
  {
    path: "/ticket-sets/:id/results",
    element: <TicketSetResults />,
  },
  {
    path: "/ticket-sets/:id/summary",
    element: <TicketSetSummary />,
  },
  {
    path: "/tickets",
    element: <TicketList />,
  },
]);

export default router;
