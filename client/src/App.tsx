import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SubscriptionGuard from "./components/auth/SubscriptionGuard";
import ErrorBoundary from "./components/ErrorBoundary";

// Landing Pages
import LandingPage from "./pages/landing/LandingPage";
import WelcomePage from "./pages/landing/WelcomePage";
import ContactSalesPage from "./pages/landing/ContactSalesPage";

// Error Pages
import NotFoundPage from "./pages/NotFoundPage";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import SuperAdminLoginPage from "./pages/auth/SuperAdminLoginPage";
import SuperAdminLoginInfo from "./pages/auth/SuperAdminLoginInfo";
import LoginDebugger from "./pages/auth/LoginDebugger";
import CreateSuperAdmin from "./pages/auth/CreateSuperAdmin";
import SimpleLoginForm from "./pages/auth/SimpleLoginForm";

// Dashboard Pages
import DashboardPage from "./pages/dashboard/DashboardPage";

// Leave Pages
import MyLeavesPage from "./pages/leaves/MyLeavesPage";
import ApplyLeavePage from "./pages/leaves/ApplyLeavePage";
import TeamLeavesPage from "./pages/leaves/TeamLeavesPage";
import ViewLeaveRequestPage from "./pages/leaves/ViewLeaveRequestPage";
import LeaveCalendarPage from "./pages/leaves/LeaveCalendarPage";

// Profile Pages
import ProfilePage from "./pages/profile/ProfilePage";
import SettingsPage from "./pages/settings/SettingsPage";

// Subscription Pages
import SubscriptionExpiredPage from "./pages/subscription/SubscriptionExpiredPage";

// Admin Pages
import UsersPage from "./pages/admin/UsersPage";
import CreateUserPage from "./pages/admin/CreateUserPage";
import EditUserPage from "./pages/admin/EditUserPage";
import LeaveTypesPage from "./pages/admin/LeaveTypesPage";
import CreateLeaveTypePage from "./pages/admin/CreateLeaveTypePage";
import EditLeaveTypePage from "./pages/admin/EditLeaveTypePage";
import LeaveTypeConfigPage from "./pages/admin/LeaveTypeConfigPage";
import HolidaysPage from "./pages/admin/HolidaysPage";
import CreateHolidayPage from "./pages/admin/CreateHolidayPage";
import EditHolidayPage from "./pages/admin/EditHolidayPage";

import ApprovalWorkflowsPage from "./pages/admin/ApprovalWorkflowsPage";
import CreateApprovalWorkflowPage from "./pages/admin/CreateApprovalWorkflowPage";
import EditApprovalWorkflowPage from "./pages/admin/EditApprovalWorkflowPage";
import ApprovalWorkflowCustomizationPage from "./pages/admin/ApprovalWorkflowCustomizationPage";
import CreateCustomApprovalWorkflowPage from "./pages/admin/CreateCustomApprovalWorkflowPage";
import EditCustomApprovalWorkflowPage from "./pages/admin/EditCustomApprovalWorkflowPage";
import TopLevelPositionsPage from "./pages/admin/TopLevelPositionsPage";
import SuperAdminDashboardPage from "./pages/admin/SuperAdminDashboardPage";
import RolesPage from "./pages/admin/RolesPage";
import CreateRolePage from "./pages/admin/CreateRolePage";
import EditRolePage from "./pages/admin/EditRolePage";
import DepartmentsPage from "./pages/admin/DepartmentsPage";
import CreateDepartmentPage from "./pages/admin/CreateDepartmentPage";
import EditDepartmentPage from "./pages/admin/EditDepartmentPage";
import PositionsPage from "./pages/admin/PositionsPage";
import CreatePositionPage from "./pages/admin/CreatePositionPage";
import EditPositionPage from "./pages/admin/EditPositionPage";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Define route structure for React Router v7
const router = createBrowserRouter([
  // Landing Page
  {
    path: "/",
    element: <LandingPage />,
  },
  
  // Public Routes
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/welcome",
    element: <WelcomePage />,
  },
  {
    path: "/contact-sales",
    element: <ContactSalesPage />,
  },
  
  // 404 Page - This should be at the end of all routes
  {
    path: "*",
    element: <NotFoundPage />,
  },
  {
    path: "/super-admin",
    element: <SuperAdminLoginPage />,
  },
  {
    path: "/super-admin-info",
    element: <SuperAdminLoginInfo />,
  },
  {
    path: "/login-debug",
    element: <LoginDebugger />,
  },
  {
    path: "/create-super-admin",
    element: <CreateSuperAdmin />,
  },
  {
    path: "/simple-login",
    element: <SimpleLoginForm />,
  },

  // Subscription Expired Page
  {
    path: "/subscription-expired",
    element: <ProtectedRoute><SubscriptionExpiredPage /></ProtectedRoute>,
  },

  // Protected Routes - All Users
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <SubscriptionGuard />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/my-leaves",
            element: <MyLeavesPage />,
          },
          {
            path: "/apply-leave",
            element: <ApplyLeavePage />,
          },
          {
            path: "/leave-requests/:id",
            element: <ViewLeaveRequestPage />,
          },
          {
            path: "/profile",
            element: <ProfilePage />,
          },
          {
            path: "/settings",
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },

  // Manager and Team Lead Routes
  {
    element: (
      <ProtectedRoute allowedRoles={["manager", "admin", "team_lead", "hr", "super_admin"]} />
    ),
    children: [
      {
        element: <SubscriptionGuard />,
        children: [
          {
            path: "/team-leaves",
            element: <TeamLeavesPage />,
          },
        ],
      },
    ],
  },

  // Leave Calendar Route (accessible to all roles)
  {
    element: (
      <ProtectedRoute
        allowedRoles={[
          "manager",
          "admin",
          "team_lead",
          "hr",
          "employee",
          "super_admin",
        ]}
      />
    ),
    children: [
      {
        element: <SubscriptionGuard />,
        children: [
          {
            path: "/leave-calendar",
            element: <LeaveCalendarPage />,
          },
        ],
      },
    ],
  },

  // Super Admin Routes
  {
    path: "/super-admin-dashboard",
    element: (
      <ProtectedRoute allowedRoles={["super_admin"]}>
        <SuperAdminDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/approval-workflow-customization",
    element: (
      <ProtectedRoute allowedRoles={["super_admin"]}>
        <ApprovalWorkflowCustomizationPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/custom-approval-workflow/create",
    element: (
      <ProtectedRoute allowedRoles={["super_admin"]}>
        <CreateCustomApprovalWorkflowPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/custom-approval-workflow/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={["super_admin"]}>
        <EditCustomApprovalWorkflowPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/top-level-positions",
    element: (
      <ProtectedRoute allowedRoles={["super_admin"]}>
        <TopLevelPositionsPage />
      </ProtectedRoute>
    ),
  },

  // Admin Routes
  {
    element: <ProtectedRoute allowedRoles={["super_admin", "admin"]} />,
    children: [
      {
        path: "/users",
        element: <UsersPage />,
      },
      {
        path: "/users/create",
        element: <CreateUserPage />,
      },
      {
        path: "/users/edit/:id",
        element: <EditUserPage />,
      },
      {
        path: "/leave-types",
        element: <LeaveTypesPage />,
      },
      {
        path: "/leave-types/create",
        element: <CreateLeaveTypePage />,
      },
      {
        path: "/leave-types/edit/:id",
        element: <EditLeaveTypePage />,
        key: "edit-leave-type",
      },
      {
        path: "/leave-types/config",
        element: <LeaveTypeConfigPage />,
      },
      {
        path: "/holidays",
        element: <HolidaysPage />,
      },
      {
        path: "/holidays/create",
        element: <CreateHolidayPage />,
      },
      {
        path: "/holidays/edit/:id",
        element: <EditHolidayPage />,
      },

      {
        path: "/approval-workflows",
        element: <ApprovalWorkflowsPage />,
      },
      {
        path: "/approval-workflows/create",
        element: <CreateApprovalWorkflowPage />,
      },
      {
        path: "/approval-workflows/edit/:id",
        element: <EditApprovalWorkflowPage />,
      },
      {
        path: "/roles",
        element: <RolesPage />,
      },
      {
        path: "/roles/create",
        element: <CreateRolePage />,
      },
      {
        path: "/roles/edit/:id",
        element: <EditRolePage />,
      },
      {
        path: "/departments",
        element: <DepartmentsPage />,
      },
      {
        path: "/departments/create",
        element: <CreateDepartmentPage />,
      },
      {
        path: "/departments/edit/:id",
        element: <EditDepartmentPage />,
      },
      {
        path: "/positions",
        element: <PositionsPage />,
      },
      {
        path: "/positions/create",
        element: <CreatePositionPage />,
      },
      {
        path: "/positions/edit/:id",
        element: <EditPositionPage />,
      },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <RouterProvider router={router} />
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
