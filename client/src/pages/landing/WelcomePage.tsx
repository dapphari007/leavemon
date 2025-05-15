import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import { 
  FaCheckCircle, 
  FaArrowRight, 
  FaUserCog, 
  FaCalendarAlt, 
  FaUserFriends, 
  FaChartBar 
} from "react-icons/fa";

const WelcomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">LMS</span>
              </div>
              <h1 className="ml-3 text-2xl font-bold text-gray-900">Leave Management System</h1>
            </div>
            <div>
              <Link to="/">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-primary-600 px-6 py-8 text-white">
            <div className="flex items-center">
              <div className="bg-white rounded-full p-2 mr-4">
                <FaCheckCircle className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Welcome to Leave Management System!</h2>
                <p className="mt-1 text-primary-100">
                  Your account has been successfully created. Let's get you started.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Hello, {user?.firstName || "there"}!
              </h3>
              <p className="text-gray-600">
                Thank you for signing up. We're excited to help you manage your leave requests and team availability more efficiently. 
                Here's what you can do next:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Getting Started Card */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaUserCog className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">Complete Your Profile</h4>
                    <p className="mt-2 text-gray-600">
                      Update your personal information and preferences to get the most out of the system.
                    </p>
                    <div className="mt-4">
                      <Link to="/profile" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                        Go to Profile <FaArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Apply Leave Card */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaCalendarAlt className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">Apply for Leave</h4>
                    <p className="mt-2 text-gray-600">
                      Submit your first leave request and track its approval status.
                    </p>
                    <div className="mt-4">
                      <Link to="/apply-leave" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                        Apply Now <FaArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Team Card */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaUserFriends className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">View Team Calendar</h4>
                    <p className="mt-2 text-gray-600">
                      Check your team's availability and plan your leaves accordingly.
                    </p>
                    <div className="mt-4">
                      <Link to="/leave-calendar" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                        View Calendar <FaArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard Card */}
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaChartBar className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">Explore Your Dashboard</h4>
                    <p className="mt-2 text-gray-600">
                      Get an overview of your leave balances, pending requests, and upcoming holidays.
                    </p>
                    <div className="mt-4">
                      <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                        Go to Dashboard <FaArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Your Subscription Plan</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-600 font-semibold">Single Day Access</p>
                  <p className="text-sm text-gray-600 mt-1">Your access expires in 24 hours</p>
                </div>
                <Link to="/subscription">
                  <Button variant="primary" size="sm">
                    Subscribe Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Need Help?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                <h4 className="font-medium text-gray-900 mb-2">Documentation</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Explore our comprehensive guides and tutorials
                </p>
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                  View Docs
                </a>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                <h4 className="font-medium text-gray-900 mb-2">Video Tutorials</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Watch step-by-step video guides
                </p>
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                  Watch Videos
                </a>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                <h4 className="font-medium text-gray-900 mb-2">Support</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Contact our support team for assistance
                </p>
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                  Get Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Leave Management System. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-gray-700">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700">
                Terms of Service
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;