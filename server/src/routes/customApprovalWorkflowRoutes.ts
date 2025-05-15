import { ServerRoute } from "@hapi/hapi";
import * as CustomApprovalWorkflowController from "../controllers/customApprovalWorkflowController";

const customApprovalWorkflowRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/api/custom-approval-workflows",
    handler: CustomApprovalWorkflowController.createCustomApprovalWorkflow,
    options: {
      auth: { strategies: ["super_admin"] },
      description: "Create a new custom approval workflow",
      tags: ["api", "custom-approval-workflows"],
    },
  },
  {
    method: "GET",
    path: "/api/custom-approval-workflows",
    handler: CustomApprovalWorkflowController.getAllCustomApprovalWorkflows,
    options: {
      auth: { strategies: ["super_admin", "manager_hr", "admin"] },
      description: "Get all custom approval workflows",
      tags: ["api", "custom-approval-workflows"],
    },
  },
  {
    method: "GET",
    path: "/api/custom-approval-workflows/{id}",
    handler: CustomApprovalWorkflowController.getCustomApprovalWorkflowById,
    options: {
      auth: { strategies: ["super_admin", "manager_hr", "admin"] },
      description: "Get custom approval workflow by ID",
      tags: ["api", "custom-approval-workflows"],
    },
  },
  {
    method: "PUT",
    path: "/api/custom-approval-workflows/{id}",
    handler: CustomApprovalWorkflowController.updateCustomApprovalWorkflow,
    options: {
      auth: { strategies: ["super_admin"] },
      description: "Update custom approval workflow",
      tags: ["api", "custom-approval-workflows"],
    },
  },
  {
    method: "DELETE",
    path: "/api/custom-approval-workflows/{id}",
    handler: CustomApprovalWorkflowController.deleteCustomApprovalWorkflow,
    options: {
      auth: { strategies: ["super_admin"] },
      description: "Delete custom approval workflow",
      tags: ["api", "custom-approval-workflows"],
    },
  },
  {
    method: "POST",
    path: "/api/custom-approval-workflows/initialize-defaults",
    handler: CustomApprovalWorkflowController.initializeDefaultCustomApprovalWorkflows,
    options: {
      auth: { strategies: ["super_admin"] },
      description:
        "Initialize default custom approval workflows based on leave categories",
      tags: ["api", "custom-approval-workflows"],
    },
  },
];

export default customApprovalWorkflowRoutes;