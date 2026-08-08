import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Layout, Badge, Avatar, Dropdown, Space, Drawer, Menu, Spin } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  CheckSquareOutlined,
  FormOutlined,
  UnorderedListOutlined,
  BellOutlined,
  UserOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';
import { Navigate, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './MainLayout.css';
import logo from './img/logo.png';
import { loadDashboardTasks } from './services/dashboardData';
import MobileBottomNav from './components/MobileBottomNav';
import { MobileShellProvider } from './contexts/MobileShellContext';

// Lazy-load pages để giảm JS lần đầu mở app
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ExecutiveView = lazy(() => import('./pages/ExecutiveView'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const SmartView = lazy(() => import('./pages/SmartView'));
const AdminView = lazy(() => import('./pages/AdminView'));
const WorkReportDetail = lazy(() => import('./pages/WorkReportDetail'));
const TaskView = lazy(() => import('./pages/TaskView'));
const WorkNotesView = lazy(() => import('./pages/WorkNotesView'));
const GeneralNotesView = lazy(() => import('./pages/GeneralNotesView'));

const { Content, Header, Sider } = Layout;

const TASK_MENU_TREE = [
  {
    key: 'bld',
    label: 'I. BAN LÃNH ĐẠO',
    depts: [
      { key: 'bld-ca-nhan', label: '1. CÔNG VIỆC CÁ NHÂN' },
      { key: 'bld-cong-viec-bld', label: '2. CÔNG VIỆC CỦA BLĐ' },
    ],
  },
  {
    key: 'tm',
    label: 'II. KHỐI THƯƠNG MẠI',
    depts: [
      { key: 'tm-hcns', label: '1. PHÒNG HCNS' },
      { key: 'tm-kd-go', label: '2. PHÒNG KD HOBI GỖ' },
      { key: 'tm-kd-nhua', label: '3. PHÒNG KD HOBI NHỰA' },
      { key: 'tm-xuat-khau', label: '4. PHÒNG XUẤT KHẨU' },
      { key: 'tm-du-an', label: '5. PHÒNG DỰ ÁN' },
      { key: 'tm-cn-hcm', label: '6. CHI NHÁNH HCM' },
      { key: 'tm-marketing', label: '7. PHÒNG MARKETING' },
      { key: 'tm-ke-toan', label: '8. PHÒNG KẾ TOÁN TM' },
      { key: 'tm-kho', label: '9. PHÒNG KHO' },
    ],
  },
  {
    key: 'sx',
    label: 'III. KHỐI SẢN XUẤT',
    depts: [
      { key: 'sx-kd-oem', label: '1. PHÒNG KD OEM' },
      { key: 'sx-ke-toan', label: '2. PHÒNG KẾ TOÁN SẢN XUẤT' },
      { key: 'sx-nm-wilson', label: '3. NHÀ MÁY WILSON HB' },
    ],
  },
  {
    key: 'mua',
    label: 'IV. PHÒNG MUA NỘI ĐỊA, QUỐC TẾ',
    depts: [
      { key: 'mua-thuong-mai', label: '1. MUA THƯƠNG MẠI' },
      { key: 'mua-san-xuat', label: '2. MUA SẢN XUẤT' },
    ],
  },
];

function renderMenuLabelWithCount(label: string, count: number): React.ReactNode {
  if (!count) return label;
  return (
    <span className="sidebar-menu-label-row">
      <span className="sidebar-menu-label-text">{label}</span>
      <span className="sidebar-menu-count-badge">{count > 99 ? '99+' : count}</span>
    </span>
  );
}

function sidebarSelectedKey(pathname: string): string {
  if (pathname === '/' || pathname === '/tasks') return pathname;
  if (pathname.startsWith('/tasks/')) {
    const parts = pathname.split('/').filter(Boolean);
    const blockKey = parts[1];
    const deptKey = parts[2];
    if (blockKey && deptKey) return `/tasks/${blockKey}/${deptKey}`;
    if (blockKey) return `/tasks/${blockKey}`;
    return '/tasks';
  }
  return pathname;
}

function sidebarOpenKeys(pathname: string): string[] {
  if (!pathname.startsWith('/tasks')) return [];
  const parts = pathname.split('/').filter(Boolean);
  const blockKey = parts[1];
  if (blockKey) {
    return ['/tasks', `/tasks/${blockKey}`];
  }
  return ['/tasks'];
}

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile Menu State
  const [collapsed, setCollapsed] = useState(false); // Desktop Sider State
  const [menuOpenKeys, setMenuOpenKeys] = useState<string[]>(['/tasks']);
  const [incompleteByDept, setIncompleteByDept] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    // Để dashboard/route hiện tại chiếm mạng trước; badge sidebar tải sau một nhịp.
    const timer = window.setTimeout(() => {
      void loadDashboardTasks()
        .then(tasks => {
          if (cancelled) return;
          const counts: Record<string, number> = {};
          for (const task of tasks) {
            if (task.status.includes('Hoàn thành')) continue;
            counts[task.deptKey] = (counts[task.deptKey] ?? 0) + 1;
          }
          setIncompleteByDept(counts);
        })
        .catch(() => {
          if (!cancelled) {
            setIncompleteByDept({});
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const menuItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: '/general-notes',
        icon: <UnorderedListOutlined className="sidebar-nav-icon" />,
        label: 'GHI CHÚ CHUNG',
      },
      {
        key: '/work-notes',
        icon: <FormOutlined className="sidebar-nav-icon" />,
        label: 'GHI CHÚ PHÒNG BAN',
      },
      { key: '/', icon: <DashboardOutlined className="sidebar-nav-icon" />, label: 'ĐIỀU HÀNH CÔNG VIỆC' },
      {
        key: '/tasks',
        icon: <CheckSquareOutlined className="sidebar-nav-icon" />,
        label: 'CÔNG VIỆC CHI TIẾT',
        children: TASK_MENU_TREE.map(block => {
          const blockCount = block.depts.reduce(
            (sum, dept) => sum + (incompleteByDept[dept.key] ?? 0),
            0
          );
          return {
            key: `/tasks/${block.key}`,
            label: renderMenuLabelWithCount(block.label, blockCount),
            children: block.depts.map(dept => ({
              key: `/tasks/${block.key}/${dept.key}`,
              label: renderMenuLabelWithCount(dept.label, incompleteByDept[dept.key] ?? 0),
            })),
          };
        }),
      },
    ],
    [incompleteByDept]
  );

  const selectedMenuKeys = useMemo(() => {
    if (location.pathname.startsWith('/tasks')) {
      const k = sidebarSelectedKey(location.pathname);
      return k ? [k] : [];
    }
    if (location.pathname === '/') return ['/'];
    if (location.pathname === '/general-notes') return ['/general-notes'];
    if (location.pathname === '/work-notes') return ['/work-notes'];
    return [];
  }, [location.pathname]);

  useEffect(() => {
    if (!location.pathname.startsWith('/tasks')) {
      return;
    }

    const keysToEnsure = sidebarOpenKeys(location.pathname);
    if (keysToEnsure.length === 0) {
      return;
    }

    setMenuOpenKeys(previousKeys => Array.from(new Set([...previousKeys, ...keysToEnsure])));
  }, [location.pathname]);

  const handleMenuOpenChange: MenuProps['onOpenChange'] = keys => {
    setMenuOpenKeys(keys as string[]);
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === '/') {
      navigate('/');
      setMobileMenuOpen(false);
      return;
    }
    if (key === '/tasks' || key.startsWith('/tasks/')) {
      navigate(key);
      setMobileMenuOpen(false);
      return;
    }
    if (key === '/general-notes') {
      navigate('/general-notes');
      setMobileMenuOpen(false);
      return;
    }
    if (key === '/work-notes') {
      navigate('/work-notes');
      setMobileMenuOpen(false);
    }
  };

  const userMenuItems = [
    { key: 'profile', label: 'Hồ sơ cá nhân', icon: <UserOutlined /> },
    { key: 'logout', label: 'Đăng xuất', danger: true },
  ];

  return (
    <MobileShellProvider openMenu={() => setMobileMenuOpen(true)}>
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row' }}>

      {/* --- DESKTOP SIDER (Ẩn trên màn hình mobile) --- */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={320}
        collapsedWidth={80}
        className="shadow-lg hidden md:block sidebar-sider-brand"
      >
        <div className={`h-16 flex items-center px-6 bg-[#F38320] transition-all duration-300 ${collapsed ? 'justify-center px-0' : ''}`}>
          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center overflow-hidden mr-2 bg-white p-1 rounded-lg shadow-sm cursor-pointer" onClick={() => navigate('/')}>
            <img
              src={logo}
              alt="Hobiwood Logo"
              className="w-full h-auto object-contain"
            />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-[#1E386B] tracking-wider whitespace-nowrap overflow-hidden">
              HOBI VIỆT NAM
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedMenuKeys}
          openKeys={menuOpenKeys}
          onOpenChange={handleMenuOpenChange}
          items={menuItems}
          onClick={handleMenuClick}
          inlineIndent={14}
          className="border-none mt-4 sidebar-report-menu"
        />
      </Sider>

      <Layout className="main flex flex-col min-w-0" style={{ flex: 1 }}>
        {/* --- COMMON HEADER --- */}
        <Header className="p-0 flex items-center justify-between shadow-sm px-4 md:px-6 z-10 h-16 border-b bg-white border-gray-200">

          <div className="flex items-center">
            {/* Desktop: Nút gập Sider */}
            <div className="hidden md:flex items-center">
              {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                className: 'text-xl cursor-pointer text-[#1E386B] hover:text-[#F38320] transition-colors mr-4',
                onClick: () => setCollapsed(!collapsed),
              })}
            </div>

            {/* Mobile: Nút Hamburger + Logo gốc */}
            <div className="flex md:hidden items-center">
              <button
                type="button"
                aria-label="Mở menu"
                className="mr-3 flex items-center justify-center w-10 h-10 rounded-lg transition-all shrink-0 bg-orange-50 text-[#1E386B] border-2 border-[#F38320]/40 hover:bg-orange-100 shadow-sm"
                onClick={() => setMobileMenuOpen(true)}
              >
                <MenuOutlined className="text-[22px] font-bold" />
              </button>
              <div
                className="custom-navbar-brand cursor-pointer flex items-center"
                onClick={() => navigate('/')}
              >
                <img src={logo} alt="Hobiwood Logo" className="h-8 w-auto object-contain mr-2" />
                <div className="leading-tight">
                  <p className="font-bold text-base m-0 tracking-wide text-[#1E386B]">
                    HOBI VIỆT NAM
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Space size="middle" className="md:size-large">
            <Badge count={3} dot offset={[-2, 2]} color="#1E386B">
              <div className="h-9 w-9 flex items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-gray-100 text-gray-700">
                <BellOutlined className="text-xl text-[#1E386B]" />
              </div>
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <Space className="cursor-pointer p-1 md:px-2 rounded-lg transition-colors hover:bg-gray-100">
                <Avatar icon={<UserOutlined />} className="bg-[#F38320]" />
                <div className="hidden md:block">
                  <div className="text-sm font-bold leading-none text-[rgba(0,0,0,0.88)]">Anh Tuyển</div>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* TẦNG 2.5: MOBILE MENU DRAWER (Đồng bộ Dark Theme với Desktop) */}
        <Drawer
          title={
            <div className="flex items-center">
              <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center overflow-hidden mr-2 bg-white p-1 rounded-md shadow-sm">
                <img src={logo} alt="Hobiwood Logo" className="w-full h-auto object-contain" />
              </div>
              <span className="font-bold text-lg text-[#1E386B] tracking-wider">HOBI VIỆT NAM</span>
            </div>
          }
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          width={280}
          styles={{
            body: {
              padding: '16px 0',
              background: 'linear-gradient(180deg, #1E386B 0%, #152a47 100%)',
            },
            header: { backgroundColor: '#F38320', borderBottom: 'none', padding: '16px 24px' },
          }}
          closeIcon={<span className="text-white hover:text-gray-300 transition-colors text-lg">✖</span>}
        >
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={selectedMenuKeys}
            openKeys={menuOpenKeys}
            onOpenChange={handleMenuOpenChange}
            items={menuItems}
            onClick={handleMenuClick}
            inlineIndent={14}
            className="border-none sidebar-report-menu"
            style={{ backgroundColor: 'transparent' }}
          />
        </Drawer>

        {/* --- CONTENT AREA --- */}
        <Content
          className="overflow-auto flex-1 flex flex-col relative pb-16 md:pb-0 p-4 md:p-6 bg-gray-50"
          style={{ minHeight: 280 }}
        >
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center min-h-[240px]">
                <Spin size="large" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/navigation" element={<Navigate to="/" replace />} />
              <Route path="/reports" element={<Navigate to="/" replace />} />
              <Route path="/reports/:id" element={<Navigate to="/" replace />} />
              <Route path="/executive" element={<ExecutiveView />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/smart-view" element={<SmartView />} />
              <Route path="/admin" element={<AdminView />} />
              <Route path="/tasks/:blockKey/:deptKey" element={<TaskView />} />
              <Route path="/tasks/:blockKey" element={<TaskView />} />
              <Route path="/tasks" element={<TaskView />} />
              <Route path="/general-notes" element={<GeneralNotesView />} />
              <Route path="/work-notes" element={<WorkNotesView />} />
              <Route path="/work-report-detail" element={<WorkReportDetail />} />
            </Routes>
          </Suspense>
        </Content>
        <MobileBottomNav />
      </Layout>
    </Layout>
    </MobileShellProvider>
  );
};

export default MainLayout;