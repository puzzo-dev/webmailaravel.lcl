import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  HiSearch,
  HiX,
  HiInbox,
  HiChartBar,
  HiUser,
  HiGlobe,
  HiMail,
  HiCog,
  HiBell,
  HiDocumentText,
  HiPlus,
  HiCog as HiSettings,
} from 'react-icons/hi';

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Mock data - replace with actual Redux state
  const campaigns = useSelector(state => state.campaigns?.campaigns || []);
  const senders = useSelector(state => state.senders?.senders || []);
  const domains = useSelector(state => state.domains?.domains || []);

  const searchItems = [
    // Navigation items
    { type: 'nav', title: 'New Campaign', path: '/campaigns/new', icon: HiPlus, category: 'Campaigns' },
    { type: 'nav', title: 'View Campaigns', path: '/campaigns', icon: HiInbox, category: 'Campaigns' },
    { type: 'nav', title: 'Analytics', path: '/analytics', icon: HiChartBar, category: 'Analytics' },
    { type: 'nav', title: 'Senders', path: '/senders', icon: HiUser, category: 'Configuration' },
    { type: 'nav', title: 'Domains', path: '/domains', icon: HiGlobe, category: 'Configuration' },
    { type: 'nav', title: 'Account', path: '/account', icon: HiSettings, category: 'System' },
    { type: 'nav', title: 'Notifications', path: '/notifications', icon: HiBell, category: 'System' },
    
    // Dynamic items from Redux state
    ...campaigns.map(campaign => ({
      type: 'campaign',
      title: campaign.name,
      path: `/campaigns/${campaign.id}`,
      icon: HiInbox,
      category: 'Campaigns',
      subtitle: `Status: ${campaign.status}`,
    })),
    
    ...senders.map(sender => ({
      type: 'sender',
      title: sender.name,
      path: '/senders',
      icon: HiUser,
      category: 'Senders',
      subtitle: sender.email,
    })),
    
    ...domains.map(domain => ({
      type: 'domain',
      title: domain.name || domain.domain,
      path: '/domains',
      icon: HiGlobe,
      category: 'Domains',
      subtitle: `Status: ${domain.status}`,
    })),
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      
      if (isOpen && results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % results.length);
        }
        
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        }
        
        if (e.key === 'Enter') {
          e.preventDefault();
          if (results[selectedIndex]) {
            navigate(results[selectedIndex].path);
            setIsOpen(false);
            setQuery('');
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, navigate]);

  useEffect(() => {
    if (query.trim()) {
      const filtered = searchItems.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
      );
      setResults(filtered);
      setSelectedIndex(0);
    } else {
      setResults([]);
    }
  }, [query, searchItems]);

  const handleResultClick = (result) => {
    navigate(result.path);
    setIsOpen(false);
    setQuery('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <HiSearch className="h-4 w-4" />
        <span className="hidden md:block">Search...</span>
        <span className="hidden md:block text-xs text-gray-400">Ctrl+K</span>
      </button>
    );
  }

  return (
            <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-start justify-center pt-20">
      <div ref={searchRef} className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center border-b border-gray-200 p-4">
          <HiSearch className="h-5 w-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns, senders, domains, settings..."
            className="flex-1 outline-none text-gray-900"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="ml-3 text-gray-400 hover:text-gray-600"
          >
            <HiX className="h-5 w-5" />
          </button>
        </div>
        
        {results.length > 0 && (
          <div className="max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={`${result.type}-${result.title}-${index}`}
                onClick={() => handleResultClick(result)}
                className={`w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors ${
                  index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <result.icon className="h-5 w-5 text-gray-400 mr-3" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{result.title}</div>
                  {result.subtitle && (
                    <div className="text-sm text-gray-500">{result.subtitle}</div>
                  )}
                  <div className="text-xs text-gray-400">{result.category}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {query && results.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No results found for "{query}"
          </div>
        )}
        
        {!query && (
          <div className="p-4 text-center text-gray-500">
            Start typing to search...
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch; 