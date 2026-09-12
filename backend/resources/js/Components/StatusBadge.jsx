const statusConfig = {
    // Campaign statuses
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
    scheduled: { label: 'Scheduled', color: 'bg-yellow-100 text-yellow-700' },
    running: { label: 'Running', color: 'bg-green-100 text-green-700' },
    paused: { label: 'Paused', color: 'bg-purple-100 text-purple-700' },
    completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700' },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-700' },
    cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700' },
    // User statuses
    active: { label: 'Active', color: 'bg-green-100 text-green-700' },
    suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700' },
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
    // Sender/domain statuses
    verified: { label: 'Verified', color: 'bg-green-100 text-green-700' },
    unverified: { label: 'Unverified', color: 'bg-yellow-100 text-yellow-700' },
    banned: { label: 'Banned', color: 'bg-red-100 text-red-700' },
    // Default
    default: { label: 'Unknown', color: 'bg-gray-100 text-gray-700' },
};

export default function StatusBadge({ status, label }) {
    const config = statusConfig[status] || statusConfig.default;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
            {label || config.label}
        </span>
    );
}
