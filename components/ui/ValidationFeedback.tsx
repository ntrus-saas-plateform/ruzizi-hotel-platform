'use client';

interface ValidationFeedbackProps {
  error?: string;
  success?: string;
  className?: string;
}

export default function ValidationFeedback({ error, success, className = '' }: ValidationFeedbackProps) {
  if (!error && !success) return null;

  return (
    <div className={`mt-2 ${className}`}>
      {error && (
        <div className="flex items-center text-red-600 text-sm">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center text-green-600 text-sm">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}