import React, { useEffect, useMemo, useState } from 'react';
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
  Spin,
  Empty,
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
  SaveOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useParams } from 'react-router-dom';
import { loadReportDetailTasks, type ReportDetailTask } from '../services/auxiliaryData';
import { loadReportById } from '../services/reportListData';

const { Title, Text } = AntTypography;
const { TextArea } = AntInput;

const ReportDetail: React.FC = () => {
  const { id } = useParams();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ReportDetailTask | null>(null);
  const [tasks, setTasks] = useState<ReportDetailTask[]>([]);
  const [reportName, setReportName] = useState('Báo cáo');
  const [loading, setLoading] = useState(true);
  const [form] = AntForm.useForm();

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [report, detailTasks] = await Promise.all([
          id ? loadReportById(id) : Promise.resolve(null),
          loadReportDetailTasks(id),
        ]);
        if (!active) {
          return;
        }
        setReportName(report?.name || report?.menuLabel || 'Báo cáo');
        setTasks(detailTasks);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [id]);

  const completedCount = useMemo(
    () => tasks.filter(task => task.status === 'Hoàn thành').length,
    [tasks]
  );
  const overdueCount = useMemo(
    () => tasks.filter(task => task.status === 'Trễ hạn' || task.status === 'Quá hạn').length,
    [tasks]
  );
  const progressPercent = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const columns = [
    {
      title: 'Tên công việc',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ReportDetailTask) => (
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
          defaultValue={dayjs(date, ['DD/MM/YYYY', 'YYYY-MM-DD'], true).isValid() ? dayjs(date, ['DD/MM/YYYY', 'YYYY-MM-DD'], true) : undefined}
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

  const handleCreateTask = (values: Record<string, unknown>) => {
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
              { title: reportName },
            ]}
            className="mb-2"
          />
          <Title level={3} className="m-0">{reportName}</Title>
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
            <Text strong className="text-ant-primary">{progressPercent}% Hoàn thành</Text>
          </div>
          <AntProgress percent={progressPercent} status="active" strokeColor="#fa8c16" />
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">Tổng việc</div>
              <div className="text-lg font-bold">{tasks.length}</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xs text-green-600 mb-1">Đã xong</div>
              <div className="text-lg font-bold text-green-700">{completedCount}</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xs text-red-600 mb-1">Quá hạn</div>
              <div className="text-lg font-bold text-red-700">{overdueCount}</div>
            </div>
          </div>
        </AntCard>

        <AntCard title="Thông tin chung" className="h-full">
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <Text type="secondary">Mã báo cáo:</Text>
              <Text strong>{id ?? '—'}</Text>
            </div>
            <div className="flex justify-between">
              <Text type="secondary">Tổng công việc:</Text>
              <Text strong>{tasks.length}</Text>
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
            <Text type="secondary">Đang hiển thị: {tasks.length} công việc</Text>
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

        <Spin spinning={loading}>
          {!loading && tasks.length === 0 ? (
            <Empty description="Chưa có công việc chi tiết trên Supabase (bảng bc_chi_tiet)" />
          ) : (
            <AntTable
              dataSource={tasks}
              columns={columns}
              pagination={false}
              rowKey="key"
              className="rounded-lg overflow-hidden"
            />
          )}
        </Spin>
      </AntCard>

      <AntModal
        title="Thêm công việc mới vào báo cáo"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        okText="Tạo công việc"
        cancelText="Hủy"
        okButtonProps={{ className: 'bg-ant-primary' }}
        forceRender
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
                      {selectedTask?.description || 'Chưa có mô tả.'}
                    </div>
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
                    <AntTimeline className="mt-4" items={[]} />
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
