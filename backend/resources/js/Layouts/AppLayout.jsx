import { useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    HiHome, HiInbox, HiChartBar, HiUsers, HiCog, HiBell, HiUser,
    HiCreditCard, HiShieldCheck, HiGlobe, HiServer, HiKey, HiClock,
    HiLogout, HiBan, HiDatabase, HiMenu, HiX, HiSearch, HiMail,
    HiClipboardList, HiCloud, HiViewBoards, HiViewList,
} from 'react-icons/hi';

const userNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HiHome },
    { name: 'Campaigns', href: '/campaigns', icon: HiInbox },
    { name: 'Analytics', href: '/analytics', icon: HiChartBar },
    { name: 'Senders', href: '/senders', icon: HiServer },
    { name: 'Content', href: '/contents', icon: HiViewBoards },
    { name: 'Suppression List', href: '/suppression-list', icon: HiBan },
    { name: 'Bounce Processing', href: '/bounce-credentials', icon: HiShieldCheck },
    { name: 'Billing', href: '/billing', icon: HiCreditCard },
    { name: 'Account', href: '/account', icon: HiUser },
];

const adminNavigation = [
    { name: 'Admin Dashboard', href: '/admin', icon: HiHome },
    { name: 'Users', href: '/admin/users', icon: HiUsers },
    { name: 'Campaigns', href: '/admin/campaigns', icon: HiInbox },
    { name: 'Senders', href: '/admin/senders', icon: HiServer },
    { name: 'Suppression List', href: '/admin/suppression-list', icon: HiBan },
    { name: 'SMTP Configs', href: '/admin/smtp', icon: HiKey },
    { name: 'System Settings', href: '/admin/system', icon: HiCog },
    { name: 'Backups', href: '/admin/backups', icon: HiCloud },
    { name: 'Logs & Queues', href: '/admin/logs', icon: HiClipboardList },
    { name: 'PowerMTA', href: '/admin/powermta', icon: HiServer },
    { name: 'Notifications', href: '/admin/notifications', icon: HiBell },
    { name: 'Billing', href: '/admin/billing', icon: HiCreditCard },
];

function NavItem({ item, currentPath, onClick }) {
    const isActive = currentPath === item.href ||
        (item.href !== '/dashboard' && item.href !== '/admin' && currentPath.startsWith(item.href));
    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
        >
            <item.icon
                className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
            />
            {item.name}
        </Link>
    );
}

function Sidebar({ user, onLogout }) {
    const { url } = usePage();
    const isAdmin = user?.role === 'admin';
    const isAdminSection = url.startsWith('/admin');

    return (
        <div className="hidden md:flex md:flex-shrink-0">
            <div className="flex flex-col w-64">
                <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
                    {/* Logo */}
                    <div className="flex items-center h-16 flex-shrink-0 px-4 bg-indigo-600">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                                    <HiMail className="h-5 w-5 text-indigo-600" />
                                </div>
                            </div>
                            <div className="ml-3">
                                <h1 className="text-white text-lg font-semibold">
                                    {import.meta.env.VITE_APP_NAME ?? 'Campaign Pro X'}
                                </h1>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 flex flex-col overflow-y-auto">
                        <nav className="flex-1 px-2 py-4 space-y-1">
                            {isAdmin && isAdminSection ? (
                                <>
                                    <div className="pb-2">
                                        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Admin
                                        </h3>
                                    </div>
                                    {adminNavigation.map((item) => (
                                        <NavItem key={item.name} item={item} currentPath={url} />
                                    ))}
                                </>
                            ) : (
                                <>
                                    <div className="pb-2">
                                        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Menu
                                        </h3>
                                    </div>
                                    {userNavigation.map((item) => (
                                        <NavItem key={item.name} item={item} currentPath={url} />
                                    ))}
                                </>
                            )}
                        </nav>
                    </div>

                    {/* User Menu */}
                    <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                        <div className="flex items-center w-full">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                        {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">{user?.name || 'User'}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={onLogout}
                                className="ml-auto flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-600"
                                title="Sign out"
                            >
                                <HiLogout className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MobileMenu({ isOpen, onClose, user, onLogout }) {
    const { url } = usePage();
    const isAdmin = user?.role === 'admin';
    const isAdminSection = url.startsWith('/admin');
    const nav = isAdmin && isAdminSection ? adminNavigation : userNavigation;

    if (!isOpen) return null;

    return (
        <div className="md:hidden">
            <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75" onClick={onClose} />
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
                <div className="flex items-center justify-between h-16 px-4 bg-indigo-600">
                    <span className="text-white text-lg font-semibold">
                        {import.meta.env.VITE_APP_NAME ?? 'Campaign Pro X'}
                    </span>
                    <button onClick={onClose} className="text-white hover:text-gray-200">
                        <HiX className="h-6 w-6" />
                    </button>
                </div>
                <nav className="px-2 py-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
                    {nav.map((item) => (
                        <NavItem key={item.name} item={item} currentPath={url} onClick={onClose} />
                    ))}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 flex items-center">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <button onClick={onLogout} className="ml-2 p-1 text-gray-400 hover:text-gray-600">
                        <HiLogout className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function Header({ onMenuToggle, user, onLogout }) {
    const { url } = usePage();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);
    const isAdmin = user?.role === 'admin';
    const isAdminSection = url.startsWith('/admin');

    useEffect(() => {
        const handler = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const switchView = () => {
        if (isAdminSection) {
            router.visit('/dashboard');
        } else {
            router.visit('/admin');
        }
        setShowUserMenu(false);
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <button
                            onClick={onMenuToggle}
                            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        >
                            <HiMenu className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* View switcher for admins */}
                        {isAdmin && (
                            <button
                                onClick={switchView}
                                className="hidden sm:flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                {isAdminSection ? (
                                    <><HiViewList className="h-4 w-4 mr-1.5" /> User View</>
                                ) : (
                                    <><HiViewBoards className="h-4 w-4 mr-1.5" /> Admin View</>
                                )}
                            </button>
                        )}

                        {/* User Menu */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                        {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                                <span className="hidden md:block text-sm font-medium">
                                    {user?.name || 'User'}
                                </span>
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="py-1">
                                        <Link
                                            href="/account"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <HiUser className="h-4 w-4 mr-3" />
                                            Account
                                        </Link>
                                        {isAdmin && (
                                            <button
                                                onClick={switchView}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                {isAdminSection ? (
                                                    <><HiViewList className="h-4 w-4 mr-3" /> User View</>
                                                ) : (
                                                    <><HiViewBoards className="h-4 w-4 mr-3" /> Admin View</>
                                                )}
                                            </button>
                                        )}
                                        <hr className="my-1" />
                                        <button
                                            onClick={onLogout}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <HiLogout className="h-4 w-4 mr-3" />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default function AppLayout({ children }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };

    if (!user) {
        return <div>{children}</div>;
    }

    return (
        <div className="h-screen flex overflow-hidden bg-gray-100">
            <Sidebar user={user} onLogout={handleLogout} />
            <MobileMenu
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                user={user}
                onLogout={handleLogout}
            />
            <div className="flex-1 overflow-auto focus:outline-none">
                <Header
                    onMenuToggle={() => setMobileMenuOpen(true)}
                    user={user}
                    onLogout={handleLogout}
                />
                <main className="flex-1 relative overflow-y-auto py-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
