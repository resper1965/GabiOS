import { type InputHTMLAttributes, type LabelHTMLAttributes, forwardRef } from "react";

// ─── Label ────────────────────────────────────────────────
interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ required, className = "", children, ...props }: LabelProps) {
  return (
    <label className={`block text-sm font-medium text-surface-700 mb-1.5 ${className}`} {...props}>
      {children}
      {required && <span className="text-danger-500 ml-0.5">*</span>}
    </label>
  );
}

// ─── Input ────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, helperText, className = "", id, required, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          className={`
            w-full px-3.5 py-2.5 text-sm
            bg-white border rounded-lg
            transition-colors duration-150
            placeholder:text-surface-400
            focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
            disabled:bg-surface-100 disabled:cursor-not-allowed
            ${error
              ? "border-danger-500 focus:ring-danger-500/30 focus:border-danger-500"
              : "border-surface-300 hover:border-surface-400"
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-danger-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-surface-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// ─── Textarea ─────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, label, className = "", id, required, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          required={required}
          className={`
            w-full px-3.5 py-2.5 text-sm
            bg-white border rounded-lg
            transition-colors duration-150 resize-y min-h-[80px]
            placeholder:text-surface-400
            focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
            disabled:bg-surface-100 disabled:cursor-not-allowed
            ${error
              ? "border-danger-500 focus:ring-danger-500/30 focus:border-danger-500"
              : "border-surface-300 hover:border-surface-400"
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-danger-500">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
