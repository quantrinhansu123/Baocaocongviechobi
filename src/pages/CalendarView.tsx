import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Badge,
  Typography,
  Card,
  List,
  Tag,
  Space,
  Avatar,
  Tooltip,
  Spin,
  Empty,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  CalendarOutlined,
  UserOutlined,
  NotificationOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { loadCalendarSchedule, type CalendarScheduleItem } from '../services/auxiliaryData';

const { Title, Text } = Typography;
const AntCard = Card as React.ComponentType<React.ComponentProps<typeof Card>>;

const ReportCalendar: React.FC = () => {
  const [selectedValue, setSelectedValue] = useState(() => dayjs());
  const [schedule, setSchedule] = useState<CalendarScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void loadCalendarSchedule()
      .then(data => {
        if (active) {
          setSchedule(data);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const currentMonthSchedule = useMemo(
    () => schedule.filter(item => item.month === dayjs().month()),
    [schedule]
  );

  const dateCellRender = (value: Dayjs) => {
    const day = value.date();
    const month = value.month();

    if (month !== dayjs().month()) {
      return null;
    }

    const listData = currentMonthSchedule.filter(item => item.day === day);

    return (
      <ul className="list-none p-0 m-0">
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status={item.type as 'success' | 'processing' | 'default' | 'error' | 'warning'} title={item.title} />
            <span className="text-[10px] hidden lg:inline-block truncate w-full ml-1 text-gray-500">
              {item.title}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const onSelect = (newValue: Dayjs) => {
    setSelectedValue(newValue);
  };

  const selectedDayData = currentMonthSchedule.filter(item => item.day === selectedValue.date());

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
        <div>
          <Title level={3} className="m-0">
            <CalendarOutlined className="mr-2 text-blue-600" />
            Lịch & Nhắc Báo Cáo
          </Title>
          <Text type="secondary">Dữ liệu từ Supabase (bảng lich_bao_cao)</Text>
        </div>
        <div className="text-right">
          <Tag color="blue" className="px-3 py-1 rounded-full text-sm font-medium">
            Tháng {dayjs().format('MM/YYYY')}
          </Tag>
        </div>
      </div>

      <Spin spinning={loading}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <AntCard className="xl:col-span-2 shadow-sm rounded-xl overflow-hidden" styles={{ body: { padding: '12px' } }}>
            {!loading && schedule.length === 0 ? (
              <Empty className="py-16" description="Chưa có lịch báo cáo trên Supabase" />
            ) : (
              <Calendar
                fullscreen={true}
                cellRender={dateCellRender}
                onSelect={onSelect}
                headerRender={({ value }) => (
                  <div className="p-4 flex justify-between items-center border-b mb-4">
                    <Title level={5} className="m-0">Bảng theo dõi kỳ báo cáo</Title>
                    <Space>
                      <Text strong className="bg-blue-50 px-3 py-1 rounded text-blue-700">
                        {value.format('MMMM, YYYY')}
                      </Text>
                    </Space>
                  </div>
                )}
              />
            )}
          </AntCard>

          <div className="space-y-6">
            <AntCard
              title={
                <div className="flex justify-between items-center w-full">
                  <span>🔔 Nhắc hẹn: Ngày {selectedValue.date()}</span>
                  {selectedDayData.length > 0 && <Badge count={selectedDayData.length} />}
                </div>
              }
              className="shadow-sm rounded-xl border-blue-100"
            >
              {selectedDayData.length > 0 ? (
                <List
                  dataSource={selectedDayData}
                  renderItem={(item: CalendarScheduleItem) => (
                    <List.Item className="border-b last:border-0 px-0 py-4 block">
                      <div className="flex items-start justify-between mb-3">
                        <Space direction="vertical" size={0}>
                          <Text strong className="text-blue-700 text-lg">{item.title}</Text>
                          <Text type="secondary" className="text-xs">⏱ Thời hạn: {item.time} hôm nay</Text>
                        </Space>
                        <Tag color={item.type as 'success' | 'processing' | 'default' | 'error' | 'warning'} className="m-0 uppercase text-[10px]">
                          {item.type === 'error' ? 'Khẩn cấp' : 'Định kỳ'}
                        </Tag>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <Space>
                            <Avatar size="small" icon={<UserOutlined />} className="bg-orange-400" />
                            <Text className="text-xs text-gray-500">Người gửi:</Text>
                          </Space>
                          <Text strong className="text-xs">{item.sender}</Text>
                        </div>
                        <div className="flex items-center justify-between">
                          <Space>
                            <Avatar size="small" icon={<NotificationOutlined />} className="bg-blue-400" />
                            <Text className="text-xs text-gray-500">Người nhận:</Text>
                          </Space>
                          <Text strong className="text-xs">{item.receiver}</Text>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <Tooltip title="Mở báo cáo này">
                          <ArrowRightOutlined className="text-blue-500 cursor-pointer hover:translate-x-1 transition-transform" />
                        </Tooltip>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <div className="py-12 text-center">
                  <Text type="secondary">Không có lịch báo cáo nào trong ngày này.</Text>
                </div>
              )}
            </AntCard>
          </div>
        </div>
      </Spin>
    </div>
  );
};

export default ReportCalendar;
