import React from 'react';

const StatsCard = ({ title, value, icon, color, subtitle, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="ml-4 space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            {subtitle && (
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;