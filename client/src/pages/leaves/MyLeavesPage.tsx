import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyLeaveRequests, cancelLeaveRequest, deleteLeaveRequest } from '../../services/leaveRequestService';
import { LeaveRequest } from '../../types';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { formatDate } from '../../utils/dateUtils';
import { getErrorMessage } from '../../utils/errorUtils';
import Modal from '../../components/ui/Modal';

const MyLeavesPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);

  // Fetch leave requests
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['myLeaveRequests', selectedYear, selectedStatus],
    queryFn: () => getMyLeaveRequests({
      year: selectedYear,
      status: selectedStatus !== 'all' ? selectedStatus as any : undefined,
    }),
    onError: (err: any) => setError(getErrorMessage(err)),
  });

  // Handle cancel leave request
  const handleCancelRequest = async (id: string) => {
    try {
      await cancelLeaveRequest(id);
      setSuccessMessage('Leave request cancelled successfully');
      refetch();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
  
  // Handle delete leave request
  const handleDeleteRequest = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this leave request? If it was approved, you will need to go through the approval process again for a new request.')) {
      try {
        await deleteLeaveRequest(id);
        setSuccessMessage('Leave request deleted successfully. If it was approved, the leave balance has been restored.');
        refetch();
      } catch (err) {
        setError(getErrorMessage(err));
      }
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
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="default">Cancelled</Badge>;
      case 'partially_approved':
        return <Badge variant="warning">Partially Approved</Badge>;
      case 'pending_deletion':
        return <Badge variant="warning">Pending Deletion Approval</Badge>;
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
    const requiredLevels = metadata.requiredApprovalLevels || [];
    
    return (
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title="Approval Workflow Status"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{selectedLeaveRequest.leaveType?.name}</h3>
            {renderStatusBadge(selectedLeaveRequest.status, metadata)}
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Request Date: {formatDate(selectedLeaveRequest.createdAt)}</p>
            <p>Leave Period: {formatDate(selectedLeaveRequest.startDate)} - {formatDate(selectedLeaveRequest.endDate)}</p>
            <p>Duration: {selectedLeaveRequest.numberOfDays} day(s)</p>
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
                                  <span className="font-bold">{getApproverPositionName(metadata.workflowDetails.approvalLevels[0])}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <p className="font-medium">Your request requires {metadata.workflowDetails.approvalLevels.length} level(s) of approval:</p>
                          
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
                                      <span className="font-medium">Your request requires {metadata.requiredApprovalLevels.length} level(s) of approval</span>
                                    </p>
                                  </div>
                                </div>
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
                                        {selectedLeaveRequest.numberOfDays <= 2 ? (
                                          // For requests of 2 days or less
                                          selectedLeaveRequest.user?.teamLeadId ? 
                                            "Your request is awaiting approval from your Team Lead." :
                                          selectedLeaveRequest.user?.managerId ? 
                                            "Your request is awaiting approval from your Manager." :
                                          selectedLeaveRequest.user?.hrId ? 
                                            "Your request is awaiting approval from HR." :
                                            "Your request is awaiting approval from the appropriate manager."
                                        ) : (
                                          // For requests of more than 2 days (multi-level approval)
                                          "Your request requires multi-level approval. " + 
                                          (selectedLeaveRequest.user?.teamLeadId ? 
                                            "It is currently awaiting approval from your Team Lead." :
                                          selectedLeaveRequest.user?.managerId ? 
                                            "It is currently awaiting approval from your Manager." :
                                          selectedLeaveRequest.user?.hrId ? 
                                            "It is currently awaiting approval from HR." :
                                            "It is currently awaiting approval from the appropriate manager.")
                                        )}
                                      </span>
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
                  <p>Your request was approved without a multi-level workflow.</p>
                ) : selectedLeaveRequest.status === "rejected" ? (
                  <p>Your request was rejected.</p>
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
        <h1 className="text-2xl font-semibold text-gray-900">My Leave Requests</h1>
        <Link to="/apply-leave">
          <Button>Apply for Leave</Button>
        </Link>
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
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
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
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              className="form-input"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
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
              <Card key={request.id}>
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {request.leaveType?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium">Duration:</span> {request.numberOfDays} day(s)
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium">Type:</span> {request.requestType.replace('_', ' ')}
                    </p>
                    {request.reason && (
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">Reason:</span> {request.reason}
                      </p>
                    )}
                    {request.approverComments && (
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">Comments:</span> {request.approverComments}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {renderStatusBadge(request.status, request.metadata)}
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleViewApprovalWorkflow(request)}
                      >
                        View Status
                      </Button>
                      {request.status === 'pending' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancelRequest(request.id)}
                        >
                          Cancel Request
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteRequest(request.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
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

export default MyLeavesPage;