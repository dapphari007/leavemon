import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Alert from "../../components/ui/Alert";
import { FaCheck, FaCreditCard } from "react-icons/fa";

const SubscriptionPage: React.FC = () => {
  const { user, subscriptionExpiryDate } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>("professional");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const formatDate = (date: Date | null) => {
    if (!date) return "Unknown";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set subscription expiry date to 1 year from now
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      localStorage.setItem("subscriptionExpiryDate", expiryDate.toISOString());
      
      setSuccess("Subscription successful! Your subscription is now active until " + formatDate(expiryDate));
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setError("Failed to process subscription. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Subscription Plans</h1>
      
      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          className="mb-6"
        />
      )}
      
      {success && (
        <Alert
          variant="success"
          message={success}
          onClose={() => setSuccess(null)}
          className="mb-6"
        />
      )}
      
      <div className="mb-6">
        <Card>
          <div className="p-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Current Subscription</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {subscriptionExpiryDate && new Date() < subscriptionExpiryDate ? (
                <>Your subscription is active until {formatDate(subscriptionExpiryDate)}.</>
              ) : (
                <>Your single-day access expires soon. Subscribe to continue using the system.</>
              )}
            </p>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Basic Plan */}
        <Card className={`border-2 ${selectedPlan === "basic" ? "border-primary-500" : "border-transparent"}`}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Basic Plan</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">$9<span className="text-lg font-normal text-gray-500 dark:text-gray-400">/user/month</span></p>
                <p className="text-sm text-gray-500 dark:text-gray-400">billed annually</p>
              </div>
              <div>
                <input
                  type="radio"
                  id="basic-plan"
                  name="subscription-plan"
                  checked={selectedPlan === "basic"}
                  onChange={() => setSelectedPlan("basic")}
                  className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded-full"
                />
              </div>
            </div>
            
            <ul className="space-y-3 mt-6">
              <li className="flex items-start">
                <FaCheck className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Up to 20 users</span>
              </li>
              <li className="flex items-start">
                <FaCheck className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Basic leave types</span>
              </li>
              <li className="flex items-start">
                <FaCheck className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Email notifications</span>
              </li>
              <li className="flex items-start">
                <FaCheck className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Standard reports</span>
              </li>
            </ul>
          </div>
        </Card>
        
        {/* Professional Plan */}
        <Card className={`border-2 ${selectedPlan === "professional" ? "border-primary-500" : "border-transparent"}`}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Professional Plan</h3>
                  <span className="ml-2 bg-primary-100 text-primary-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-primary-900 dark:text-primary-300">
                    Popular
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">$19<span className="text-lg font-normal text-gray-500 dark:text-gray-400">/user/month</span></p>
                <p className="text-sm text-gray-500 dark:text-gray-400">billed annually</p>
              </div>
              <div>
                <input
                  type="radio"
                  id="professional-plan"
                  name="subscription-plan"
                  checked={selectedPlan === "professional"}
                  onChange={() => setSelectedPlan("professional")}
                  className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded-full"
                />
              </div>
            </div>
            
            <ul className="space-y-3 mt-6">
              <li className="flex items-start">
                <FaCheck className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Unlimited users</span>
              </li>
              <li className="flex items-start">
                <FaCheck className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Custom leave types</span>
              </li>
              <li className="flex items-start">
                <FaCheck className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Advanced workflows</span>
              </li>
              <li className="flex items-start">
                <FaCheck className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Advanced reporting</span>
              </li>
              <li className="flex items-start">
                <FaCheck className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">API access</span>
              </li>
            </ul>
          </div>
        </Card>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Card Number
            </label>
            <div className="relative">
              <input
                type="text"
                id="card-number"
                placeholder="1234 5678 9012 3456"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <FaCreditCard className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                id="expiry"
                placeholder="MM/YY"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CVC
              </label>
              <input
                type="text"
                id="cvc"
                placeholder="123"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button
          onClick={handleSubscribe}
          isLoading={isProcessing}
          className="px-8"
        >
          Subscribe Now
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionPage;