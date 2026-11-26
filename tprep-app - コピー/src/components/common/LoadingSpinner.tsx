import React from "react";

export const LoadingSpinner: React.FC<{ message?: string }> = ({
  message = "読み込み中...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
};
