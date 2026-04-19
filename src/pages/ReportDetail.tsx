import React, { useState } from 'react';
import {
  Table as AntTable,
  Typography as AntTypography,
  Space as AntSpace,
  Checkbox as AntCheckbox,
  Tag as AntTag,
  Rate as AntRate,
  DatePicker as AntDatePicker,
  Select as AntSelect,
  Button as AntButton,
  Drawer as AntDrawer,
  Tabs as AntTabs,
  List as AntList,
  Avatar as AntAvatar,
  Timeline as AntTimeline,
  Input as AntInput,
  Breadcrumb as AntBreadcrumb,
  Progress as AntProgress,
  Modal as AntModal,
  Form as AntForm,
} from 'antd';
import * as Antd from 'antd';
const AntCard = Antd.Card as any;
import {
  SendOutlined,
  UserOutlined,
  MessageOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  FilePdfOutlined,
  SaveOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { TASK_DETAILS } from '../mockData';

const { Title, Text } = AntTypography;
const { TextArea } = AntInput;

const ReportDetail: React.FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [form] = AntForm.useForm();

  const columns = [
    {
      title: 'Tên công việc',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Text
          strong
          className="text-[#1677ff] cursor-pointer hover:underline"
          onClick={() => {
            setSelectedTask(record);
            setDrawerVisible(true);
          }}
        >
          {text}
        </Text>
      ),
    },
    {
      title: 'Hạn chót',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date: string) => (
        <AntDatePicker
          defaultValue={dayjs(date)}
          format="YYYY-MM-DD"
          variant="borderless"
          className="p-0 hover:bg-gray-100 rounded px-2"
        />
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <AntSelect
          defaultValue={status}
          variant="borderless"
          className="w-32"
          options={[
            { value: 'Chờ xử lý', label: <AntTag color="default">Chờ xử lý</AntTag> },
            { value: 'Đang làm', label: <AntTag color="processing">Đang làm</AntTag> },
            { value: 'Hoàn thành', label: <AntTag color="success">Hoàn thành</AntTag> },
          ]}
        />
      ),
    },
    {
      title: 'Ảnh hưởng',
      dataIndex: 'priority',
      key: 'priority',
      render: (stars: number) => <AntRate defaultValue={stars} style={{ fontSize: 14 }} />,
    },
  ];

  const handleCreateTask = (values: any) => {
    console.log('New Task:', values);
    setCreateModalVisible(false);
    form.resetFields();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <AntBreadcrumb
            items={[
              { title: 'Nhà máy' },
              { title: 'Báo cáo định kỳ' },
              { title: 'Báo cáo sản lượng tuần 15' },
            ]}
            className="mb-2"
          />
          <Title level={3} className="m-0">Báo cáo sản lượng tuần 15</Title>
        </div>
        <AntSpace>
          <AntButton icon={<FilePdfOutlined />}>Xuất báo cáo (PDF)</AntButton>
          <AntButton type="primary" icon={<SaveOutlined />} className="bg-ant-primary">Lưu thay đổi</AntButton>
        </AntSpace>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AntCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <Title level={5} className="m-0">Tiến độ tổng thể</Title>
            <Text strong className="text-ant-primary">65% Hoàn thành</Text>
          </div>
          <AntProgress percent={65} status="active" strokeColor="#fa8c16" />
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">Tổng việc</div>
              <div className="text-lg font-bold">12</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xs text-green-600 mb-1">Đã xong</div>
              <div className="text-lg font-bold text-green-700">8</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xs text-red-600 mb-1">Quá hạn</div>
              <div className="text-lg font-bold text-red-700">2</div>
            </div>
          </div>
        </AntCard>

        <AntCard title="Thông tin chung" className="h-full">
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <Text type="secondary">Người tạo:</Text>
              <Text strong>Admin Tuyển</Text>
            </div>
            <div className="flex justify-between">
              <Text type="secondary">Ngày tạo:</Text>
              <Text strong>10/04/2026</Text>
            </div>
            <div className="flex justify-between">
              <Text type="secondary">Hạn nộp:</Text>
              <Text strong className="text-red-500">18/04/2026</Text>
            </div>
            <div className="flex justify-between">
              <Text type="secondary">Phòng ban:</Text>
              <AntTag color="blue">Nhà máy sản xuất</AntTag>
            </div>
          </div>
        </AntCard>
      </div>

      <AntCard className="shadow-sm">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-ant-border">
          <AntSpace size="large">
            <AntCheckbox>Chỉ việc quan trọng</AntCheckbox>
            <AntCheckbox>Chỉ việc quá hạn</AntCheckbox>
            <div className="h-4 w-px bg-gray-300 hidden md:block" />
            <Text type="secondary">Đang hiển thị: {TASK_DETAILS.length} công việc</Text>
          </AntSpace>
          <AntButton
            type="primary"
            icon={<PlusOutlined />}
            className="bg-ant-primary"
            onClick={() => setCreateModalVisible(true)}
          >
            Thêm công việc mới
          </AntButton>
        </div>

        <AntTable
          dataSource={TASK_DETAILS}
          columns={columns}
          pagination={false}
          className="rounded-lg overflow-hidden"
        />
      </AntCard>

      {/* Modal Tạo việc mới */}
      <AntModal
        title="Thêm công việc mới vào báo cáo"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        okText="Tạo công việc"
        cancelText="Hủy"
        okButtonProps={{ className: 'bg-ant-primary' }}
      >
        <AntForm
          form={form}
          layout="vertical"
          onFinish={handleCreateTask}
          initialValues={{ priority: 3, status: 'Chờ xử lý' }}
          className="mt-4"
        >
          <AntForm.Item
            name="name"
            label="Tên công việc"
            rules={[{ required: true, message: 'Vui lòng nhập tên công việc' }]}
          >
            <AntInput placeholder="Ví dụ: Kiểm tra dây chuyền sản xuất số 1" />
          </AntForm.Item>

          <div className="grid grid-cols-2 gap-4">
            <AntForm.Item
              name="deadline"
              label="Hạn chót"
              rules={[{ required: true, message: 'Chọn hạn chót' }]}
            >
              <AntDatePicker className="w-full" />
            </AntForm.Item>
            <AntForm.Item name="priority" label="Mức độ ảnh hưởng">
              <AntRate />
            </AntForm.Item>
          </div>

          <AntForm.Item name="description" label="Mô tả chi tiết">
            <TextArea rows={4} placeholder="Nhập nội dung yêu cầu chi tiết..." />
          </AntForm.Item>

          <AntForm.Item name="owner" label="Người phụ trách">
            <AntSelect
              placeholder="Chọn người thực hiện"
              options={[
                { value: 'hungnv', label: 'Hùng NV' },
                { value: 'lannt', label: 'Lan NT' },
                { value: 'cuongdv', label: 'Cường DV' },
              ]}
            />
          </AntForm.Item>
        </AntForm>
      </AntModal>

      <AntDrawer
        title={
          <div className="flex items-center">
            <AntTag color="processing" className="mr-2">Task Detail</AntTag>
            <span>{selectedTask?.name}</span>
          </div>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={600}
      >
        <AntTabs
          defaultActiveKey="info"
          items={[
            {
              key: 'info',
              label: (
                <span>
                  <InfoCircleOutlined /> Thông tin
                </span>
              ),
              children: (
                <div className="space-y-6 pt-4">
                  <div>
                    <Text strong className="block mb-2">Mô tả công việc</Text>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-gray-600 leading-relaxed">
                      Cần thực hiện kiểm tra toàn bộ hệ thống dây chuyền số 1 trước khi bắt đầu ca sản xuất mới.
                      Đảm bảo các thông số kỹ thuật đạt chuẩn ISO 9001.
                      <br /><br />
                      <strong>Yêu cầu:</strong>
                      <ul className="list-disc ml-4 mt-2">
                        <li>Kiểm tra áp suất dầu</li>
                        <li>Vệ sinh bộ lọc khí</li>
                        <li>Ghi nhật ký vận hành</li>
                      </ul>
                    </div>
                  </div>
                  <div>
                    <Text strong className="block mb-2">File đính kèm</Text>
                    <AntList
                      size="small"
                      dataSource={['Huong_dan_van_hanh.pdf', 'Checklist_bao_tri.xlsx']}
                      renderItem={(item) => (
                        <AntList.Item className="flex justify-between">
                          <Text>{item}</Text>
                          <AntButton type="link" size="small">Tải về</AntButton>
                        </AntList.Item>
                      )}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              ),
            },
            {
              key: 'discussion',
              label: (
                <span>
                  <MessageOutlined /> Thảo luận & Lịch sử
                </span>
              ),
              children: (
                <div className="flex flex-col h-[calc(100vh-250px)]">
                  <div className="flex-1 overflow-auto pr-2">
                    <AntTimeline
                      className="mt-4"
                      items={[
                        {
                          color: 'green',
                          children: (
                            <div>
                              <Text strong>Hệ thống</Text>
                              <Text type="secondary" className="ml-2 text-xs">10:00 - 15/04</Text>
                              <p className="mt-1">Vừa sửa deadline từ <AntTag color="error">14/04</AntTag> sang <AntTag color="blue">16/04</AntTag></p>
                            </div>
                          ),
                        },
                        {
                          children: (
                            <div>
                              <AntSpace align="start">
                                <AntAvatar size="small" icon={<UserOutlined />} className="bg-blue-500" />
                                <div>
                                  <Text strong>Hùng NV</Text>
                                  <Text type="secondary" className="ml-2 text-xs">09:30 - 15/04</Text>
                                  <p className="mt-1">Tôi đã kiểm tra xong phần cơ khí, còn phần điện đang chờ kỹ thuật qua.</p>
                                </div>
                              </AntSpace>
                            </div>
                          ),
                        },
                      ]}
                    />
                  </div>
                  <div className="pt-4 border-t">
                    <TextArea
                      rows={3}
                      placeholder="Nhập phản hồi hoặc thảo luận..."
                      className="rounded-lg mb-2"
                    />
                    <div className="flex justify-end">
                      <AntButton type="primary" icon={<SendOutlined />} className="bg-ant-primary">
                        Gửi tin nhắn
                      </AntButton>
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </AntDrawer>
    </div>
  );
};

export default ReportDetail;
