import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  FileTextOutlined,
  CarryOutOutlined,
  UserOutlined,
} from '@ant-design/icons';

const NAV_ITEMS = [
  { key: '/', label: 'Tổng quan', icon: HomeOutlined },
  { key: '/navigation', label: 'Báo cáo', icon: FileTextOutlined },
  { key: '/tasks', label: 'Công việc', icon: CarryOutOutlined },
  { key: '/profile', label: 'Cá nhân', icon: UserOutlined },
] as const;

function isActive(pathname: string, key: string): boolean {
  if (key === '/') {
    return pathname === '/';
  }
  if (key === '/navigation') {
    return pathname === '/navigation' || pathname.startsWith('/reports');
  }
  if (key === '/tasks') {
    return pathname.startsWith('/tasks');
  }
  return pathname === key;
}

const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 safe-area-pb"
      aria-label="Điều hướng chính"
    >
      <div className="grid grid-cols-4 h-[60px]">
        {NAV_ITEMS.map(item => {
          const active = isActive(location.pathname, item.key);
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.key === '/profile' ? '/' : item.key)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                active ? 'text-[#1E386B]' : 'text-gray-400'
              }`}
            >
              {active ? <span className="w-1 h-1 rounded-full bg-[#1E386B] mb-0.5" /> : <span className="h-1.5" />}
              <Icon className={`text-xl ${active ? 'text-[#1E386B]' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
