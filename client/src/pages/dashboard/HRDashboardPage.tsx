import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getManagerDashboard, getEmployeeDashboard } from "../../services/dashboardService";
import { getAllLeaveRequests } from "../../services/leaveRequestService";
import { getAllLeaveBalances } from "../../services/leaveBalanceService";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Alert from "../../components/ui/Alert";
import { formatDate } from "../../utils/dateUtils";
import { Link } from "react-router-dom";

const HRDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Fetch HR dashboard data (similar to manager dashboard)
  const { data: hrDashboard, isLoading: isHRLoading } = useQuery({
    queryKey: ["hrDashboard"],
    queryFn: getManagerDashboard,
    onError: (err: any) =>
      setError(err.message || "Failed to load dashboard data"),
  });

  // Fetch employee dashboard data for personal leave balances
  const { data: employeeDashboard, isLoading: isEmployeeLoading } = useQuery({
    queryKey: ["employeeDashboard"],
    queryFn: getEmployeeDashboard,
    onError: (err: any) =>
      setError(err.message || "Failed to load dashboard data"),
  });

  // Fetch all pending leave requests for HR review
  const { data: allPendingRequests, isLoading: isPendingLoading } = useQuery({
    queryKey: ["allPendingRequests"],
    queryFn: () => getAllLeaveRequests({ status: "pending" }),
    onError: (err: any) =>
      setError(err.message || "Failed to load pending requests"),
  });

  // Fetch all leave balances for the current year
  const currentYear = new Date().getFullYear();
  const { data: allLeaveBalances, isLoading: isBalancesLoading } = useQuery({
    queryKey: ["allLeaveBalances", currentYear],
    queryFn: () => getAllLeaveBalances({ year: currentYear }),
    onError: (err: any) =>
      setError(err.message || "Failed to load leave balances"),
  });

  const isLoading = isHRLoading || isPendingLoading || isEmployeeLoading || isBalancesLoading;

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
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        HR Dashboard
      </h1>

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
          {/* HR Dashboard */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Personal Leave Balance Card */}
            <Card title="My Leave Balance">
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
                  View my leave history →
                </Link>
              </div>
            </Card>
            
            <Card title="All Pending Leave Requests">
              {allPendingRequests?.leaveRequests &&
              allPendingRequests.leaveRequests.length > 0 ? (
                <div className="space-y-4">
                  {allPendingRequests.leaveRequests
                    .slice(0, 5)
                    .map((request) => (
                      <div
                        key={request.id}
                        className="border-b border-gray-200 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {request.user?.firstName} {request.user?.lastName}
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
                <p className="text-gray-500 py-2">No pending leave requests.</p>
              )}
              <div className="mt-4 text-right">
                <Link
                  to="/team-leaves"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  View all requests →
                </Link>
              </div>
            </Card>

            <Card title="Team Availability">
              {hrDashboard?.teamAvailability &&
              hrDashboard.teamAvailability.length > 0 ? (
                <div className="space-y-4">
                  {hrDashboard.teamAvailability.map((day, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-200 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{formatDate(day.date)}</p>
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
                            {day.availableCount} / {day.totalUsers} available
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
              <div className="mt-4 text-right">
                <Link
                  to="/leave-calendar"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  View leave calendar →
                </Link>
              </div>
            </Card>

            <Card title="Upcoming Holidays">
              {hrDashboard?.upcomingHolidays &&
              hrDashboard.upcomingHolidays.length > 0 ? (
                <div className="space-y-4">
                  {hrDashboard.upcomingHolidays.map((holiday) => (
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
              <div className="mt-4 text-right">
                <Link
                  to="/holidays"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Manage holidays →
                </Link>
              </div>
            </Card>
          </div>

          {/* Team Leave Balances Section */}
          <Card title="Team Leave Balances">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-xs leading-normal">
                    <th className="py-2 px-3 text-left">Employee</th>
                    <th className="py-2 px-3 text-left">Leave Type</th>
                    <th className="py-2 px-3 text-left">Total</th>
                    <th className="py-2 px-3 text-left">Used</th>
                    <th className="py-2 px-3 text-left">Remaining</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {isBalancesLoading ? (
                    <tr>
                      <td colSpan={5} className="py-3 text-center">
                        Loading leave balances...
                      </td>
                    </tr>
                  ) : allLeaveBalances && allLeaveBalances.length > 0 ? (
                    allLeaveBalances.slice(0, 5).map((balance: any) => (
                      <tr key={balance.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-2 px-3">
                          {balance.user?.firstName} {balance.user?.lastName}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center">
                            <div 
                              className="w-2 h-2 rounded-full mr-2" 
                              style={{ backgroundColor: balance.leaveType?.color || '#6366F1' }}
                            ></div>
                            {balance.leaveType?.name}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          {Number(balance.balance || 0) + Number(balance.carryForward || 0)}
                        </td>
                        <td className="py-2 px-3">{Number(balance.used || 0)}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center">
                            <span className="mr-2 font-medium">
                              {Number(balance.balance || 0) + Number(balance.carryForward || 0) - Number(balance.used || 0)}
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="h-1.5 rounded-full" 
                                style={{ 
                                  width: `${Math.min(100, ((Number(balance.balance || 0) + Number(balance.carryForward || 0) - Number(balance.used || 0)) / (Number(balance.balance || 0) + Number(balance.carryForward || 0))) * 100)}%`,
                                  backgroundColor: balance.leaveType?.color || '#6366F1'
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-3 text-center">
                        No leave balances found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right">
              <Link
                to="/leave-balances"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                View all leave balances →
              </Link>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/leave-calendar"
                className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex flex-col items-center justify-center text-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-500 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium">Leave Calendar</span>
                <span className="text-sm text-gray-500">
                  View team availability
                </span>
              </Link>

              <Link
                to="/team-leaves"
                className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex flex-col items-center justify-center text-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-green-500 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">Approve Leaves</span>
                <span className="text-sm text-gray-500">
                  Review pending requests
                </span>
              </Link>

              <Link
                to="/leave-balances"
                className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex flex-col items-center justify-center text-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-purple-500 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="font-medium">Leave Balances</span>
                <span className="text-sm text-gray-500">
                  Manage employee balances
                </span>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HRDashboardPage;
