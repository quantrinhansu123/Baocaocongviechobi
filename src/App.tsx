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
            siderBg: '#001529',
          },
          Menu: {
            darkItemBg: '#001529',
            darkItemSelectedBg: '#F38320',
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
