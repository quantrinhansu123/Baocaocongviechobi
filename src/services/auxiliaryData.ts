import { findDataRows } from './dataApi';

export const TABLE_CONG_NO = 'Công nợ';
export const TABLE_LICH_BAO_CAO = 'Lịch báo cáo';
export const TABLE_NGUOI_DUNG = 'Người dùng';
export const TABLE_MAU_BAO_CAO = 'Mẫu báo cáo';
export const TABLE_THU_MUC = 'Thư mục';
export const TABLE_PHAN_QUYEN = 'Phân quyền';
export const TABLE_BC_CHI_TIET = 'BC chi tiết';
export const TABLE_CANH_BAO = 'Cảnh báo';

function pickField(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined) {
      continue;
    }
    const text = String(value).trim();
    if (text) {
      return text;
    }
  }
  return '';
}

function pickNumber(row: Record<string, unknown>, key: string): number {
  const value = row[key];
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export type DebtRecord = {
  key: string;
  customer: string;
  trade: { total: number; collected: number; overdue: number };
  oem: { total: number; collected: number; overdue: number };
};

export type CalendarScheduleItem = {
  key: string;
  day: number;
  month: number;
  title: string;
  type: string;
  sender: string;
  receiver: string;
  time: string;
};

export type AdminUser = {
  key: string;
  name: string;
  email: string;
  department: string;
  role: string;
};

export type AdminTemplate = {
  key: string;
  name: string;
  type: string;
  lastUpdate: string;
  status: string;
};

export type FolderNode = {
  title: string;
  key: string;
  children?: FolderNode[];
};

export type PermissionRow = {
  key: string;
  feature: string;
  read: boolean;
  write: boolean;
  delete: boolean;
  approve: boolean;
};

export type ReportDetailTask = {
  key: string;
  reportId: string;
  name: string;
  deadline: string;
  status: string;
  priority: number;
  description?: string;
  owner?: string;
  sourceRow?: Record<string, unknown>;
};

export type WorkReportTask = {
  id: number;
  name: string;
  assignee: string;
  deadline: string;
  status: string;
  impact: number;
  desc: string;
  history: string;
};

function mapDebtRow(row: Record<string, unknown>): DebtRecord {
  const trade = (row.trade as Record<string, unknown>) ?? {};
  const oem = (row.oem as Record<string, unknown>) ?? {};
  const key = pickField(row, ['id', 'key']) || 'row';
  return {
    key,
    customer: pickField(row, ['customer', 'Khách hàng']),
    trade: {
      total: pickNumber(trade, 'total'),
      collected: pickNumber(trade, 'collected'),
      overdue: pickNumber(trade, 'overdue'),
    },
    oem: {
      total: pickNumber(oem, 'total'),
      collected: pickNumber(oem, 'collected'),
      overdue: pickNumber(oem, 'overdue'),
    },
  };
}

export async function loadDebtRecords(): Promise<DebtRecord[]> {
  const result = await findDataRows({ table: TABLE_CONG_NO });
  return result.rows.map(mapDebtRow);
}

export async function loadCalendarSchedule(): Promise<CalendarScheduleItem[]> {
  const result = await findDataRows({ table: TABLE_LICH_BAO_CAO });
  return result.rows.map(row => ({
    key: pickField(row, ['id', 'key']),
    day: pickNumber(row, 'day'),
    month: pickNumber(row, 'month') || new Date().getMonth(),
    title: pickField(row, ['title', 'Tên']),
    type: pickField(row, ['type', 'Loại']) || 'processing',
    sender: pickField(row, ['sender', 'Người gửi']),
    receiver: pickField(row, ['receiver', 'Người nhận']),
    time: pickField(row, ['time', 'Giờ']),
  }));
}

export async function loadAdminUsers(): Promise<AdminUser[]> {
  const result = await findDataRows({ table: TABLE_NGUOI_DUNG });
  return result.rows.map(row => ({
    key: pickField(row, ['id', 'key']),
    name: pickField(row, ['name', 'Tên']),
    email: pickField(row, ['email', 'Email']),
    department: pickField(row, ['department', 'Phòng ban']),
    role: pickField(row, ['role', 'Vai trò']),
  }));
}

export async function loadAdminTemplates(): Promise<AdminTemplate[]> {
  const result = await findDataRows({ table: TABLE_MAU_BAO_CAO });
  return result.rows.map(row => ({
    key: pickField(row, ['id', 'key']),
    name: pickField(row, ['name', 'Tên']),
    type: pickField(row, ['type', 'Định dạng']),
    lastUpdate: pickField(row, ['lastUpdate', 'Cập nhật']),
    status: pickField(row, ['status', 'Trạng thái']),
  }));
}

function buildFolderTree(rows: Record<string, unknown>[]): FolderNode[] {
  const nodes = new Map<string, FolderNode & { parentId?: string }>();
  for (const row of rows) {
    const key = pickField(row, ['id', 'key']);
    if (!key) {
      continue;
    }
    nodes.set(key, {
      key,
      title: pickField(row, ['title', 'Tên']),
      parentId: pickField(row, ['parentId', 'parentKey', 'Cha']),
      children: [],
    });
  }

  const roots: FolderNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      const parent = nodes.get(node.parentId)!;
      parent.children = parent.children ?? [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function loadFolderTree(): Promise<FolderNode[]> {
  const result = await findDataRows({ table: TABLE_THU_MUC });
  return buildFolderTree(result.rows);
}

export async function loadPermissions(): Promise<PermissionRow[]> {
  const result = await findDataRows({ table: TABLE_PHAN_QUYEN });
  return result.rows.map(row => ({
    key: pickField(row, ['id', 'key']),
    feature: pickField(row, ['feature', 'Tính năng']),
    read: Boolean(row.read),
    write: Boolean(row.write),
    delete: Boolean(row.delete),
    approve: Boolean(row.approve),
  }));
}

export async function loadSystemWarnings(): Promise<string[]> {
  const result = await findDataRows({ table: TABLE_CANH_BAO });
  return result.rows
    .map(row => pickField(row, ['message', 'Nội dung', 'title']))
    .filter(Boolean);
}

export async function loadReportDetailTasks(reportId?: string): Promise<ReportDetailTask[]> {
  const result = await findDataRows({ table: TABLE_BC_CHI_TIET });
  return result.rows
    .map(row => ({
      key: pickField(row, ['id', 'key']),
      reportId: pickField(row, ['reportId', 'Báo cáo']),
      name: pickField(row, ['name', 'Tên công việc']),
      deadline: pickField(row, ['deadline', 'Hạn chót']),
      status: pickField(row, ['status', 'Trạng thái']),
      priority: pickNumber(row, 'priority') || pickNumber(row, 'Ảnh hưởng') || 1,
      description: pickField(row, ['description', 'Mô tả']),
      owner: pickField(row, ['owner', 'Người phụ trách']),
      sourceRow: row,
    }))
    .filter(task => !reportId || task.reportId === reportId);
}

export async function loadWorkReportTasks(): Promise<WorkReportTask[]> {
  const tasks = await loadReportDetailTasks();
  return tasks.map((task, index) => ({
    id: index + 1,
    name: task.name,
    assignee: task.owner || '—',
    deadline: task.deadline,
    status: task.status,
    impact: task.priority,
    desc: task.description || task.name,
    history: task.description || '',
  }));
}
