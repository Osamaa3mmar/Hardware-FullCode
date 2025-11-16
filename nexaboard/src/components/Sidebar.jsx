import { useState, useEffect } from 'react';
import { BarChart3, Type, Image, List, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import LogoBox from './LogoBox';
import SidebarButton from './SidebarButton';

const Sidebar = ({ onNavigate, currentPage }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`bg-base-200 h-screen transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'} flex flex-col p-5 border-r-2 border-base-300`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="btn btn-sm btn-ghost mb-6 self-end"
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
      
      {!isCollapsed && (
        <>
          <LogoBox />
        </>
      )}
      
      <div className="flex flex-col gap-3 mt-6 flex-1">
        <SidebarButton 
          label="Dashboard" 
          icon={<BarChart3 size={20} />}
          onClick={() => onNavigate('dashboard')}
          isCollapsed={isCollapsed}
          isActive={currentPage === 'dashboard'}
        />
        <SidebarButton 
          label="Text Mode" 
          icon={<Type size={20} />}
          onClick={() => onNavigate('textMode')}
          isCollapsed={isCollapsed}
          isActive={currentPage === 'textMode'}
        />
        <SidebarButton 
          label="Image Mode" 
          icon={<Image size={20} />}
          onClick={() => onNavigate('imageMode')}
          isCollapsed={isCollapsed}
          isActive={currentPage === 'imageMode'}
        />
        <SidebarButton 
          label="Queue" 
          icon={<List size={20} />}
          onClick={() => onNavigate('queue')}
          isCollapsed={isCollapsed}
          isActive={currentPage === 'queue'}
        />
      </div>
      
      <div className="mt-auto pt-4 border-t border-base-300">
        <SidebarButton 
          label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          icon={theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          onClick={toggleTheme}
          isCollapsed={isCollapsed}
          isActive={false}
        />
      </div>
    </div>
  );
};

export default Sidebar;
