import { HiCog } from 'react-icons/hi';

export default function Placeholder({ title, description }) {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
                        <HiCog className="h-8 w-8 text-indigo-600" />
                    </div>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                    {description || 'This section is being migrated to the new Inertia frontend. Full functionality will be available soon.'}
                </p>
            </div>
        </div>
    );
}
