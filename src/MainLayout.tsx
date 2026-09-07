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
  TeamOutlined,
} from '@ant-design/icons';
import { Navigate, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import './MainLayout.css';
import logo from './img/logo.png';
import { loadDashboardTasks, normalizeDashboardChartStatus } from './services/dashboardData';
import MobileBottomNav from './components/MobileBottomNav';
import { MobileShellProvider } from './contexts/MobileShellContext';
import { HeaderToolbarProvider, useHeaderToolbar } from './contexts/HeaderToolbarContext';

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
const PersonnelView = lazy(() => import('./pages/PersonnelView'));

const { Content, Header, Sider } = Layout;

const TASK_MENU_TREE = [
  {
    key: 'bld',
    label: 'I. BAN LÃNH ĐẠO',
    depts: [
      { key: 'bld-ca-nhan', label: '1. CÔNG VIỆC CÁ NHÂN' },
      { key: 'bld-cong-viec-bld', label: '2. CÔNG VIỆC CỦA BLĐ' },
      { key: 'bld-cong-viec-thu-ky', label: '3. CÔNG VIỆC CỦA THƯ KÝ' },
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

function renderMenuLabelWithCount(
  label: string,
  count: number,
  options?: { onOrange?: boolean }
): React.ReactNode {
  if (!count) return label;
  const badgeClass = options?.onOrange
    ? 'sidebar-menu-count-badge sidebar-menu-count-badge--on-orange'
    : 'sidebar-menu-count-badge';
  return (
    <span className="sidebar-menu-label-row">
      <span className="sidebar-menu-label-text">{label}</span>
      <span className={badgeClass} title={`${count} CV chưa hoàn thành`}>
        {count > 99 ? '99+' : count}
      </span>
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
  return (
    <HeaderToolbarProvider>
      <MainLayoutInner />
    </HeaderToolbarProvider>
  );
};

const MainLayoutInner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toolbar } = useHeaderToolbar();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile Menu State
  const [collapsed, setCollapsed] = useState(false); // Desktop Sider State
  const [menuOpenKeys, setMenuOpenKeys] = useState<string[]>(['/tasks']);
  const [incompleteByDept, setIncompleteByDept] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    const refreshIncompleteCounts = (force = false) => {
      void loadDashboardTasks(force ? { force: true } : undefined)
        .then(tasks => {
          if (cancelled) return;
          const counts: Record<string, number> = {};
          for (const task of tasks) {
            if (normalizeDashboardChartStatus(task.status) === 'Hoàn thành') continue;
            if (!task.deptKey) continue;
            counts[task.deptKey] = (counts[task.deptKey] ?? 0) + 1;
          }
          setIncompleteByDept(counts);
        })
        .catch(() => {
          if (!cancelled) setIncompleteByDept({});
        });
    };

    // Để dashboard/route hiện tại chiếm mạng trước; badge sidebar tải sau một nhịp.
    const timer = window.setTimeout(() => refreshIncompleteCounts(false), 0);
    const onFocus = () => refreshIncompleteCounts(true);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshIncompleteCounts(true);
    };
    const onTasksChanged = () => refreshIncompleteCounts(true);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('dashboard-tasks-changed', onTasksChanged);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('dashboard-tasks-changed', onTasksChanged);
    };
  }, [location.pathname]);

  const totalIncomplete = useMemo(
    () => Object.values(incompleteByDept).reduce<number>((sum, n) => sum + Number(n || 0), 0),
    [incompleteByDept]
  );

  const dashboardMenuItems: MenuProps['items'] = useMemo(
    () => [
      { key: '/', icon: <DashboardOutlined className="sidebar-nav-icon" />, label: 'ĐIỀU HÀNH CÔNG VIỆC' },
    ],
    []
  );

  /** Đặt cuối sidebar: sau ghi chú / nhân sự */
  const tasksMenuItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: '/tasks',
        icon: <CheckSquareOutlined className="sidebar-nav-icon" />,
        label: renderMenuLabelWithCount('CÔNG VIỆC CHI TIẾT', totalIncomplete, { onOrange: true }),
        children: TASK_MENU_TREE.map(block => {
          const blockCount = block.depts.reduce(
            (sum, dept) => sum + (incompleteByDept[dept.key] ?? 0),
            0
          );
          const blockPath = `/tasks/${block.key}`;
          return {
            key: blockPath,
            label: renderMenuLabelWithCount(block.label, blockCount),
            onTitleClick: () => {
              navigate(blockPath);
              setMenuOpenKeys(previousKeys =>
                Array.from(new Set([...previousKeys, '/tasks', blockPath]))
              );
              setMobileMenuOpen(false);
            },
            children: block.depts.map(dept => ({
              key: `/tasks/${block.key}/${dept.key}`,
              label: renderMenuLabelWithCount(dept.label, incompleteByDept[dept.key] ?? 0),
            })),
          };
        }),
      },
    ],
    [incompleteByDept, totalIncomplete, navigate]
  );

  const notesMenuItems: MenuProps['items'] = useMemo(
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
      {
        key: '/personnel',
        icon: <TeamOutlined className="sidebar-nav-icon" />,
        label: 'NHÂN SỰ',
      },
    ],
    []
  );

  const selectedMenuKeys = useMemo(() => {
    if (location.pathname.startsWith('/tasks')) {
      const k = sidebarSelectedKey(location.pathname);
      return k ? [k] : [];
    }
    if (location.pathname === '/') return ['/'];
    if (location.pathname === '/general-notes') return ['/general-notes'];
    if (location.pathname === '/work-notes') return ['/work-notes'];
    if (location.pathname === '/personnel') return ['/personnel'];
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
      return;
    }
    if (key === '/personnel') {
      navigate('/personnel');
      setMobileMenuOpen(false);
    }
  };

  const userMenuItems = [
    { key: 'profile', label: 'Hồ sơ cá nhân', icon: <UserOutlined /> },
    { key: 'logout', label: 'Đăng xuất', danger: true },
  ];

  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeBlockKey =
    pathParts[0] === 'tasks' && pathParts[1] ? pathParts[1] : undefined;
  const activeDeptKey =
    pathParts[0] === 'tasks' && pathParts[2] ? pathParts[2] : undefined;
  const activeBlock = TASK_MENU_TREE.find(b => b.key === activeBlockKey);
  const isFullBleedMobileRoute =
    location.pathname.startsWith('/tasks') ||
    location.pathname === '/work-notes' ||
    location.pathname === '/general-notes';
  const showTopicLinks =
    location.pathname === '/' || location.pathname.startsWith('/tasks');

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
        <div className="sidebar-sider-inner">
          <div className={`h-16 flex items-center bg-[#F38320] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shrink-0 overflow-hidden ${collapsed ? 'justify-center px-2' : 'px-6'}`}>
            <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center overflow-hidden bg-white p-1 rounded-lg shadow-sm cursor-pointer transition-all duration-300 ${collapsed ? 'mr-0' : 'mr-2'}`} onClick={() => navigate('/')}>
              <img
                src={logo}
                alt="Hobiwood Logo"
                className="w-full h-auto object-contain"
              />
            </div>
            <span
              className={`font-bold text-lg text-[#1E386B] tracking-wider whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                collapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[180px] opacity-100'
              }`}
            >
              HOBI VIỆT NAM
            </span>
          </div>
          <div className="sidebar-menu-scroll">
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={selectedMenuKeys}
              items={dashboardMenuItems}
              onClick={handleMenuClick}
              inlineIndent={14}
              className="border-none mt-4 sidebar-report-menu"
            />
            <div className="sidebar-notes-block">
              <Menu
                theme="dark"
                mode="inline"
                selectedKeys={selectedMenuKeys}
                items={notesMenuItems}
                onClick={handleMenuClick}
                inlineIndent={14}
                className="border-none sidebar-report-menu sidebar-notes-menu"
                selectable
              />
            </div>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={selectedMenuKeys}
              openKeys={menuOpenKeys}
              onOpenChange={handleMenuOpenChange}
              items={tasksMenuItems}
              onClick={handleMenuClick}
              inlineIndent={14}
              className="border-none sidebar-report-menu sidebar-tasks-menu"
            />
          </div>
        </div>
      </Sider>

      <Layout className="main flex flex-col min-w-0" style={{ flex: 1 }}>
        {/* --- COMMON HEADER --- */}
        <Header className="p-0 flex items-center justify-between shadow-sm px-2.5 md:px-4 z-10 min-h-14 md:min-h-16 h-14 md:h-16 border-b bg-white border-gray-200 gap-1.5 md:gap-3">

          <div className="flex items-center shrink-0">
            {/* Desktop: Nút gập Sider */}
            <div className="hidden md:flex items-center">
              {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                className: 'text-xl cursor-pointer text-[#1E386B] hover:text-[#F38320] transition-colors mr-4',
                onClick: () => setCollapsed(!collapsed),
              })}
            </div>

            {/* Mobile: Nút Hamburger + Logo (ẩn chữ brand để chừa toolbar) */}
            <div className="flex md:hidden items-center">
              <button
                type="button"
                aria-label="Mở menu"
                className="mr-1.5 flex items-center justify-center w-9 h-9 rounded-lg transition-all shrink-0 bg-orange-50 text-[#1E386B] border-2 border-[#F38320]/40 hover:bg-orange-100 shadow-sm"
                onClick={() => setMobileMenuOpen(true)}
              >
                <MenuOutlined className="text-[20px] font-bold" />
              </button>
              <div
                className="custom-navbar-brand cursor-pointer flex items-center"
                onClick={() => navigate('/')}
              >
                <img src={logo} alt="Hobiwood Logo" className="h-7 w-auto object-contain" />
              </div>
            </div>
          </div>

          <div className="header-toolbar-slot flex-1 min-w-0 flex items-center justify-end md:justify-center overflow-x-auto">
            {toolbar}
          </div>

          <Space size="small" className="md:size-large shrink-0">
            <Badge count={3} dot offset={[-2, 2]} color="#1E386B">
              <div className="h-8 w-8 md:h-9 md:w-9 flex items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-gray-100 text-gray-700">
                <BellOutlined className="text-lg md:text-xl text-[#1E386B]" />
              </div>
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <Space className="cursor-pointer p-0.5 md:px-2 rounded-lg transition-colors hover:bg-gray-100">
                <Avatar icon={<UserOutlined />} className="bg-[#F38320]" size="small" />
                <div className="hidden md:block">
                  <div className="text-sm font-bold leading-none text-[rgba(0,0,0,0.88)]">Anh Tuyển</div>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {showTopicLinks ? (
          <div className="topic-link-bar">
            <div className="topic-link-row">
              <Link
                to="/tasks"
                className={`topic-link${location.pathname === '/tasks' ? ' is-active' : ''}`}
              >
                Tất cả CV
              </Link>
              {TASK_MENU_TREE.map(block => {
                const href = `/tasks/${block.key}`;
                const active = activeBlockKey === block.key;
                return (
                  <Link
                    key={block.key}
                    to={href}
                    className={`topic-link${active ? ' is-active' : ''}`}
                    title={block.label}
                  >
                    {block.label}
                  </Link>
                );
              })}
            </div>
            {activeBlock ? (
              <div className="topic-link-row topic-link-row--depts">
                <Link
                  to={`/tasks/${activeBlock.key}`}
                  className={`topic-link topic-link--dept${
                    activeBlockKey && !activeDeptKey ? ' is-active' : ''
                  }`}
                >
                  Tổng khối
                </Link>
                {activeBlock.depts.map(dept => {
                  const href = `/tasks/${activeBlock.key}/${dept.key}`;
                  const active = activeDeptKey === dept.key;
                  return (
                    <Link
                      key={dept.key}
                      to={href}
                      className={`topic-link topic-link--dept${active ? ' is-active' : ''}`}
                      title={dept.label}
                    >
                      {dept.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

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
          destroyOnClose={false}
          styles={{
            body: {
              padding: 0,
              background: 'linear-gradient(180deg, #1E386B 0%, #152a47 100%)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            },
            header: { backgroundColor: '#F38320', borderBottom: 'none', padding: '16px 24px' },
            mask: { transition: 'opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1)' },
            wrapper: { transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)' },
          }}
          closeIcon={<span className="text-white hover:text-gray-300 transition-colors text-lg">✖</span>}
        >
          <div className="sidebar-menu-scroll flex-1 overflow-y-auto py-4">
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={selectedMenuKeys}
              items={dashboardMenuItems}
              onClick={handleMenuClick}
              inlineIndent={14}
              className="border-none sidebar-report-menu"
              style={{ backgroundColor: 'transparent' }}
            />
            <div className="sidebar-notes-block">
              <Menu
                theme="dark"
                mode="inline"
                selectedKeys={selectedMenuKeys}
                items={notesMenuItems}
                onClick={handleMenuClick}
                inlineIndent={14}
                className="border-none sidebar-report-menu sidebar-notes-menu"
                style={{ backgroundColor: 'transparent' }}
                selectable
              />
            </div>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={selectedMenuKeys}
              openKeys={menuOpenKeys}
              onOpenChange={handleMenuOpenChange}
              items={tasksMenuItems}
              onClick={handleMenuClick}
              inlineIndent={14}
              className="border-none sidebar-report-menu sidebar-tasks-menu"
              style={{ backgroundColor: 'transparent' }}
            />
          </div>
        </Drawer>

        {/* --- CONTENT AREA --- */}
        <Content
          className={`overflow-auto flex-1 flex flex-col relative main-content-mobile-pad bg-gray-50 ${
            isFullBleedMobileRoute
              ? 'main-content-fullbleed p-0 md:p-6'
              : 'p-4 md:p-6'
          }`}
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
              <Route path="/personnel" element={<PersonnelView />} />
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