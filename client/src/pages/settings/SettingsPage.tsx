import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { 
  FaSun, 
  FaMoon, 
  FaDesktop, 
  FaUserCog, 
  FaShieldAlt, 
  FaBell, 
  FaSignOutAlt 
} from "react-icons/fa";

const SettingsPage: React.FC = () => {
  const { mode, setMode } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <Card title="Appearance">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Theme</h3>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setMode("light")}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                  mode === "light"
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <FaSun className="h-6 w-6 text-yellow-500 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Light</span>
              </button>

              <button
                onClick={() => setMode("dark")}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                  mode === "dark"
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <FaMoon className="h-6 w-6 text-indigo-500 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Dark</span>
              </button>

              <button
                onClick={() => setMode("system")}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                  mode === "system"
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <FaDesktop className="h-6 w-6 text-gray-500 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">System</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Account Settings */}
        <Card title="Account">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <FaUserCog className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">Profile Settings</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Update your personal information</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/profile")}
              >
                Edit Profile
              </Button>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <FaShieldAlt className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">Security</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your password and security settings</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/security")}
              >
                Manage
              </Button>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <FaBell className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">Notifications</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Configure how you receive notifications</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/notifications")}
              >
                Configure
              </Button>
            </div>
          </div>
        </Card>

        {/* Logout */}
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaSignOutAlt className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">Sign Out</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Log out of your account</p>
                </div>
              </div>
              <Button
                variant="danger"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;