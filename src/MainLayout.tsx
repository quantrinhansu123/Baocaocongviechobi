import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Badge, Avatar, Dropdown, Space, Drawer, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  ClusterOutlined,
  CheckSquareOutlined,
  BellOutlined,
  UserOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './MainLayout.css';

// Pages
import Dashboard from './pages/Dashboard';
import NavigationHub from './pages/NavigationHub';
import ReportList from './pages/ReportList';
import ReportDetail from './pages/ReportDetail';
import ExecutiveView from './pages/ExecutiveView';
import CalendarView from './pages/CalendarView';
import SmartView from './pages/SmartView';
import AdminView from './pages/AdminView';
import WorkReportDetail from './pages/WorkReportDetail';
import TaskView from './pages/TaskView';
import logo from './img/logo.png';
import { buildReportMenuItems, openKeysForReportId } from './data/reportNavigation';
import { loadReportCatalog } from './services/reportCatalog';
import type { ReportCatalog } from './types/report';

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

function sidebarSelectedKey(pathname: string): string {
  if (pathname === '/' || pathname === '/navigation' || pathname === '/tasks') return pathname;
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

function reportIdFromLocation(pathname: string, search: string): string | null {
  if (pathname !== '/navigation') {
    return null;
  }

  const reportId = new URLSearchParams(search).get('r');
  return reportId?.trim() || null;
}

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile Menu State
  const [collapsed, setCollapsed] = useState(false); // Desktop Sider State
  const [menuOpenKeys, setMenuOpenKeys] = useState<string[]>(['/navigation']);
  const [reportCatalog, setReportCatalog] = useState<ReportCatalog>({ reports: {}, blocks: [], groups: [] });

  useEffect(() => {
    let cancelled = false;

    void loadReportCatalog()
      .then(catalog => {
        if (!cancelled) {
          setReportCatalog(catalog);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReportCatalog({ reports: {}, blocks: [], groups: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedReportId = useMemo(
    () => reportIdFromLocation(location.pathname, location.search),
    [location.pathname, location.search]
  );

  const menuItems: MenuProps['items'] = useMemo(
    () => [
      { key: '/', icon: <DashboardOutlined className="sidebar-nav-icon" />, label: 'ĐIỀU HÀNH CÔNG VIỆC' },
      {
        key: '/tasks',
        icon: <CheckSquareOutlined className="sidebar-nav-icon" />,
        label: 'CÔNG VIỆC CHI TIẾT',
        children: TASK_MENU_TREE.map(block => ({
          key: `/tasks/${block.key}`,
          label: block.label,
          children: block.depts.map(dept => ({
            key: `/tasks/${block.key}/${dept.key}`,
            label: dept.label,
          })),
        })),
      },
      {
        key: '/navigation',
        icon: <ClusterOutlined className="sidebar-nav-icon" />,
        label: 'BÁO CÁO ĐỊNH KỲ',
        children: buildReportMenuItems(reportCatalog),
      },
    ],
    [reportCatalog]
  );

  const selectedMenuKeys = useMemo(() => {
    if (location.pathname === '/navigation') {
      if (selectedReportId && reportCatalog.reports[selectedReportId]) {
        return [`report-${selectedReportId}`];
      }
      return ['/navigation'];
    }
    if (location.pathname.startsWith('/tasks')) {
      const k = sidebarSelectedKey(location.pathname);
      return k ? [k] : [];
    }
    if (location.pathname === '/') return ['/'];
    return [];
  }, [location.pathname, selectedReportId, reportCatalog.reports]);

  useEffect(() => {
    const keysToEnsure: string[] = [];

    if (location.pathname.startsWith('/tasks')) {
      keysToEnsure.push(...sidebarOpenKeys(location.pathname));
    }

    if (location.pathname === '/navigation') {
      keysToEnsure.push(...openKeysForReportId(selectedReportId, reportCatalog.reports));
    }

    if (keysToEnsure.length === 0) {
      return;
    }

    setMenuOpenKeys(previousKeys => Array.from(new Set([...previousKeys, ...keysToEnsure])));
  }, [location.pathname, location.search, selectedReportId, reportCatalog.reports]);

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
    if (key.startsWith('report-')) {
      const reportId = key.slice('report-'.length);
      navigate(`/navigation?r=${encodeURIComponent(reportId)}`);
      setMobileMenuOpen(false);
      return;
    }
    if (key === '/navigation') {
      navigate('/navigation');
      setMobileMenuOpen(false);
    }
  };

  const userMenuItems = [
    { key: 'profile', label: 'Hồ sơ cá nhân', icon: <UserOutlined /> },
    { key: 'logout', label: 'Đăng xuất', danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row' }}>

      {/* --- DESKTOP SIDER (Ẩn trên màn hình mobile) --- */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={240}
        collapsedWidth={80}
        className="shadow-lg hidden md:block"
      >
        <div className={`h-16 flex items-center px-6 bg-[#002140] transition-all duration-300 ${collapsed ? 'justify-center px-0' : ''}`}>
          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center overflow-hidden mr-2 bg-white p-1 rounded-lg shadow-sm cursor-pointer" onClick={() => navigate('/')}>
            <img
              src={logo}
              alt="Hobiwood Logo"
              className="w-full h-auto object-contain"
            />
          </div>
          {!collapsed && <span className="font-bold text-lg text-white tracking-wider whitespace-nowrap overflow-hidden"> HoBi Wood</span>}
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
        <Header className="bg-white p-0 flex items-center justify-between shadow-sm px-4 md:px-6 z-10 h-16 border-b border-gray-200">

          <div className="flex items-center">
            {/* Desktop: Nút gập Sider */}
            <div className="hidden md:flex items-center">
              {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                className: 'text-xl cursor-pointer hover:text-blue-500 transition-colors mr-4',
                onClick: () => setCollapsed(!collapsed),
              })}
            </div>

            {/* Mobile: Nút Hamburger + Logo gốc */}
            <div className="flex md:hidden items-center">
              <button
                className="mr-3 text-xl text-[#1E386B] p-1.5 hover:bg-gray-100 rounded-md transition-colors flex items-center"
                onClick={() => setMobileMenuOpen(true)}
              >
                <MenuOutlined />
              </button>
              <div className="custom-navbar-brand cursor-pointer flex items-center" onClick={() => navigate('/')}>
                <img src={logo} alt="Hobiwood Logo" className="h-8 w-auto object-contain mr-2" />
                <div className="leading-tight">
                  <p className="font-bold text-[#1E386B] text-base m-0 tracking-wide">HOBI WOOD</p>
                </div>
              </div>
            </div>
          </div>

          <Space size="middle" className="md:size-large">
            <Badge count={3} dot offset={[-2, 2]} color="#F38320">
              <div className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition-colors text-gray-700">
                <BellOutlined className="text-xl text-[#1677ff]" />
              </div>
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <Space className="cursor-pointer hover:bg-gray-100 p-1 md:px-2 rounded-lg transition-colors">
                <Avatar icon={<UserOutlined />} className="bg-[#1E386B]" />
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
              <span className="font-bold text-lg text-white tracking-wider">HoBi Wood</span>
            </div>
          }
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          width={280}
          styles={{
            body: { padding: '16px 0', backgroundColor: '#001529' },
            header: { backgroundColor: '#002140', borderBottom: 'none', padding: '16px 24px' }
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
        <Content className="p-4 md:p-6 bg-gray-50 overflow-auto flex-1 flex flex-col relative" style={{ minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/navigation" element={<NavigationHub />} />
            <Route path="/reports" element={<ReportList />} />
            <Route path="/reports/:id" element={<ReportDetail />} />
            <Route path="/executive" element={<ExecutiveView />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/smart-view" element={<SmartView />} />
            <Route path="/admin" element={<AdminView />} />
            <Route path="/tasks/:blockKey/:deptKey" element={<TaskView />} />
            <Route path="/tasks/:blockKey" element={<TaskView />} />
            <Route path="/tasks" element={<TaskView />} />
            <Route path="/work-report-detail" element={<WorkReportDetail />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;