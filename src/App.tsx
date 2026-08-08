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
          colorLink: '#F38320',
          colorLinkHover: '#e07518',
          colorInfo: '#1E386B',
          borderRadius: 8,
          borderRadiusLG: 12,
          borderRadiusSM: 6,
          colorBgLayout: '#f4f5f7',
          colorBorder: '#e2e5eb',
          colorBorderSecondary: '#ebedf1',
          controlHeight: 36,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          boxShadow:
            '0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 3px 0 rgba(16, 24, 40, 0.06)',
          boxShadowSecondary:
            '0 4px 10px -2px rgba(16, 24, 40, 0.1), 0 2px 6px -2px rgba(16, 24, 40, 0.06)',
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
            siderBg: '#1E386B',
            bodyBg: '#f4f5f7',
          },
          Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'rgba(0, 0, 0, 0.16)',
            darkItemSelectedBg: '#F38320',
            darkItemSelectedColor: '#ffffff',
            darkItemHoverBg: 'rgba(243, 131, 32, 0.16)',
            darkItemHoverColor: '#ffffff',
            itemBorderRadius: 8,
            itemMarginInline: 12,
            itemHeight: 42,
            collapsedIconSize: 16,
          },
          Button: {
            borderRadius: 8,
            controlHeight: 36,
            fontWeight: 600,
          },
          Card: {
            borderRadiusLG: 12,
            headerFontSize: 15,
            boxShadowTertiary: '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
          },
          Table: {
            headerBg: '#1E386B',
            headerColor: '#F38320',
            headerSortActiveBg: '#1E386B',
            headerSortHoverBg: '#243f75',
            headerFilterHoverBg: '#243f75',
            rowHoverBg: '#f8fafc',
            borderColor: '#eef0f3',
            headerBorderRadius: 10,
          },
          Input: {
            borderRadius: 8,
            controlHeight: 36,
          },
          Select: {
            borderRadius: 8,
            controlHeight: 36,
          },
          Tabs: {
            itemSelectedColor: '#1E386B',
            itemColor: 'rgba(15, 23, 42, 0.55)',
            inkBarColor: '#F38320',
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
