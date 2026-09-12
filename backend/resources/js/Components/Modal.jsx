import { useEffect } from 'react';
import { HiX } from 'react-icons/hi';

export default function Modal({ show, onClose, title, children, maxWidth = 'max-w-lg' }) {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (show) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 transition-opacity" onClick={onClose} />
                <div className={`relative bg-white rounded-lg shadow-xl w-full ${maxWidth} z-10`}>
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                            <HiX className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="px-6 py-4">{children}</div>
                </div>
            </div>
        </div>
    );
}
