import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getTeamLeaveRequests,
  updateLeaveRequestStatus,
  approveDeleteLeaveRequest,
  rejectDeleteLeaveRequest,
} from "../../services/leaveRequestService";
import { LeaveRequest, UpdateLeaveRequestStatusData } from "../../types";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import Textarea from "../../components/ui/Textarea";
import Modal from "../../components/ui/Modal";
import { formatDate } from "../../utils/dateUtils";
import { getErrorMessage } from "../../utils/errorUtils";
import { useAuth } from "../../context/AuthContext";

const TeamLeavesPage: React.FC = () => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("pending");
  const [comments, setComments] = useState<string>("");
  const [actionLeaveId, setActionLeaveId] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApprovingDeletion, setIsApprovingDeletion] = useState(false);
  const [isRejectingDeletion, setIsRejectingDeletion] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);

  // Determine user role and position for approval level
  const userRole = user?.role || "";
  const userPosition = user?.position || "";
  
  // Role-based checks (keeping for backward compatibility)
  const isTeamLead = userRole === "team_lead";
  const isManager = userRole === "manager";
  const isHR = userRole === "hr";
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin";
  
  // Position-based checks (new implementation)
  const isIntern = userPosition === "INTERN";
  const isTeamLeadPosition = userPosition === "TEAM_LEAD";
  const isHRManager = userPosition === "HR MANAGER";
  const isHRDirector = userPosition === "HR DIRECTOR";
  
  // Log the hardcoded workflow being used
  console.log("USING HARDCODED POSITION-BASED APPROVAL WORKFLOW:");
  console.log("INTERN -> TEAM_LEAD -> HR MANAGER -> HR DIRECTOR");
  console.log("TEAM_LEAD -> HR MANAGER -> HR DIRECTOR");
  console.log("MANAGER -> HR DIRECTOR");
  console.log("DIRECTOR -> ADMIN");

  // Determine approval level based on position
  const getApprovalLevel = () => {
    // Position-based levels
    if (isTeamLeadPosition) return 1;
    if (isHRManager) return 2;
    if (isHRDirector) return 3;
    if (isAdmin) return 4;
    if (isSuperAdmin) return 5;
    
    // Fallback to role-based levels for backward compatibility
    if (isTeamLead) return 1;
    if (isManager) return 2;
    if (isHR) return 3;
    
    return 0;
  };
  
  // Check if the current user can approve a specific leave request
  const canApproveRequest = (request: LeaveRequest) => {
    const userApprovalLevel = getApprovalLevel();
    
    // If user has no approval level, they can't approve anything
    if (userApprovalLevel === 0) return false;
    
    // Super admins and admins can approve any request
    if (isSuperAdmin || isAdmin) return true;
    
    // For pending requests, check if the user is the appropriate approver
    if (request.status === "pending") {
      // Debug information - log to console to help troubleshoot
      console.log("Checking approval for request:", request.id);
      console.log("Current user role:", userRole, "User ID:", user?.id);
      console.log("Current user position:", userPosition);
      console.log("Request user:", request.user?.firstName, request.user?.lastName);
      console.log("Request user position:", request.user?.position);
      console.log("Request user managerId:", request.user?.managerId);
      console.log("Request user teamLeadId:", request.user?.teamLeadId);
      console.log("Request user hrId:", request.user?.hrId);
      
      // HARDCODED POSITION-BASED WORKFLOW LOGIC
      // Get the requester's position
      const requesterPosition = request.user?.position || "";
      
      // Get the number of days for the leave request
      const numberOfDays = request.numberOfDays || 0;
      
      // Determine the category based on the number of days
      let category = "";
      if (numberOfDays >= 0.5 && numberOfDays <= 2) {
        category = "Short Leave";
      } else if (numberOfDays >= 3 && numberOfDays <= 6) {
        category = "Medium Leave";
      } else if (numberOfDays >= 7 && numberOfDays <= 30) {
        category = "Long Leave";
      }
      
      console.log(`Leave request is for ${numberOfDays} days, category: ${category}`);
      
      // Implement the hardcoded workflow based on positions and category
      if (requesterPosition === "INTERN") {
        // INTERN always requires all 4 levels regardless of category
        // INTERN -> TEAM_LEAD -> HR MANAGER -> HR DIRECTOR -> ADMIN
        
        // For level 1 approval (TEAM_LEAD)
        if (isTeamLeadPosition && request.user && request.user.teamLeadId === user?.id) {
          console.log("HARDCODED WORKFLOW: INTERN request can be approved by TEAM_LEAD");
          return true;
        }
        
        // For level 2 approval (HR MANAGER)
        if (isHRManager) {
          console.log("HARDCODED WORKFLOW: INTERN request can be approved by HR MANAGER");
          return true;
        }
        
        // For level 3 approval (HR DIRECTOR)
        if (isHRDirector) {
          console.log("HARDCODED WORKFLOW: INTERN request can be approved by HR DIRECTOR");
          return true;
        }
        
        // For level 4 approval (ADMIN)
        if (isAdmin) {
          console.log("HARDCODED WORKFLOW: INTERN request can be approved by ADMIN");
          return true;
        }
      } 
      else if (requesterPosition === "TEAM_LEAD") {
        // For TEAM_LEAD, check the category
        if (category === "Short Leave") {
          // For short leaves, only need 2 levels (override category)
          // TEAM_LEAD -> HR MANAGER -> HR DIRECTOR
          
          // For level 1 approval (HR MANAGER)
          if (isHRManager) {
            console.log("HARDCODED WORKFLOW: TEAM_LEAD short leave request can be approved by HR MANAGER");
            return true;
          }
          
          // For level 2 approval (HR DIRECTOR)
          if (isHRDirector) {
            console.log("HARDCODED WORKFLOW: TEAM_LEAD short leave request can be approved by HR DIRECTOR");
            return true;
          }
        } else {
          // For medium and long leaves, need 3 levels
          // TEAM_LEAD -> HR MANAGER -> HR DIRECTOR -> ADMIN
          
          // For level 1 approval (HR MANAGER)
          if (isHRManager) {
            console.log(`HARDCODED WORKFLOW: TEAM_LEAD ${category} request can be approved by HR MANAGER`);
            return true;
          }
          
          // For level 2 approval (HR DIRECTOR)
          if (isHRDirector) {
            console.log(`HARDCODED WORKFLOW: TEAM_LEAD ${category} request can be approved by HR DIRECTOR`);
            return true;
          }
          
          // For level 3 approval (ADMIN)
          if (isAdmin) {
            console.log(`HARDCODED WORKFLOW: TEAM_LEAD ${category} request can be approved by ADMIN`);
            return true;
          }
        }
      }
      else if (requesterPosition === "HR MANAGER") {
        // MANAGER -> HR DIRECTOR
        // For level 1 approval (HR DIRECTOR)
        if (isHRDirector) {
          console.log("HARDCODED WORKFLOW: HR MANAGER request can be approved by HR DIRECTOR");
          return true;
        }
      }
      else if (requesterPosition === "HR DIRECTOR") {
        // DIRECTOR -> ADMIN
        // For level 1 approval (ADMIN)
        if (isAdmin) {
          console.log("HARDCODED WORKFLOW: HR DIRECTOR request can be approved by ADMIN");
          return true;
        }
      }
      
      // Fallback to role-based checks for backward compatibility
      // If the user is a team lead and the request is from their team member
      if (isTeamLead && request.user && request.user.teamLeadId === user?.id) {
        return true;
      }
      
      // If the user is a manager - allow approval for all pending requests
      if (isManager) {
        return true;
      }
      
      // If the user is HR and the request is from an employee they manage
      if (isHR && request.user && request.user.hrId === user?.id) {
        return true;
      }
      
      // Default to level 1 check for backward compatibility
      return userApprovalLevel === 1;
    }
    
    // For partially approved requests, check if the user's level matches the next required level
    if (request.status === "partially_approved" && request.metadata) {
      // Debug information - log to console to help troubleshoot
      console.log("Checking partially approved request:", request.id);
      console.log("Current user role:", userRole, "User ID:", user?.id);
      console.log("Current user position:", userPosition);
      console.log("Current approval level:", request.metadata.currentApprovalLevel);
      console.log("Required approval levels:", request.metadata.requiredApprovalLevels);
      
      const currentApprovalLevel = request.metadata.currentApprovalLevel || 0;
      const nextRequiredLevel = currentApprovalLevel + 1;
      
      // HARDCODED POSITION-BASED WORKFLOW LOGIC FOR PARTIALLY APPROVED REQUESTS
      // Get the requester's position
      const requesterPosition = request.user?.position || "";
      
      // Get the number of days for the leave request
      const numberOfDays = request.numberOfDays || 0;
      
      // Determine the category based on the number of days
      let category = "";
      if (numberOfDays >= 0.5 && numberOfDays <= 2) {
        category = "Short Leave";
      } else if (numberOfDays >= 3 && numberOfDays <= 6) {
        category = "Medium Leave";
      } else if (numberOfDays >= 7 && numberOfDays <= 30) {
        category = "Long Leave";
      }
      
      console.log(`Partially approved leave request is for ${numberOfDays} days, category: ${category}`);
      
      // Implement the hardcoded workflow based on positions and category
      if (requesterPosition === "INTERN") {
        // INTERN always requires all 4 levels regardless of category
        // INTERN -> TEAM_LEAD -> HR MANAGER -> HR DIRECTOR -> ADMIN
        if (currentApprovalLevel === 1 && isHRManager) {
          console.log("HARDCODED WORKFLOW: INTERN request at level 1 can be approved by HR MANAGER");
          return true;
        }
        if (currentApprovalLevel === 2 && isHRDirector) {
          console.log("HARDCODED WORKFLOW: INTERN request at level 2 can be approved by HR DIRECTOR");
          return true;
        }
        if (currentApprovalLevel === 3 && isAdmin) {
          console.log("HARDCODED WORKFLOW: INTERN request at level 3 can be approved by ADMIN");
          return true;
        }
      } 
      else if (requesterPosition === "TEAM_LEAD") {
        // For TEAM_LEAD, check the category
        if (category === "Short Leave") {
          // For short leaves, only need 2 levels
          // TEAM_LEAD -> HR MANAGER -> HR DIRECTOR
          if (currentApprovalLevel === 1 && isHRDirector) {
            console.log("HARDCODED WORKFLOW: TEAM_LEAD short leave request at level 1 can be approved by HR DIRECTOR");
            return true;
          }
        } else {
          // For medium and long leaves, need 3 levels
          // TEAM_LEAD -> HR MANAGER -> HR DIRECTOR -> ADMIN
          if (currentApprovalLevel === 1 && isHRDirector) {
            console.log(`HARDCODED WORKFLOW: TEAM_LEAD ${category} request at level 1 can be approved by HR DIRECTOR`);
            return true;
          }
          if (currentApprovalLevel === 2 && isAdmin) {
            console.log(`HARDCODED WORKFLOW: TEAM_LEAD ${category} request at level 2 can be approved by ADMIN`);
            return true;
          }
        }
      }
      else if (requesterPosition === "HR MANAGER") {
        // HR MANAGER -> HR DIRECTOR
        // No partially approved state for this workflow as it's only one level
      }
      else if (requesterPosition === "HR DIRECTOR") {
        // HR DIRECTOR -> ADMIN
        // No partially approved state for this workflow as it's only one level
      }
      
      // Check if the user's role matches what's needed for the next level
      if (request.metadata.workflowDetails && request.metadata.workflowDetails.approvalLevels) {
        const nextLevel = request.metadata.workflowDetails.approvalLevels.find(
          (level: any) => level.level === nextRequiredLevel
        );
        
        if (nextLevel) {
          console.log("Next level details:", nextLevel);
          
          // Check if the user's role matches the required role for this level
          if (nextLevel.roles && Array.isArray(nextLevel.roles)) {
            return nextLevel.roles.includes(user?.role || "");
          }
          
          // Check if the user is the specific approver type needed
          if (nextLevel.approverType) {
            if (nextLevel.approverType === "teamLead" && isTeamLead) return true;
            if (nextLevel.approverType === "manager" && isManager) return true;
            if (nextLevel.approverType === "hr" && isHR) return true;
            if (nextLevel.approverType === "superAdmin" && isSuperAdmin) return true;
          }
        }
      }
      
      // If the user is a manager, allow them to approve partially approved requests
      if (isManager) {
        return true;
      }
      
      // Fall back to level check if no specific role requirements found
      return userApprovalLevel === nextRequiredLevel;
    }
    
    return false;
  };

  // Fetch team leave requests
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["teamLeaveRequests", selectedYear, selectedStatus],
    queryFn: () => {
      // If status is "pending", also include "partially_approved" status
      // to show leave requests that need approval at higher levels
      if (selectedStatus === "pending") {
        return getTeamLeaveRequests({
          year: selectedYear,
          status: "pending_approval", // This is a special status that will fetch both pending and partially_approved
        });
      } else {
        return getTeamLeaveRequests({
          year: selectedYear,
          status: selectedStatus !== "all" ? (selectedStatus as any) : undefined,
        });
      }
    },
    onError: (err: any) => setError(getErrorMessage(err)),
  });

  // Handle approve/reject leave request
  const handleUpdateStatus = async (
    id: string,
    status: "pending" | "approved" | "rejected" | "cancelled"
  ) => {
    if (status === "approved") {
      setIsApproving(true);
    } else if (status === "rejected") {
      setIsRejecting(true);
    }

    try {
      const data: UpdateLeaveRequestStatusData = {
        status,
        comments: comments.trim() || undefined,
      };

      console.log("Sending request with data:", data);

      const response = await updateLeaveRequestStatus(id, data);
      console.log("Response received:", response);

      setSuccessMessage(`Leave request ${status} successfully`);
      setActionLeaveId(null);
      setComments("");
      refetch();
    } catch (err) {
      console.error("Error updating leave request status:", err);
      setError(getErrorMessage(err));
    } finally {
      setIsApproving(false);
      setIsRejecting(false);
    }
  };
  
  // Handle approve deletion request
  const handleApproveDeleteRequest = async (id: string) => {
    setIsApprovingDeletion(true);
    
    try {
      await approveDeleteLeaveRequest(id, comments.trim() || undefined);
      setSuccessMessage("Leave deletion request approved successfully");
      setActionLeaveId(null);
      setComments("");
      refetch();
    } catch (err) {
      console.error("Error approving leave deletion:", err);
      setError(getErrorMessage(err));
    } finally {
      setIsApprovingDeletion(false);
    }
  };
  
  // Handle reject deletion request
  const handleRejectDeleteRequest = async (id: string) => {
    setIsRejectingDeletion(true);
    
    try {
      await rejectDeleteLeaveRequest(id, comments.trim() || undefined);
      setSuccessMessage("Leave deletion request rejected successfully");
      setActionLeaveId(null);
      setComments("");
      refetch();
    } catch (err) {
      console.error("Error rejecting leave deletion:", err);
      setError(getErrorMessage(err));
    } finally {
      setIsRejectingDeletion(false);
    }
  };
  
  // Handle view approval workflow
  const handleViewApprovalWorkflow = (leaveRequest: LeaveRequest) => {
    setSelectedLeaveRequest(leaveRequest);
    setIsApprovalModalOpen(true);
  };

  // Helper function to render leave status badge
  const renderStatusBadge = (status: string, metadata?: any) => {
    // If it's partially approved and has metadata, show the approval level status
    if (status === "partially_approved" && metadata) {
      const currentLevel = metadata.currentApprovalLevel || 0;
      
      return (
        <div className="flex flex-col">
          <Badge variant="warning">Partially Approved</Badge>
          <span className="text-xs text-gray-600 mt-1">
            L-{currentLevel} approved
          </span>
        </div>
      );
    }
    
    switch (status) {
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "rejected":
        return <Badge variant="danger">Rejected</Badge>;
      case "cancelled":
        return <Badge variant="default">Cancelled</Badge>;
      case "partially_approved":
        return <Badge variant="warning">Partially Approved</Badge>;
      case "pending_deletion":
        return <Badge variant="warning">Pending Deletion</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Generate year options for filter
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);
  
  // Helper function to get approver position name
  const getApproverPositionName = (levelDetails: any): string => {
    if (!levelDetails) return "Unknown";
    
    // For hardcoded position-based workflow, show the position name
    if (levelDetails.level) {
      // Get the requester's position from the selected leave request
      const requesterPosition = selectedLeaveRequest?.user?.position || "";
      
      // Return the appropriate position based on the hardcoded workflow
      if (requesterPosition === "INTERN") {
        // INTERN -> TEAM_LEAD -> HR MANAGER -> HR DIRECTOR
        if (levelDetails.level === 1) return "TEAM_LEAD";
        if (levelDetails.level === 2) return "HR MANAGER";
        if (levelDetails.level === 3) return "HR DIRECTOR";
        if (levelDetails.level === 4) return "ADMIN";
      } 
      else if (requesterPosition === "TEAM_LEAD") {
        // TEAM_LEAD -> HR MANAGER -> HR DIRECTOR
        if (levelDetails.level === 1) return "HR MANAGER";
        if (levelDetails.level === 2) return "HR DIRECTOR";
        if (levelDetails.level === 3) return "ADMIN";
      }
      else if (requesterPosition === "HR MANAGER") {
        // HR MANAGER -> HR DIRECTOR
        if (levelDetails.level === 1) return "HR DIRECTOR";
        if (levelDetails.level === 2) return "ADMIN";
      }
      else if (requesterPosition === "HR DIRECTOR") {
        // HR DIRECTOR -> ADMIN
        if (levelDetails.level === 1) return "ADMIN";
      }
    }
    
    // Fallback to the original implementation for backward compatibility
    if (levelDetails.approverType) {
      switch (levelDetails.approverType) {
        case "teamLead":
          return "Team Lead";
        case "manager":
          return "Manager";
        case "departmentHead":
          return "Department Head";
        case "hr":
          return "HR";
        case "superAdmin":
          return "Super Admin";
        default:
          return levelDetails.approverType;
      }
    } else if (levelDetails.roles && levelDetails.roles.length > 0) {
      return levelDetails.roles.map((role: string) => {
        switch (role) {
          case "team_lead":
            return "Team Lead";
          case "manager":
            return "Manager";
          case "hr":
            return "HR";
          case "super_admin":
            return "Super Admin";
          default:
            return role;
        }
      }).join(" or ");
    } else if (levelDetails.positionId) {
      return "Position Specific";
    }
    
    return "Unknown";
  };

  // Render approval workflow modal
  const renderApprovalWorkflowModal = () => {
    if (!selectedLeaveRequest) return null;
    
    const metadata = selectedLeaveRequest.metadata || {};
    const approvalHistory = metadata.approvalHistory || [];
    const currentLevel = metadata.currentApprovalLevel || 0;
    
    // Get the requester's position
    const requesterPosition = selectedLeaveRequest.user?.position || "";
    
    // Determine required levels based on the hardcoded workflow
    let requiredLevels: number[] = [];
    
    // Get the number of days for the leave request
    const numberOfDays = selectedLeaveRequest.numberOfDays || 0;
    
    // Determine the category based on the number of days
    let category = "";
    if (numberOfDays >= 0.5 && numberOfDays <= 2) {
      category = "Short Leave";
    } else if (numberOfDays >= 3 && numberOfDays <= 6) {
      category = "Medium Leave";
    } else if (numberOfDays >= 7 && numberOfDays <= 30) {
      category = "Long Leave";
    }
    
    console.log(`Leave request is for ${numberOfDays} days, category: ${category}`);
    
    // Use hardcoded workflow based on position and category
    if (requesterPosition === "INTERN") {
      // INTERN always requires all 4 levels regardless of category
      // INTERN -> TEAM_LEAD -> HR MANAGER -> HR DIRECTOR
      requiredLevels = [1, 2, 3, 4];
      console.log("HARDCODED WORKFLOW for INTERN: Using levels", requiredLevels);
    } 
    else if (requesterPosition === "TEAM_LEAD") {
      // For TEAM_LEAD, check the category
      if (category === "Short Leave") {
        // For short leaves, only need 2 levels (override category)
        requiredLevels = [1, 2];
      } else if (category === "Medium Leave") {
        // For medium leaves, need 3 levels
        requiredLevels = [1, 2, 3];
      } else {
        // For long leaves, need all levels
        requiredLevels = [1, 2, 3];
      }
      console.log(`HARDCODED WORKFLOW for TEAM_LEAD (${category}): Using levels`, requiredLevels);
    }
    else if (requesterPosition === "HR MANAGER") {
      // HR MANAGER -> HR DIRECTOR
      requiredLevels = [1];
      console.log("HARDCODED WORKFLOW for HR MANAGER: Using levels", requiredLevels);
    }
    else if (requesterPosition === "HR DIRECTOR") {
      // HR DIRECTOR -> ADMIN
      requiredLevels = [1];
      console.log("HARDCODED WORKFLOW for HR DIRECTOR: Using levels", requiredLevels);
    }
    else {
      // Fallback to metadata if position doesn't match any hardcoded workflow
      requiredLevels = metadata.requiredApprovalLevels || [];
      console.log("Using default workflow levels from metadata:", requiredLevels);
    }
    
    return (
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title="Approval Workflow Status"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">
              {selectedLeaveRequest.user?.firstName} {selectedLeaveRequest.user?.lastName} - {selectedLeaveRequest.leaveType?.name}
            </h3>
            {renderStatusBadge(selectedLeaveRequest.status, metadata)}
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Request Date: {formatDate(selectedLeaveRequest.createdAt)}</p>
            <p>Leave Period: {formatDate(selectedLeaveRequest.startDate)} - {formatDate(selectedLeaveRequest.endDate)}</p>
            <p>Duration: {selectedLeaveRequest.numberOfDays} day(s)</p>
            {selectedLeaveRequest.reason && (
              <p>Reason: {selectedLeaveRequest.reason}</p>
            )}
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium mb-3">Approval Workflow</h4>
            
            {approvalHistory.length > 0 ? (
              <div className="space-y-3">
                {/* Completed approval levels */}
                {approvalHistory.map((approval: any, index: number) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-600 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">
                        Level {approval.level} - Approved by {approval.approverName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(approval.approvedAt)}
                        {metadata.workflowDetails && metadata.workflowDetails.approvalLevels && 
                          metadata.workflowDetails.approvalLevels.find((wf: any) => wf.level === approval.level) && (
                            <span className="ml-2 text-gray-500">
                              ({getApproverPositionName(metadata.workflowDetails.approvalLevels.find((wf: any) => wf.level === approval.level))})
                            </span>
                        )}
                      </p>
                      {approval.comments && (
                        <p className="text-sm mt-1 italic">"{approval.comments}"</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Pending approval levels */}
                {selectedLeaveRequest.status === "partially_approved" && (
                  <>
                    {/* Current pending approval level notification */}
                    {requiredLevels.length > 0 && requiredLevels[0] > currentLevel && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                              <span className="font-medium">Currently awaiting approval from:</span> {' '}
                              {metadata.workflowDetails && metadata.workflowDetails.approvalLevels && 
                                metadata.workflowDetails.approvalLevels.find((wf: any) => wf.level === currentLevel + 1) ? (
                                <span className="font-bold">
                                  {getApproverPositionName(metadata.workflowDetails.approvalLevels.find((wf: any) => wf.level === currentLevel + 1))}
                                </span>
                              ) : (
                                'Next level approver'
                              )}
                              {canApproveRequest(selectedLeaveRequest) && 
                                <span className="ml-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">You can approve this</span>
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {requiredLevels
                      .filter((level: number) => level > currentLevel)
                      .map((level: number, index: number) => (
                        <div key={`pending-${level}`} className="flex items-start">
                          <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${index === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-500'} mr-3`}>
                            {index === 0 ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <span>{index + 1}</span>
                            )}
                          </div>
                          <div>
                            <p className={`font-medium ${index === 0 ? 'text-yellow-700' : 'text-gray-600'}`}>
                              Level {level} - Pending Approval
                              {index === 0 && <span className="ml-2 text-yellow-600 text-xs font-bold">(CURRENT)</span>}
                            </p>
                            {metadata.workflowDetails && metadata.workflowDetails.approvalLevels && 
                              metadata.workflowDetails.approvalLevels.find((wf: any) => wf.level === level) && (
                                <p className="text-sm text-gray-500">
                                  {getApproverPositionName(metadata.workflowDetails.approvalLevels.find((wf: any) => wf.level === level))}
                                  {metadata.workflowDetails.approvalLevels.find((wf: any) => wf.level === level).departmentName && 
                                    ` (${metadata.workflowDetails.approvalLevels.find((wf: any) => wf.level === level).departmentName})`}
                                </p>
                            )}
                          </div>
                        </div>
                      ))
                    }
                  </>
                )}
              </div>
            ) : (
              <div className="py-4 text-gray-500">
                {selectedLeaveRequest.status === "pending" ? (
                  <>
                    {/* Always show information about the approval process */}
                    <div className="space-y-3">
                      {/* If we have workflow details, show them */}
                      {metadata.workflowDetails && metadata.workflowDetails.approvalLevels && metadata.workflowDetails.approvalLevels.length > 0 ? (
                        <>
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                  <span className="font-medium">Currently awaiting approval from:</span> {' '}
                                  <span className="font-bold">
                                    {metadata.workflowDetails.approvalLevels[0] ? 
                                      getApproverPositionName(metadata.workflowDetails.approvalLevels[0]) : 
                                      "Approver"}
                                  </span>
                                  {/* Always show approval option for managers */}
                                  {(canApproveRequest(selectedLeaveRequest) || isManager) && 
                                    <span className="ml-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">You can approve this</span>
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <p className="font-medium">This request requires {metadata.workflowDetails.approvalLevels.length} level(s) of approval:</p>
                          
                          {metadata.workflowDetails.approvalLevels.map((level: any, index: number) => (
                            <div key={`pending-level-${index}`} className="flex items-start">
                              <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${index === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-500'} mr-3`}>
                                {index === 0 ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <span>{index + 1}</span>
                                )}
                              </div>
                              <div>
                                <p className={`font-medium ${index === 0 ? 'text-yellow-700' : 'text-gray-600'}`}>
                                  Level {level.level || index + 1} - {level.isRequired !== false ? "Required" : "Optional"} Approval
                                  {index === 0 && <span className="ml-2 text-yellow-600 text-xs font-bold">(CURRENT)</span>}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {getApproverPositionName(level)}
                                  {level.departmentName && ` (${level.departmentName})`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <>
                          {/* If we have requiredApprovalLevels but no workflow details */}
                          {metadata.requiredApprovalLevels && metadata.requiredApprovalLevels.length > 0 ? (
                            <>
                              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                      <span className="font-medium">
                                        Currently awaiting approval from: {' '}
                                        {/* Use the hardcoded workflow to determine the current approver */}
                                        <strong>
                                          {requesterPosition === "INTERN" && "TEAM_LEAD"}
                                          {requesterPosition === "TEAM_LEAD" && "HR MANAGER"}
                                          {requesterPosition === "HR MANAGER" && "HR DIRECTOR"}
                                          {requesterPosition === "HR DIRECTOR" && "ADMIN"}
                                          {!["INTERN", "TEAM_LEAD", "HR MANAGER", "HR DIRECTOR"].includes(requesterPosition) && 
                                            `Level 1 Approver (${metadata.requiredApprovalLevels.length} levels required)`}
                                        </strong>
                                      </span>
                                      {/* Always show approval option for managers */}
                                      {(canApproveRequest(selectedLeaveRequest) || isManager) && 
                                        <span className="ml-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">You can approve this</span>
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Display the hardcoded workflow steps */}
                              <p className="font-medium">Approval workflow for {requesterPosition}:</p>
                              <div className="mt-2 space-y-2">
                                {requiredLevels.map((level: number, index: number) => {
                                  // Determine the approver position based on the requester's position and level
                                  let approverPosition = "Unknown";
                                  
                                  if (requesterPosition === "INTERN") {
                                    // INTERN -> TEAM_LEAD -> HR MANAGER -> HR DIRECTOR -> ADMIN
                                    if (level === 1) approverPosition = "TEAM_LEAD";
                                    else if (level === 2) approverPosition = "HR MANAGER";
                                    else if (level === 3) approverPosition = "HR DIRECTOR";
                                    else if (level === 4) approverPosition = "ADMIN";
                                  } 
                                  else if (requesterPosition === "TEAM_LEAD") {
                                    // For TEAM_LEAD, check the category
                                    if (category === "Short Leave") {
                                      // TEAM_LEAD -> HR MANAGER -> HR DIRECTOR
                                      if (level === 1) approverPosition = "HR MANAGER";
                                      else if (level === 2) approverPosition = "HR DIRECTOR";
                                    } else {
                                      // TEAM_LEAD -> HR MANAGER -> HR DIRECTOR -> ADMIN
                                      if (level === 1) approverPosition = "HR MANAGER";
                                      else if (level === 2) approverPosition = "HR DIRECTOR";
                                      else if (level === 3) approverPosition = "ADMIN";
                                    }
                                  }
                                  else if (requesterPosition === "HR MANAGER") {
                                    // HR MANAGER -> HR DIRECTOR
                                    if (level === 1) approverPosition = "HR DIRECTOR";
                                  }
                                  else if (requesterPosition === "HR DIRECTOR") {
                                    // HR DIRECTOR -> ADMIN
                                    if (level === 1) approverPosition = "ADMIN";
                                  }
                                  
                                  return (
                                    <div key={`level-${level}`} className="flex items-center">
                                      <div className={`w-8 h-8 flex items-center justify-center rounded-full ${index === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-500'} mr-3`}>
                                        {level}
                                      </div>
                                      <div>
                                        <p className="font-medium">{approverPosition}</p>
                                        {index === 0 && <span className="text-yellow-600 text-xs font-bold">(CURRENT)</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                      <span className="font-medium">
                                        {canApproveRequest(selectedLeaveRequest) ? (
                                          <>
                                            {isTeamLead && "This request is awaiting your approval as Team Lead."}
                                            {isManager && "This request is awaiting your approval as Manager."}
                                            {isHR && "This request is awaiting your approval as HR."}
                                            {!isTeamLead && !isManager && !isHR && "This request is awaiting your approval."}
                                          </>
                                        ) : (
                                          <>
                                            {selectedLeaveRequest.user?.teamLeadId && isTeamLead ? 
                                              "This request is awaiting approval from you as Team Lead." :
                                            selectedLeaveRequest.user?.managerId && isManager ? 
                                              "This request is awaiting approval from you as Manager." :
                                            selectedLeaveRequest.user?.hrId && isHR ? 
                                              "This request is awaiting approval from you as HR." :
                                              "This request is awaiting approval from the appropriate manager."}
                                          </>
                                        )}
                                      </span>
                                      {canApproveRequest(selectedLeaveRequest) && 
                                        <span className="ml-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">You can approve this</span>
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </>
                ) : selectedLeaveRequest.status === "approved" ? (
                  <p>This request was approved without a multi-level workflow.</p>
                ) : selectedLeaveRequest.status === "rejected" ? (
                  <p>This request was rejected.</p>
                ) : (
                  <p>No approval workflow information available.</p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-4">
            <Button 
              variant="secondary" 
              onClick={() => setIsApprovalModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Team Leave Requests
        </h1>
        <Badge variant="primary" className="text-sm">
          Approval Level: {getApprovalLevel()}
        </Badge>
      </div>
      
      {renderApprovalWorkflowModal()}

      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          className="mb-6"
        />
      )}

      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          className="mb-6"
        />
      )}

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-auto">
            <label
              htmlFor="year"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Year
            </label>
            <select
              id="year"
              className="form-input"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status"
              className="form-input"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending Approval</option>
              <option value="partially_approved">Partially Approved</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending_deletion">Pending Deletion</option>
            </select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {data?.leaveRequests && data.leaveRequests.length > 0 ? (
            data.leaveRequests.map((request: LeaveRequest) => (
              <Card 
                key={request.id} 
                className={request.status === "partially_approved" ? "border-l-4 border-l-blue-500" : ""}
              >
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {request.user?.firstName} {request.user?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Leave Type:</span>{" "}
                      {request.leaveType?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Duration:</span>{" "}
                      {formatDate(request.startDate)} -{" "}
                      {formatDate(request.endDate)} ({request.numberOfDays}{" "}
                      day(s))
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Type:</span>{" "}
                      {request.requestType.replace("_", " ")}
                    </p>
                    {request.reason && (
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Reason:</span>{" "}
                        {request.reason}
                      </p>
                    )}
                    
                    {request.status === "partially_approved" && request.metadata && (
                      <p className={`text-sm mt-1 ${canApproveRequest(request) ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                        {canApproveRequest(request) 
                          ? `This request needs your approval as L${request.metadata.currentApprovalLevel + 1}`
                          : `This request needs L${request.metadata.currentApprovalLevel + 1} approval`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {renderStatusBadge(request.status, request.metadata)}

                    <div className="flex space-x-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleViewApprovalWorkflow(request)}
                      >
                        View Status
                      </Button>
                      
                      {/* Modified to allow managers to approve any request */}
                      {(((request.status === "pending" || request.status === "partially_approved") && (canApproveRequest(request) || isManager)) || request.status === "pending_deletion") && (
                        <>
                          {actionLeaveId !== request.id ? (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => setActionLeaveId(request.id)}
                            >
                              {request.status === "pending_deletion" 
                                ? "Review Deletion" 
                                : request.status === "partially_approved" 
                                  ? `Approve/Reject as L${request.metadata?.currentApprovalLevel + 1}` 
                                  : `Approve/Reject as L${getApprovalLevel()}`}
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setActionLeaveId(null);
                                setComments("");
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {actionLeaveId === request.id && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <Textarea
                      label="Comments (optional)"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add comments for the employee"
                      rows={2}
                    />
                    <div className="mt-4 flex justify-end space-x-2">
                      {request.status === "pending_deletion" ? (
                        <>
                          <Button
                            variant="danger"
                            size="sm"
                            isLoading={isRejectingDeletion}
                            onClick={() => handleRejectDeleteRequest(request.id)}
                          >
                            Reject Deletion
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            isLoading={isApprovingDeletion}
                            onClick={() => handleApproveDeleteRequest(request.id)}
                          >
                            Approve Deletion
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="danger"
                            size="sm"
                            isLoading={isRejecting}
                            onClick={() => handleUpdateStatus(request.id, "rejected")}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            isLoading={isApproving}
                            onClick={() => handleUpdateStatus(request.id, "approved")}
                          >
                            Approve
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-center text-gray-500 py-8">
                No leave requests found for the selected filters.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamLeavesPage;
