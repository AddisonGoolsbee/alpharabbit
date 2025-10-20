import React from "react";

type LoaderProps = {
  loading: boolean;
  empty?: boolean;
  className?: string;
  loadingText?: string;
  emptyText?: string;
};

export default function Loader({
  loading,
  empty = false,
  className = "",
  emptyText = "No data found.",
}: LoaderProps): React.ReactElement | null {
  if (loading) {
    return (
      <div className={className + " p-8 flex items-center justify-center"}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="animate-spin rounded-full border-4 border-gray-300 border-t-transparent h-10 w-10"
            role="status"
          >
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && empty) {
    return (
      <div className={className + " p-8 text-center text-gray-400"}>
        {emptyText}
      </div>
    );
  }

  return null;
}
