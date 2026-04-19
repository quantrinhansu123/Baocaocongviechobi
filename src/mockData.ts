import { Tag, Badge } from 'antd';
import React from 'react';

export const KPI_DATA = {
  totalTasks: 128,
  completed: 85,
  overdue: 12,
  critical: 5,
};

export const TOP_OVERDUE_TASKS = [
  { key: '1', name: 'Báo cáo sản lượng Nhà máy A', owner: 'Nguyễn Văn Hùng', deadline: '2026-04-10', priority: 5 },
  { key: '2', name: 'Kiểm kê kho OEM tháng 3', owner: 'Trần Thị Mai', deadline: '2026-04-12', priority: 4 },
  { key: '3', name: 'Phê duyệt kế hoạch quý 2', owner: 'Lê Hoàng Tuyển', deadline: '2026-04-14', priority: 5 },
  { key: '4', name: 'Đối soát công nợ đối tác X', owner: 'Phạm Minh Tuấn', deadline: '2026-04-14', priority: 3 },
  { key: '5', name: 'Cập nhật tiến độ dự án Y', owner: 'Hoàng Anh Đức', deadline: '2026-04-15', priority: 4 },
];

export const TODAY_SCHEDULE = [
  { time: '08:00', title: 'Họp giao ban sáng', type: 'meeting' },
  { time: '10:30', title: 'Nộp báo cáo doanh thu tuần', type: 'report' },
  { time: '14:00', title: 'Kiểm tra tiến độ nhà máy', type: 'inspection' },
  { time: '16:30', title: 'Phê duyệt chứng từ OEM', type: 'approval' },
];

export const TREE_DATA = [
  {
    title: 'Nhà máy',
    key: '0-0',
    children: [
      { title: 'Sản xuất', key: '0-0-0', overdue: 2 },
      { title: 'Kỹ thuật', key: '0-0-1', overdue: 0 },
      { title: 'QC', key: '0-0-2', overdue: 1 },
    ],
  },
  {
    title: 'OEM',
    key: '0-1',
    children: [
      { title: 'Đối tác miền Bắc', key: '0-1-0', overdue: 3 },
      { title: 'Đối tác miền Nam', key: '0-1-1', overdue: 0 },
    ],
  },
  {
    title: 'Báo cáo định kỳ',
    key: '0-2',
    children: [
      { title: 'Báo cáo Tuần', key: '0-2-0', overdue: 5 },
      { title: 'Báo cáo Tháng', key: '0-2-1', overdue: 2 },
    ],
  },
];

export const REPORT_LIST = [
  { key: '1', name: 'Báo cáo sản lượng tuần 15', cycle: 'Tuần', deadline: '2026-04-15', status: 'Chưa nộp', owner: 'Hùng NV' },
  { key: '2', name: 'Báo cáo tồn kho tháng 3', cycle: 'Tháng', deadline: '2026-04-10', status: 'Trễ', owner: 'Mai TT' },
  { key: '3', name: 'Báo cáo doanh số quý 1', cycle: 'Quý', deadline: '2026-03-31', status: 'Đã nộp', owner: 'Tuyển LH' },
  { key: '4', name: 'Báo cáo chi phí vận hành', cycle: 'Tháng', deadline: '2026-04-20', status: 'Chưa nộp', owner: 'Tuấn PM' },
];

export const TASK_DETAILS = [
  { key: '1', name: 'Kiểm tra dây chuyền số 1', deadline: '2026-04-16', status: 'Đang làm', priority: 4 },
  { key: '2', name: 'Họp với nhà cung cấp vật tư', deadline: '2026-04-17', status: 'Chờ xử lý', priority: 5 },
  { key: '3', name: 'Hoàn thiện hồ sơ nghiệm thu', deadline: '2026-04-15', status: 'Hoàn thành', priority: 3 },
];

export const SMART_VIEW_DEBT = [
  {
    key: '1',
    customer: 'Công ty A',
    trade: { total: 500, collected: 400, overdue: 100 },
    oem: { total: 200, collected: 150, overdue: 50 },
  },
  {
    key: '2',
    customer: 'Công ty B',
    trade: { total: 800, collected: 800, overdue: 0 },
    oem: { total: 300, collected: 200, overdue: 100 },
  },
];

export const USER_LIST = [
  { key: '1', name: 'Lê Hoàng Tuyển', email: 'tuyen.lh@company.com', role: 'Admin' },
  { key: '2', name: 'Nguyễn Văn Hùng', email: 'hung.nv@company.com', role: 'Manager' },
  { key: '3', name: 'Trần Thị Mai', email: 'mai.tt@company.com', role: 'User' },
];
