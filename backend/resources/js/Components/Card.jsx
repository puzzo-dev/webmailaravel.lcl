export default function Card({ children, className = '', title, action }) {
    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
            {(title || action) && (
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    {title && <h3 className="text-sm font-semibold text-gray-900">{title}</h3>}
                    {action}
                </div>
            )}
            {children}
        </div>
    );
}
