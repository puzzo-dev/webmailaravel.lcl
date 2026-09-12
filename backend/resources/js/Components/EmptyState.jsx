import { HiInbox } from 'react-icons/hi';

export default function EmptyState({ icon: Icon = HiInbox, title, description, action }) {
    return (
        <div className="text-center py-12">
            <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Icon className="h-8 w-8 text-gray-400" />
                </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
            {description && <p className="text-sm text-gray-500 max-w-sm mx-auto">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
