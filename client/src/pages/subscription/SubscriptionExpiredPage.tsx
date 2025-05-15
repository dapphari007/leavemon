import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import { FaLock, FaCreditCard, FaArrowRight } from "react-icons/fa";

const SubscriptionExpiredPage: React.FC = () => {
  const { subscriptionExpiryDate } = useAuth();
  
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <FaLock className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Access Expired
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Your single-day access period has ended on {formatDate(subscriptionExpiryDate)}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Subscribe to Continue
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                To continue using the Leave Management System, please subscribe to one of our plans.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaCreditCard className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    Professional Plan
                  </h4>
                  <p className="text-sm text-gray-500">
                    $19/month per user, billed annually
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Link to="/subscription">
                <Button fullWidth className="flex items-center justify-center">
                  Subscribe Now <FaArrowRight className="ml-2" />
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <Link
                to="/contact-sales"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Contact sales for enterprise plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpiredPage;