import React from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "../components/ui/Button";

const NotFoundPage: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-primary-600">404</h1>
        <h2 className="mt-4 text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
          Page not found
        </h2>
        <p className="mt-6 text-base text-gray-600 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for: <span className="font-medium text-gray-900">{location.pathname}</span>
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/">
            <Button size="lg">
              Go back home
            </Button>
          </Link>
          <Link to="/contact-sales">
            <Button variant="outline" size="lg">
              Contact support
            </Button>
          </Link>
        </div>
        
        <div className="mt-12">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact our support team.
          </p>
        </div>
      </div>
      
      <div className="mt-16 max-w-2xl">
        <h3 className="text-lg font-medium text-gray-900 mb-4">You might be looking for:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="font-medium text-primary-600">Home Page</div>
            <p className="text-sm text-gray-600">Return to our main landing page</p>
          </Link>
          <Link to="/login" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="font-medium text-primary-600">Login</div>
            <p className="text-sm text-gray-600">Sign in to your account</p>
          </Link>
          <Link to="/register" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="font-medium text-primary-600">Register</div>
            <p className="text-sm text-gray-600">Create a new account</p>
          </Link>
          <Link to="/dashboard" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="font-medium text-primary-600">Dashboard</div>
            <p className="text-sm text-gray-600">Access your dashboard</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;