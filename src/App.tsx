import React from 'react';
import { App as AntdApp, ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import MainLayout from './MainLayout';

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#F38320',
          borderRadius: 6,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
            siderBg: '#1E386B',
          },
          Menu: {
            darkItemBg: '#1E386B',
            darkSubMenuItemBg: '#152a47',
            darkItemSelectedBg: '#F38320',
            darkItemSelectedColor: '#ffffff',
            darkItemHoverBg: 'rgba(243, 131, 32, 0.18)',
            darkItemHoverColor: '#ffffff',
          },
          Button: {
            borderRadius: 4,
            controlHeight: 32,
          },
          Card: {
            borderRadiusLG: 8,
          },
        },
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}
