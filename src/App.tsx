import React from 'react';
import { App as AntdApp, ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import MainLayout from './MainLayout';

export default function App() {
  const [isMobile, setIsMobile] = React.useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#F38320',
          colorLink: '#F38320',
          colorLinkHover: '#e07518',
          colorInfo: '#0047AB',
          borderRadius: 8,
          borderRadiusLG: 12,
          borderRadiusSM: 6,
          colorBgLayout: '#f4f5f7',
          colorBorder: '#e2e5eb',
          colorBorderSecondary: '#ebedf1',
          /* Thanh / ô điều khiển giữ kích thước chuẩn */
          controlHeight: isMobile ? 38 : 40,
          controlHeightLG: isMobile ? 42 : 44,
          fontFamily: "'Times New Roman', Times, 'Noto Serif', Georgia, serif",
          /* Chữ responsive: Mobile 15px, Desktop 20px */
          fontSize: isMobile ? 15 : 20,
          fontSizeLG: isMobile ? 17 : 22,
          fontSizeSM: isMobile ? 13 : 17,
          boxShadow:
            '0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 3px 0 rgba(16, 24, 40, 0.06)',
          boxShadowSecondary:
            '0 4px 10px -2px rgba(16, 24, 40, 0.1), 0 2px 6px -2px rgba(16, 24, 40, 0.06)',
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
            siderBg: '#0047AB',
            bodyBg: '#f4f5f7',
            headerHeight: isMobile ? 56 : 64,
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
            itemHeight: isMobile ? 40 : 44,
            collapsedIconSize: 18,
            fontSize: isMobile ? 15 : 18,
          },
          Button: {
            borderRadius: 8,
            controlHeight: isMobile ? 38 : 40,
            fontWeight: 700,
            fontSize: isMobile ? 15 : 18,
          },
          Card: {
            borderRadiusLG: 12,
            headerFontSize: isMobile ? 17 : 22,
            boxShadowTertiary: '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
          },
          Table: {
            headerBg: '#00327d',
            headerColor: '#ffffff',
            headerSortActiveBg: '#00327d',
            headerSortHoverBg: '#0047ab',
            headerFilterHoverBg: '#0047ab',
            rowHoverBg: '#f8fafc',
            borderColor: '#eef0f3',
            headerBorderRadius: 10,
            cellFontSize: isMobile ? 13 : 14,
            cellFontSizeMD: isMobile ? 13 : 14,
            cellFontSizeSM: 12,
            cellPaddingBlock: 6,
            cellPaddingInline: 8,
            cellPaddingBlockMD: 6,
            cellPaddingInlineMD: 8,
            cellPaddingBlockSM: 4,
            cellPaddingInlineSM: 6,
          },
          Input: {
            borderRadius: 8,
            controlHeight: isMobile ? 38 : 40,
            fontSize: isMobile ? 15 : 18,
          },
          Select: {
            borderRadius: 8,
            controlHeight: isMobile ? 38 : 40,
            fontSize: isMobile ? 15 : 18,
          },
          DatePicker: {
            borderRadius: 8,
            controlHeight: isMobile ? 38 : 40,
            fontSize: isMobile ? 15 : 18,
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
