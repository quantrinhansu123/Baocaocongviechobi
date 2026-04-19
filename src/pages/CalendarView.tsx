import React, { useState } from 'react';
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
  Alert
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  CalendarOutlined,
  UserOutlined,
  NotificationOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// --- DỮ LIỆU GIẢ LẬP LỊCH BÁO CÁO (Sát đặc tả) ---
const REPORT_SCHEDULE = [
  {
    day: 5,
    title: 'Báo cáo tháng NM',
    type: 'error', // Đỏ - Quan trọng
    sender: 'Anh Tài (NM)',
    receiver: 'Sếp Tuyển',
    time: '08:00'
  },
  {
    day: 6,
    title: 'Công nợ OEM',
    type: 'warning', // Vàng
    sender: 'Chị Lan (KT)',
    receiver: 'Sếp Tuyển',
    time: '10:30'
  },
  {
    day: 7,
    title: 'Báo cáo tuần KD',
    type: 'processing', // Xanh
    sender: 'Anh Hùng (KD)',
    receiver: 'Sếp Tuyển',
    time: '15:00'
  },
  {
    day: 15,
    title: 'Đối soát tồn kho',
    type: 'success',
    sender: 'Bộ phận Kho',
    receiver: 'Kế toán trưởng',
    time: '09:00'
  },
];

const ReportCalendar: React.FC = () => {
  const [selectedValue, setSelectedValue] = useState(() => dayjs());

  // Hàm render nội dung vào từng ô ngày trên lịch
  const dateCellRender = (value: Dayjs) => {
    const day = value.date();
    const month = value.month();
    const currentMonth = dayjs().month();

    // Chỉ hiển thị dữ liệu cho tháng hiện tại để tránh rối mắt
    if (month !== currentMonth) return null;

    const listData = REPORT_SCHEDULE.filter(item => item.day === day);

    return (
      <ul className="list-none p-0 m-0">
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status={item.type as any} title={item.title} />
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

  // Lọc dữ liệu cho ngày đang được chọn
  const selectedDayData = REPORT_SCHEDULE.filter(item => item.day === selectedValue.date());

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* HEADER MÀN HÌNH */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
        <div>
          <Title level={3} className="m-0">
            <CalendarOutlined className="mr-2 text-blue-600" />
            Lịch & Nhắc Báo Cáo
          </Title>
          <Text type="secondary">Tự động hóa lịch trình gửi và nhận báo cáo định kỳ</Text>
        </div>
        <div className="text-right">
          <Tag color="blue" className="px-3 py-1 rounded-full text-sm font-medium">
            Tháng {dayjs().format('MM/YYYY')}
          </Tag>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* CỘT TRÁI (Chiếm 2 phần): BỘ LỊCH CHÍNH */}
        <Card className="xl:col-span-2 shadow-sm rounded-xl overflow-hidden" styles={{ body: { padding: '12px' } }}>
          <Calendar
            fullscreen={true}
            cellRender={dateCellRender}
            onSelect={onSelect}
            headerRender={({ value, onChange }) => {
              return (
                <div className="p-4 flex justify-between items-center border-b mb-4">
                  <Title level={5} className="m-0">Bảng theo dõi kỳ báo cáo</Title>
                  <Space>
                    <Text strong className="bg-blue-50 px-3 py-1 rounded text-blue-700">
                      {value.format('MMMM, YYYY')}
                    </Text>
                  </Space>
                </div>
              );
            }}
          />
        </Card>

        {/* CỘT PHẢI (Chiếm 1 phần): CHI TIẾT NHẮC NHỞ */}
        <div className="space-y-6">
          <Card
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
                renderItem={(item) => (
                  <List.Item className="border-b last:border-0 px-0 py-4 block">
                    <div className="flex items-start justify-between mb-3">
                      <Space direction="vertical" size={0}>
                        <Text strong className="text-blue-700 text-lg">{item.title}</Text>
                        <Text type="secondary" className="text-xs">⏱ Thời hạn: {item.time} hôm nay</Text>
                      </Space>
                      <Tag color={item.type as any} className="m-0 uppercase text-[10px]">
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
          </Card>

          {/* <Alert
            message="Ghi chú hệ thống"
            description="Lịch báo cáo được tự động tạo dựa trên cấu trúc thư mục. Mọi thay đổi về thời hạn cần được Admin phê duyệt."
            type="info"
            showIcon
            className="rounded-xl"
          /> */}
        </div>
      </div>
    </div>
  );
};

export default ReportCalendar;