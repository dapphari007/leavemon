import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { getPositionById, updatePosition, Position } from "../../services/positionService";
import { getAllDepartments, Department } from "../../services/departmentService";

interface FormData {
  name: string;
  description: string;
  departmentId: string;
  level: number;
  isActive: boolean;
}

const EditPositionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [position, setPosition] = useState<Position | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  // Fetch position data
  useEffect(() => {
    const fetchPosition = async () => {
      if (!id) return;
      
      try {
        const positionData = await getPositionById(id);
        
        if (!positionData) {
          setError("Position not found or data is empty");
          setIsFetching(false);
          return;
        }
        
        setPosition(positionData);
        
        // Set form values
        reset({
          name: positionData.name,
          description: positionData.description || "",
          departmentId: positionData.departmentId || "",
          level: positionData.level || 1,
          isActive: positionData.isActive,
        });
        
        console.log("Position data loaded successfully:", positionData);
      } catch (err: any) {
        console.error("Error fetching position:", err);
        // Provide more detailed error message
        setError(
          err.response?.data?.message || 
          err.message || 
          "Failed to load position data. Please try again."
        );
      } finally {
        setIsFetching(false);
      }
    };

    fetchPosition();
  }, [id, reset]);

  // Fetch departments for dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentsData = await getAllDepartments();
        setDepartments(departmentsData);
      } catch (err) {
        console.error("Error fetching departments:", err);
        setError("Failed to load departments");
      }
    };

    fetchDepartments();
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Log the data being sent to the API for debugging
      const updateData = {
        name: data.name,
        description: data.description,
        departmentId: data.departmentId === "" ? undefined : data.departmentId,
        level: data.level,
        isActive: data.isActive,
      };
      
      console.log("Updating position with data:", updateData);
      
      await updatePosition(id, updateData);
      
      console.log("Position updated successfully");
      navigate("/positions");
    } catch (err: any) {
      console.error("Error updating position:", err);
      // Provide more detailed error message
      setError(
        err.response?.data?.message || 
        err.message || 
        "Failed to update position. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!position && !isFetching) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-red-600">Position not found</h2>
        <p className="mt-2 text-gray-600">The position you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button 
          variant="primary" 
          className="mt-4"
          onClick={() => navigate("/positions")}
        >
          Back to Positions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Position</h1>
        <Button variant="outline" onClick={() => navigate("/positions")}>
          Back to Positions
        </Button>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Position Name *
              </label>
              <input
                id="name"
                type="text"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.name ? "border-red-500" : ""
                }`}
                {...register("name", { required: "Position name is required" })}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <select
                id="departmentId"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                {...register("departmentId")}
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                Position Level
              </label>
              <select
                id="level"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                {...register("level", { valueAsNumber: true })}
              >
                <option value={1}>Entry Level</option>
                <option value={2}>Senior/Specialist</option>
                <option value={3}>Manager</option>
                <option value={4}>Director</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="isActive"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                {...register("isActive", { 
                  setValueAs: (value) => value === "true" || value === true 
                })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                {...register("description")}
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/positions")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Updating...
                </>
              ) : (
                "Update Position"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditPositionPage;