import React, { useState } from 'react';
import { Layout, Badge, Avatar, Dropdown, Space, Drawer, Menu } from 'antd';
import {
  DashboardOutlined,
  ClusterOutlined,
  CheckSquareOutlined,
  BellOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
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

const { Content, Header, Sider } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile Menu State
  const [collapsed, setCollapsed] = useState(false); // Desktop Sider State

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'ĐIỀU HÀNH CÔNG VIỆC' },
    { key: '/navigation', icon: <ClusterOutlined />, label: 'BÁO CÁO ĐỊNH KỲ' },
    { key: '/tasks', icon: <CheckSquareOutlined />, label: 'NHÀ MÁY' },
  ];

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
              src={"../src/img/logo.png"}
              alt="Hobiwood Logo"
              className="w-full h-auto object-contain"
            />
          </div>
          {!collapsed && <span className="font-bold text-lg text-white tracking-wider whitespace-nowrap overflow-hidden"> HoBi Wood</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="border-none mt-4"
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
                <img src={"../src/img/logo.png"} alt="Hobiwood Logo" className="h-8 w-auto object-contain mr-2" />
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
                <img src={"../src/img/logo.png"} alt="Hobiwood Logo" className="w-full h-auto object-contain" />
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
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => {
              navigate(key);
              setMobileMenuOpen(false);
            }}
            className="border-none"
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
            <Route path="/tasks" element={<TaskView />} />
            <Route path="/work-report-detail" element={<WorkReportDetail />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;