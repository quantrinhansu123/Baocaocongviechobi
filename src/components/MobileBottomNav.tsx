import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  CarryOutOutlined,
  BarChartOutlined,
  FormOutlined,
  TeamOutlined,
} from '@ant-design/icons';

const NAV_ITEMS = [
  { key: '/', label: 'Tổng quan', icon: HomeOutlined },
  { key: '/tasks', label: 'Công việc', icon: CarryOutOutlined },
  { key: '/work-report-detail', label: 'Báo cáo', icon: BarChartOutlined },
  { key: '/work-notes', label: 'Ghi chú', icon: FormOutlined },
] as const;

function isActive(pathname: string, key: string): boolean {
  if (key === '/') {
    return pathname === '/';
  }
  if (key === '/tasks') {
    return pathname.startsWith('/tasks');
  }
  if (key === '/work-report-detail') {
    return pathname.startsWith('/work-report-detail') || pathname.startsWith('/reports');
  }
  if (key === '/work-notes') {
    return pathname.startsWith('/work-notes') || pathname.startsWith('/general-notes') || pathname.startsWith('/personnel');
  }
  return pathname === key;
}

const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] safe-area-pb"
      aria-label="Điều hướng chính"
    >
      <div className="grid grid-cols-4 mobile-bottom-nav-inner">
        {NAV_ITEMS.map(item => {
          const active = isActive(location.pathname, item.key);
          const isPersonnel = item.key === '/work-notes' && location.pathname.startsWith('/personnel');
          const label = isPersonnel ? 'Nhân sự' : item.label;
          const Icon = isPersonnel ? TeamOutlined : item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(isPersonnel ? '/personnel' : item.key)}
              className={`flex flex-col items-center justify-center py-1.5 gap-0.5 text-[11px] font-semibold transition-all ${
                active ? 'text-[#0047AB]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {active ? <span className="w-1.5 h-1.5 rounded-full bg-[#F38320] mb-0.5" /> : <span className="h-2" />}
              <Icon className={`text-lg ${active ? 'text-[#0047AB]' : 'text-slate-400'}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
