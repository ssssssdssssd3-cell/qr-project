import React from 'react';
import { Page } from '../../types';
import { DashboardIcon, PackageIcon, UploadIcon, ShoppingCartIcon, SparklesIcon, XIcon, MenuIcon } from '../ui/Icons';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const navItems = [
  { id: 'dashboard', label: 'الرئيسية', icon: DashboardIcon },
  { id: 'products', label: 'المنتجات', icon: PackageIcon },
  { id: 'sales', label: 'رفع المبيعات', icon: UploadIcon },
  { id: 'pos', label: 'نقطة البيع', icon: ShoppingCartIcon },
  { id: 'promo', label: 'الصور الترويجية', icon: SparklesIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isSidebarOpen, setIsSidebarOpen }) => {
  const NavLink: React.FC<{ page: Page, label: string, icon: React.FC<{className?: string}>}> = ({ page, label, icon: Icon }) => (
    <li
      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
        activePage === page ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'
      }`}
      onClick={() => {
        setActivePage(page);
        setIsSidebarOpen(false); // Close sidebar on mobile after navigation
      }}
    >
      <Icon className="w-6 h-6 me-3" />
      <span>{label}</span>
    </li>
  );

  return (
    <>
      <div className={`fixed inset-y-0 start-0 bg-gray-800 text-white w-64 p-5 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 z-40 md:relative md:w-64 flex-shrink-0`}>
        <div className="flex justify-between items-center mb-10">
            <h1 className="text-2xl font-bold text-white">سكان برايس<span className="text-green-400">+</span></h1>
            <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}><XIcon className="w-6 h-6" /></button>
        </div>
        <nav>
          <ul>
            {navItems.map(item => (
              <NavLink key={item.id} page={item.id as Page} label={item.label} icon={item.icon} />
            ))}
          </ul>
        </nav>
      </div>
      {isSidebarOpen && <div className="fixed inset-0 bg-black opacity-50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
    </>
  );
};

export default Sidebar;