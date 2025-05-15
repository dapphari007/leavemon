import { ServerRoute } from "@hapi/hapi";
import {
  registerClient,
  loginClient,
  getClientProfile,
  updateClientProfile,
} from "../controllers/clientController";

const clientRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/api/clients/register",
    handler: registerClient,
    options: {
      auth: false,
      description: "Register a new client",
      tags: ["api", "clients"],
    },
  },
  {
    method: "POST",
    path: "/api/clients/login",
    handler: loginClient,
    options: {
      auth: false,
      description: "Client login",
      tags: ["api", "clients"],
    },
  },
  {
    method: "GET",
    path: "/api/clients/profile",
    handler: getClientProfile,
    options: {
      auth: "client",
      description: "Get client profile",
      tags: ["api", "clients"],
    },
  },
  {
    method: "PUT",
    path: "/api/clients/profile",
    handler: updateClientProfile,
    options: {
      auth: "client",
      description: "Update client profile",
      tags: ["api", "clients"],
    },
  },
];

export default clientRoutes;