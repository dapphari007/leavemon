import { ServerRoute } from "@hapi/hapi";
import * as TopLevelPositionController from "../controllers/topLevelPositionController";

const topLevelPositionRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/api/top-level-positions",
    handler: TopLevelPositionController.createTopLevelPosition,
    options: {
      auth: { strategies: ["super_admin"] },
      description: "Create a new top level position",
      tags: ["api", "top-level-positions"],
    },
  },
  {
    method: "GET",
    path: "/api/top-level-positions",
    handler: TopLevelPositionController.getAllTopLevelPositions,
    options: {
      auth: { strategies: ["super_admin", "manager_hr", "admin"] },
      description: "Get all top level positions",
      tags: ["api", "top-level-positions"],
    },
  },
  {
    method: "GET",
    path: "/api/top-level-positions/{id}",
    handler: TopLevelPositionController.getTopLevelPositionById,
    options: {
      auth: { strategies: ["super_admin", "manager_hr", "admin"] },
      description: "Get top level position by ID",
      tags: ["api", "top-level-positions"],
    },
  },
  {
    method: "PUT",
    path: "/api/top-level-positions/{id}",
    handler: TopLevelPositionController.updateTopLevelPosition,
    options: {
      auth: { strategies: ["super_admin"] },
      description: "Update top level position",
      tags: ["api", "top-level-positions"],
    },
  },
  {
    method: "DELETE",
    path: "/api/top-level-positions/{id}",
    handler: TopLevelPositionController.deleteTopLevelPosition,
    options: {
      auth: { strategies: ["super_admin"] },
      description: "Delete top level position",
      tags: ["api", "top-level-positions"],
    },
  },
];

export default topLevelPositionRoutes;