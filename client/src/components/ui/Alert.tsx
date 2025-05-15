import React from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface AlertProps {
  variant?: "success" | "warning" | "error" | "info";
  type?: "success" | "warning" | "error" | "info"; // For backward compatibility
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  variant = "info",
  type,
  title,
  message,
  onClose,
  className = "",
}) => {
  // Use type prop if variant is not provided (for backward compatibility)
  const actualVariant = type || variant;
  const variantClasses = {
    success: "bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200",
    warning: "bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
    error: "bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200",
    info: "bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  };

  const variantIcons = {
    success: (
      <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
    ),
    warning: (
      <ExclamationTriangleIcon
        className="h-5 w-5 text-yellow-400"
        aria-hidden="true"
      />
    ),
    error: <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />,
    info: (
      <InformationCircleIcon
        className="h-5 w-5 text-blue-400"
        aria-hidden="true"
      />
    ),
  };

  return (
    <div className={`rounded-md p-4 ${variantClasses[actualVariant]} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">{variantIcons[actualVariant]}</div>
        <div className="ml-3">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          <div className="text-sm">
            <p>{message}</p>
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${
                    actualVariant === "success"
                      ? "bg-green-50 dark:bg-green-900 text-green-500 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800 focus:ring-green-600 focus:ring-offset-green-50 dark:focus:ring-offset-green-900"
                      : ""
                  }
                  ${
                    actualVariant === "warning"
                      ? "bg-yellow-50 dark:bg-yellow-900 text-yellow-500 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-800 focus:ring-yellow-600 focus:ring-offset-yellow-50 dark:focus:ring-offset-yellow-900"
                      : ""
                  }
                  ${
                    actualVariant === "error"
                      ? "bg-red-50 dark:bg-red-900 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 focus:ring-red-600 focus:ring-offset-red-50 dark:focus:ring-offset-red-900"
                      : ""
                  }
                  ${
                    actualVariant === "info"
                      ? "bg-blue-50 dark:bg-blue-900 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 focus:ring-blue-600 focus:ring-offset-blue-50 dark:focus:ring-offset-blue-900"
                      : ""
                  }
                `}
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
