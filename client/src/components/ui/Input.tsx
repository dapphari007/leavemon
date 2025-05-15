import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, className = '', ...props }, ref) => {
    const inputClasses = `
      block rounded-md border 
      ${error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} 
      px-3 py-2 
      text-gray-900
      placeholder-gray-400
      bg-white
      focus:border-primary-500 dark:focus:border-primary-400 
      focus:outline-none focus:ring-1 
      focus:ring-primary-500 dark:focus:ring-primary-400
      disabled:cursor-not-allowed 
      disabled:bg-gray-50
      disabled:text-gray-500
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <input ref={ref} className={inputClasses} {...props} />
        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;