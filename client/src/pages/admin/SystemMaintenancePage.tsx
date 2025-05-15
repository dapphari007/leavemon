import React, { useState } from "react";
import axios from "axios";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../utils/errorUtils";

const SystemMaintenancePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [results, setResults] = useState<{[key: string]: any}>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user is super admin
  const isSuperAdmin = user?.role === "super_admin";

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <Alert variant="danger">
          You do not have permission to access this page. This page is only accessible to super administrators.
        </Alert>
      </div>
    );
  }

  const runScript = async (scriptName: string, endpoint: string) => {
    setLoading(prev => ({ ...prev, [scriptName]: true }));
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await axios.post(`/api/scripts/${endpoint}`);
      
      setResults(prev => ({ 
        ...prev, 
        [scriptName]: response.data 
      }));
      
      setSuccessMessage(`${scriptName} completed successfully`);
    } catch (err) {
      setError(getErrorMessage(err));
      console.error(`Error running ${scriptName}:`, err);
    } finally {
      setLoading(prev => ({ ...prev, [scriptName]: false }));
    }
  };

  const clearResult = (scriptName: string) => {
    setResults(prev => {
      const newResults = { ...prev };
      delete newResults[scriptName];
      return newResults;
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">System Maintenance</h1>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert variant="success" className="mb-4">
          {successMessage}
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <h2 className="text-xl font-semibold">Fix All Relationships</h2>
          </Card.Header>
          <Card.Body>
            <p className="mb-4">
              This operation will fix all relationships between users, positions, departments, and approval workflows.
              It will ensure that all users have proper position assignments and department relationships.
            </p>
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => runScript("Fix All Relationships", "fix-all-relationships")}
                disabled={loading["Fix All Relationships"]}
              >
                {loading["Fix All Relationships"] ? "Running..." : "Run Fix"}
              </Button>
            </div>
            
            {results["Fix All Relationships"] && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Results:</h3>
                  <Button
                    variant="text"
                    size="sm"
                    onClick={() => clearResult("Fix All Relationships")}
                  >
                    Clear
                  </Button>
                </div>
                <pre className="text-xs overflow-auto max-h-60">
                  {JSON.stringify(results["Fix All Relationships"], null, 2)}
                </pre>
              </div>
            )}
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Header>
            <h2 className="text-xl font-semibold">Sync Positions</h2>
          </Card.Header>
          <Card.Body>
            <p className="mb-4">
              This operation will synchronize positions with departments and create default positions if needed.
            </p>
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => runScript("Sync Positions", "sync-positions")}
                disabled={loading["Sync Positions"]}
              >
                {loading["Sync Positions"] ? "Running..." : "Run Sync"}
              </Button>
            </div>
            
            {results["Sync Positions"] && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Results:</h3>
                  <Button
                    variant="text"
                    size="sm"
                    onClick={() => clearResult("Sync Positions")}
                  >
                    Clear
                  </Button>
                </div>
                <pre className="text-xs overflow-auto max-h-60">
                  {JSON.stringify(results["Sync Positions"], null, 2)}
                </pre>
              </div>
            )}
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Header>
            <h2 className="text-xl font-semibold">Fix User Positions</h2>
          </Card.Header>
          <Card.Body>
            <p className="mb-4">
              This operation will ensure all users have proper position and department assignments.
            </p>
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => runScript("Fix User Positions", "fix-user-positions")}
                disabled={loading["Fix User Positions"]}
              >
                {loading["Fix User Positions"] ? "Running..." : "Run Fix"}
              </Button>
            </div>
            
            {results["Fix User Positions"] && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Results:</h3>
                  <Button
                    variant="text"
                    size="sm"
                    onClick={() => clearResult("Fix User Positions")}
                  >
                    Clear
                  </Button>
                </div>
                <pre className="text-xs overflow-auto max-h-60">
                  {JSON.stringify(results["Fix User Positions"], null, 2)}
                </pre>
              </div>
            )}
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Header>
            <h2 className="text-xl font-semibold">Fix Department Hierarchies</h2>
          </Card.Header>
          <Card.Body>
            <p className="mb-4">
              This operation will validate and fix department hierarchies, ensuring all departments have proper manager assignments.
            </p>
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => runScript("Fix Department Hierarchies", "fix-department-hierarchies")}
                disabled={loading["Fix Department Hierarchies"]}
              >
                {loading["Fix Department Hierarchies"] ? "Running..." : "Run Fix"}
              </Button>
            </div>
            
            {results["Fix Department Hierarchies"] && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Results:</h3>
                  <Button
                    variant="text"
                    size="sm"
                    onClick={() => clearResult("Fix Department Hierarchies")}
                  >
                    Clear
                  </Button>
                </div>
                <pre className="text-xs overflow-auto max-h-60">
                  {JSON.stringify(results["Fix Department Hierarchies"], null, 2)}
                </pre>
              </div>
            )}
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Header>
            <h2 className="text-xl font-semibold">Fix Approval Workflows</h2>
          </Card.Header>
          <Card.Body>
            <p className="mb-4">
              This operation will validate and fix approval workflows, ensuring all workflows are properly configured.
            </p>
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => runScript("Fix Approval Workflows", "fix-approval-workflows")}
                disabled={loading["Fix Approval Workflows"]}
              >
                {loading["Fix Approval Workflows"] ? "Running..." : "Run Fix"}
              </Button>
            </div>
            
            {results["Fix Approval Workflows"] && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Results:</h3>
                  <Button
                    variant="text"
                    size="sm"
                    onClick={() => clearResult("Fix Approval Workflows")}
                  >
                    Clear
                  </Button>
                </div>
                <pre className="text-xs overflow-auto max-h-60">
                  {JSON.stringify(results["Fix Approval Workflows"], null, 2)}
                </pre>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default SystemMaintenancePage;