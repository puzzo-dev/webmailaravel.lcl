import { Link } from '@inertiajs/react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

export default function Pagination({ links }) {
    if (!links || links.length <= 1) return null;

    return (
        <nav className="flex items-center justify-between mt-4">
            <div className="flex-1 flex justify-between sm:justify-end">
                <div className="flex gap-1">
                    {links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url || '#'}
                            preserveScroll
                            className={`inline-flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                                link.active
                                    ? 'bg-indigo-600 text-white'
                                    : link.url
                                    ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>
        </nav>
    );
}
