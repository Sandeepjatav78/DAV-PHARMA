import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/', label: '📦 Inventory' },
  { to: '/sales', label: '💰 Sale' },
  { to: '/manual', label: '📝 Bill' },
  { to: '/kachi-entry', label: '🧾 Kachi Entry' },
  { to: '/purchase-bill', label: '📥 Purchase Bill' },
  { to: '/purchase-bill-history', label: '🗂 Bill History' },
  { to: '/supplier-ledger', label: '📖 Party Ledger' },
  { to: '/reports', label: '📊 Reports' },
  { to: '/credits', label: '💳 Credit' },
  { to: '/purchase-returns', label: '↩️ Purchase Return' },
  { to: '/schedule-ledger', label: '💊 Schedule Ledger' },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const userRole = localStorage.getItem('userRole');
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the page changes (e.g. browser back).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    if(window.confirm("Are you sure you want to Logout?")) {
        localStorage.clear();
        navigate('/login'); 
    }
  };

  // Helper for Link Classes
  const getLinkClass = (path) => {
      const isActive = location.pathname === path;
      
      const baseClass = "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 whitespace-nowrap";
      const activeClass = "bg-teal-50 text-teal-700 shadow-sm border border-teal-100";
      const inactiveClass = "text-gray-500 hover:bg-gray-50 hover:text-teal-600";
      
      return isActive ? `${baseClass} ${activeClass}` : `${baseClass} ${inactiveClass}`;
  };

  const renderLinks = (onClick) => NAV_LINKS.map(({ to, label }) => (
    <li key={to}>
      <Link to={to} onClick={onClick} className={getLinkClass(to)}>{label}</Link>
    </li>
  ));

  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="h-16 flex items-center justify-between gap-2 px-3 md:px-6">

        {/* --- LEFT: MENU BUTTON (small screens), LOGO & ROLE --- */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="xl:hidden p-2 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100 text-xl leading-none"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
          <div className="flex items-center gap-2">
            <img src="/dav-pharma-logo.png" alt="DAV" className="h-10 w-10 rounded-lg object-contain" />
            <span className="font-extrabold tracking-wide text-teal-700">PHARMA</span>
          </div>
          {/* Role Badge only shows for Admin */}
          {userRole === 'admin' && (
              <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wide bg-purple-50 text-purple-700 border-purple-100">
                  Admin
              </span>
          )}
        </div>

        {/* --- CENTER: LINKS (large screens; scrolls horizontally if they don't fit) --- */}
        <div className="hidden xl:block flex-1 min-w-0 overflow-x-auto mx-2">
          {/* mx-auto + w-max centers without clipping the first links when the row overflows */}
          <ul className="flex items-center gap-1 w-max mx-auto py-1">
            {renderLinks()}
          </ul>
        </div>

        {/* --- RIGHT: LOGOUT --- */}
        <div className="shrink-0">
          <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-sm font-bold"
              title="Logout"
          >
              <span className="hidden md:inline">Logout</span> ➔
          </button>
        </div>
      </div>

      {/* --- DROPDOWN MENU (phones / small laptops) --- */}
      {menuOpen && (
        <ul className="xl:hidden border-t border-gray-100 px-3 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {renderLinks(() => setMenuOpen(false))}
        </ul>
      )}

    </div>
  );
};

export default Sidebar;
