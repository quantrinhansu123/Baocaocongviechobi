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
          /* Thanh / ô điều khiển giữ kích thước chuẩn */
          controlHeight: 40,
          controlHeightLG: 44,
          fontFamily: "'Times New Roman', Times, 'Noto Serif', Georgia, serif",
          /* Chữ to hơn */
          fontSize: 20,
          fontSizeLG: 22,
          fontSizeSM: 17,
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
            headerHeight: 64,
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
            itemHeight: 44,
            collapsedIconSize: 18,
            fontSize: 18,
          },
          Button: {
            borderRadius: 8,
            controlHeight: 40,
            fontWeight: 700,
            fontSize: 18,
          },
          Card: {
            borderRadiusLG: 12,
            headerFontSize: 22,
            boxShadowTertiary: '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
          },
          Table: {
            headerBg: '#0F274D',
            headerColor: '#ffffff',
            headerSortActiveBg: '#0F274D',
            headerSortHoverBg: '#16325f',
            headerFilterHoverBg: '#16325f',
            rowHoverBg: '#f8fafc',
            borderColor: '#eef0f3',
            headerBorderRadius: 10,
            cellFontSize: 20,
            cellFontSizeMD: 20,
            cellFontSizeSM: 18,
            cellPaddingBlock: 14,
            cellPaddingInline: 14,
            cellPaddingBlockMD: 14,
            cellPaddingInlineMD: 14,
            cellPaddingBlockSM: 12,
            cellPaddingInlineSM: 12,
          },
          Input: {
            borderRadius: 8,
            controlHeight: 40,
            fontSize: 18,
          },
          Select: {
            borderRadius: 8,
            controlHeight: 40,
            fontSize: 18,
          },
          DatePicker: {
            borderRadius: 8,
            controlHeight: 40,
            fontSize: 18,
          },
          Tabs: {
            itemSelectedColor: '#1E386B',
            itemColor: 'rgba(15, 23, 42, 0.55)',
            inkBarColor: '#F38320',
            titleFontSize: 18,
          },
          Tag: {
            fontSize: 16,
            fontSizeSM: 14,
          },
          Pagination: {
            itemSize: 36,
            fontSize: 16,
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
