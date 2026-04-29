import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Badge, Avatar, Dropdown, Space, Drawer, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  ClusterOutlined,
  BellOutlined,
  UserOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './MainLayout.css';
import { ALL_REPORTS, buildReportMenuItems, openKeysForReportId } from './data/reportNavigation';

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
import logo from './img/logo.png';

const { Content, Header, Sider } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile Menu State
  const [collapsed, setCollapsed] = useState(false); // Desktop Sider State
  const [menuOpenKeys, setMenuOpenKeys] = useState<string[]>(['sub-bao-cao']);

  const reportMenuChildren = useMemo(() => buildReportMenuItems(), []);

  const menuItems: MenuProps['items'] = useMemo(
    () => [
      { key: '/', icon: <DashboardOutlined className="sidebar-nav-icon" />, label: 'ĐIỀU HÀNH CÔNG VIỆC' },
      {
        key: 'sub-bao-cao',
        icon: <ClusterOutlined className="sidebar-nav-icon" />,
        label: 'BÁO CÁO ĐỊNH KỲ',
        children: reportMenuChildren,
      },
    ],
    [reportMenuChildren]
  );

  /** Chiều rộng khi sidebar đang mở (Ant Design tự dùng collapsedWidth khi thu gọn). */
  const expandedSiderWidth = useMemo(() => {
    const open = menuOpenKeys;
    const hasBaoCao = open.includes('sub-bao-cao');
    const deptOpen = open.filter(k => k.startsWith('dept-')).length;
    const periodOpen = open.filter(k => k.startsWith('period-')).length;
    let w = 260;
    if (hasBaoCao) w = 300;
    if (deptOpen >= 1) w = 336;
    if (deptOpen >= 2 || periodOpen >= 1) w = 380;
    if (deptOpen >= 3) w = 412;
    return Math.min(w, 440);
  }, [menuOpenKeys]);

  useEffect(() => {
    if (location.pathname !== '/navigation') return;
    const r = new URLSearchParams(location.search).get('r');
    const required = openKeysForReportId(r);
    if (required.length <= 1) return;
    setMenuOpenKeys(prev => Array.from(new Set([...prev, ...required])));
  }, [location.pathname, location.search]);

  const selectedMenuKeys = useMemo(() => {
    if (location.pathname === '/navigation') {
      const r = new URLSearchParams(location.search).get('r');
      if (r && ALL_REPORTS[r]) return [`report-${r}`];
      return [];
    }
    if (location.pathname === '/') return ['/'];
    return [];
  }, [location.pathname, location.search]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('report-')) {
      const id = key.slice('report-'.length);
      navigate(`/navigation?r=${encodeURIComponent(id)}`);
      setMobileMenuOpen(false);
      return;
    }
    if (key === '/') {
      navigate('/');
      setMobileMenuOpen(false);
      return;
    }
    if (key === 'sub-bao-cao') {
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
        width={expandedSiderWidth}
        collapsedWidth={80}
        className="shadow-lg hidden md:block sidebar-sider-auto"
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
          onOpenChange={keys => setMenuOpenKeys(keys as string[])}
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
          width={Math.max(300, Math.min(360, 280 + menuOpenKeys.filter(k => k.startsWith('dept-') || k.startsWith('period-')).length * 28))}
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
            onOpenChange={keys => setMenuOpenKeys(keys as string[])}
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
            <Route path="/work-report-detail" element={<WorkReportDetail />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;