import React from 'react';

const Skeleton = ({ className = '', ...props }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    {...props}
  />
);

export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        className={`h-4 ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="table">
        <thead className="table-header">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="table-header-cell">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table-body">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="table-row">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="table-cell">
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const SkeletonStats = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="ml-5 w-0 flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonChart = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
    <Skeleton className="h-6 w-32 mb-4" />
    <Skeleton className="h-64 w-full" />
  </div>
);

export const SkeletonForm = ({ fields = 4 }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <Skeleton className="h-6 w-32 mb-6" />
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
    <div className="flex justify-end mt-6">
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

export const SkeletonModal = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div className="px-6 py-4 border-b border-gray-200">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="px-6 py-4">
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex space-x-3 mt-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonList = ({ items = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonDashboard = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="bg-white rounded-lg shadow-sm p-6">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
    </div>

    {/* Stats */}
    <SkeletonStats />

    {/* Content */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <SkeletonList items={3} />
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <SkeletonList items={3} />
      </div>
    </div>
  </div>
);

export default Skeleton; 