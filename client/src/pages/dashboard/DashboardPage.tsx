import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getEmployeeDashboard,
  getManagerDashboard,
} from "../../services/dashboardService";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Alert from "../../components/ui/Alert";
import { formatDate } from "../../utils/dateUtils";
import { Link, Navigate } from "react-router-dom";
import HRDashboardPage from "./HRDashboardPage";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Redirect based on role
  if (user?.role === "super_admin") {
    return <Navigate to="/super-admin-dashboard" replace />;
  }

  if (user?.role === "hr") {
    return <HRDashboardPage />;
  }

  const isManager = user?.role === "manager" || user?.role === "team_lead";

  // Fetch dashboard data based on user role
  const { data: employeeDashboard, isLoading: isEmployeeLoading } = useQuery({
    queryKey: ["employeeDashboard"],
    queryFn: getEmployeeDashboard,
    onError: (err: any) =>
      setError(err.message || "Failed to load dashboard data"),
  });

  const { data: managerDashboard, isLoading: isManagerLoading } = useQuery({
    queryKey: ["managerDashboard"],
    queryFn: getManagerDashboard,
    enabled: isManager,
    onError: (err: any) =>
      setError(err.message || "Failed to load dashboard data"),
  });

  const isLoading = isEmployeeLoading || (isManager && isManagerLoading);

  // Helper function to render leave status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "rejected":
        return <Badge variant="danger">Rejected</Badge>;
      case "cancelled":
        return <Badge variant="default">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          className="mb-6"
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Employee Dashboard */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card title="Leave Balance">
              {employeeDashboard?.leaveBalance &&
              employeeDashboard.leaveBalance.length > 0 ? (
                <div className="space-y-4">
                  {employeeDashboard.leaveBalance.map((balance) => (
                    <div
                      key={balance.id}
                      className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: balance.leaveType?.color || '#6366F1' }}
                          ></div>
                          <p className="font-medium">{balance.leaveType?.name}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Used: <span className="font-medium text-gray-700">{balance.usedDays}</span> | 
                          Pending: <span className="font-medium text-gray-700">{balance.pendingDays}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">
                          {balance.remainingDays} / {balance.totalDays}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1 mb-1">
                          <div 
                            className="bg-primary-600 h-2.5 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (balance.remainingDays / balance.totalDays) * 100)}%`,
                              backgroundColor: balance.leaveType?.color || '#6366F1'
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500">Remaining</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-2">
                  No leave balance information available.
                </p>
              )}
              <div className="mt-4 text-right">
                <Link
                  to="/my-leaves"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  View leave history →
                </Link>
              </div>
            </Card>

            <Card title="Pending Requests">
              {employeeDashboard?.pendingRequests &&
              employeeDashboard.pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {employeeDashboard.pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border-b border-gray-200 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {request.leaveType?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(request.startDate)} -{" "}
                            {formatDate(request.endDate)}
                          </p>
                        </div>
                        {renderStatusBadge(request.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-2">No pending leave requests.</p>
              )}
              <div className="mt-4 text-right">
                <Link
                  to="/my-leaves"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  View all requests →
                </Link>
              </div>
            </Card>

            <Card title="Upcoming Holidays">
              {employeeDashboard?.upcomingHolidays &&
              employeeDashboard.upcomingHolidays.length > 0 ? (
                <div className="space-y-4">
                  {employeeDashboard.upcomingHolidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="border-b border-gray-200 pb-3 last:border-0 last:pb-0"
                    >
                      <p className="font-medium">{holiday.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(holiday.date)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-2">No upcoming holidays.</p>
              )}
            </Card>
          </div>

          {/* Manager Dashboard */}
          {isManager && managerDashboard && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Team Management
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card title="Team Leave Requests">
                  {managerDashboard.pendingRequests &&
                  managerDashboard.pendingRequests.length > 0 ? (
                    <div className="space-y-4">
                      {managerDashboard.pendingRequests.map((request) => (
                        <div
                          key={request.id}
                          className="border-b border-gray-200 pb-3 last:border-0 last:pb-0"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {request.user?.firstName}{" "}
                                {request.user?.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {request.leaveType?.name}:{" "}
                                {formatDate(request.startDate)} -{" "}
                                {formatDate(request.endDate)}
                              </p>
                            </div>
                            {renderStatusBadge(request.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 py-2">
                      No pending team leave requests.
                    </p>
                  )}
                  <div className="mt-4 text-right">
                    <Link
                      to="/team-leaves"
                      className="text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                      View all team requests →
                    </Link>
                  </div>
                </Card>

                <Card title="Team Availability">
                  {managerDashboard.teamAvailability &&
                  managerDashboard.teamAvailability.length > 0 ? (
                    <div className="space-y-4">
                      {managerDashboard.teamAvailability.map((day, index) => (
                        <div
                          key={index}
                          className="border-b border-gray-200 pb-3 last:border-0 last:pb-0"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {formatDate(day.date)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {day.isWeekend
                                  ? "Weekend"
                                  : day.isHoliday
                                  ? "Holiday"
                                  : "Working Day"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {day.availableCount} / {day.totalUsers}{" "}
                                available
                              </p>
                              {day.onLeaveCount > 0 && (
                                <p className="text-xs text-red-600">
                                  {day.onLeaveCount} on leave
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 py-2">
                      No team availability information.
                    </p>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
