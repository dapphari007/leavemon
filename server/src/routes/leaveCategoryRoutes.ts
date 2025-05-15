import { ServerRoute } from "@hapi/hapi";
import * as LeaveCategoryController from "../controllers/leaveCategoryController";

const leaveCategoryRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/api/leave-categories",
    handler: LeaveCategoryController.createLeaveCategory,
    options: {
      auth: { strategies: ["super_admin"] },
      description: "Create a new leave category",
      tags: ["api", "leave-categories"],
    },
  },
  {
    method: "GET",
    path: "/api/leave-categories",
    handler: LeaveCategoryController.getAllLeaveCategories,
    options: {
      auth: { strategies: ["super_admin", "manager_hr", "admin"] },
      description: "Get all leave categories",
      tags: ["api", "leave-categories"],
    },
  },
  {
    method: "GET",
    path: "/api/leave-categories/{id}",
    handler: LeaveCategoryController.getLeaveCategoryById,
    options: {
      auth: { strategies: ["super_admin", "manager_hr", "admin"] },
      description: "Get leave category by ID",
      tags: ["api", "leave-categories"],
    },
  },
  {
    method: "PUT",
    path: "/api/leave-categories/{id}",
    handler: LeaveCategoryController.updateLeaveCategory,
    options: {
      auth: { strategies: ["super_admin"] },
      description: "Update leave category",
      tags: ["api", "leave-categories"],
    },
  },
  {
    method: "DELETE",
    path: "/api/leave-categories/{id}",
    handler: LeaveCategoryController.deleteLeaveCategory,
    options: {
      auth: { strategies: ["super_admin"] },
      description: "Delete leave category",
      tags: ["api", "leave-categories"],
    },
  },
  {
    method: "POST",
    path: "/api/leave-categories/initialize-defaults",
    handler: LeaveCategoryController.initializeDefaultLeaveCategories,
    options: {
      auth: { strategies: ["super_admin"] },
      description: "Initialize default leave categories",
      tags: ["api", "leave-categories"],
    },
  },
];

export default leaveCategoryRoutes;