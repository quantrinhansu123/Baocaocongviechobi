import dayjs from 'dayjs';
import { ORG_BLOCKS } from '../data/orgBlocks';
import type { TaskRecord } from '../types/task';
import { normalizeDisplayDate, calculateAutomaticStatus } from '../utils/taskDate';
import { findDataRows } from './dataApi';
import { isTaskRecordCompleted, listTaskTableBindings, mapRowsToTasksByDept } from './taskData';

export type DashboardChartStatus = 'Hoàn thành' | 'Đang làm' | 'Quá hạn';

export type DashboardChartRow = {
  name: string;
  shortName: string;
  deptKey: string;
  'Hoàn thành': number;
  'Đang làm': number;
  'Quá hạn': number;
  total: number;
};

const DEPT_KEY_TO_NAME = new Map<string, string>();
const DEPT_KEY_TO_BLOCK = new Map<string, { blockKey: string; blockLabel: string; order: number }>();
for (const [blockIndex, block] of ORG_BLOCKS.entries()) {
  for (const dept of block.depts) {
    DEPT_KEY_TO_NAME.set(dept.key, dept.name);
    DEPT_KEY_TO_BLOCK.set(dept.key, {
      blockKey: block.key,
      blockLabel: block.label,
      order: blockIndex,
    });
  }
}

export function normalizeDashboardChartStatus(status: string): DashboardChartStatus {
  const normalized = status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (normalized.includes('hoan thanh')) {
    return 'Hoàn thành';
  }

  if (normalized === 'qua han' || normalized.includes('tre han')) {
    return 'Quá hạn';
  }

  return 'Đang làm';
}

function shortenDeptLabel(name: string): string {
  const shortened = name
    .replace(/^PHÒNG\s+/i, 'P.')
    .replace(/^NHÀ MÁY\s+/i, 'NM ')
    .replace(/^CHI NHÁNH\s+/i, 'CN ')
    .replace(/^CÔNG VIỆC\s+/i, 'CV ')
    .replace(/^DANH MỤC\s+/i, 'DM ')
    .trim();

  if (shortened.length > 24) {
    return `${shortened.slice(0, 22)}…`;
  }
  return shortened;
}

const BLOCK_ROMAN = ['I', 'II', 'III', 'IV'] as const;

function abbreviateBlockLabel(label: string): string {
  if (label.includes('LÃNH ĐẠO')) return 'BLĐ';
  if (label.includes('THƯƠNG MẠI')) return 'TM';
  if (label.includes('SẢN XUẤT')) return 'SX';
  if (label.includes('MUA')) return 'MUA';
  return label.slice(0, 10);
}

export function buildDashboardChartData(tasks: DashboardTask[]): DashboardChartRow[] {
  const grouped = new Map<string, DashboardChartRow>();

  for (const task of tasks) {
    const chartStatus = normalizeDashboardChartStatus(task.status);
    let row = grouped.get(task.deptKey);

    if (!row) {
      const fullName = DEPT_KEY_TO_NAME.get(task.deptKey) ?? task.department;
      row = {
        name: fullName,
        shortName: shortenDeptLabel(fullName),
        deptKey: task.deptKey,
        'Hoàn thành': 0,
        'Đang làm': 0,
        'Quá hạn': 0,
        total: 0,
      };
      grouped.set(task.deptKey, row);
    }

    row[chartStatus] += 1;
    row.total += 1;
  }

  return Array.from(grouped.values())
    .filter(row => row.total > 0)
    .sort(
      (left, right) => right.total - left.total || left.name.localeCompare(right.name, 'vi')
    );
}

export function buildDashboardStatusSummary(
  tasks: DashboardTask[]
): Record<DashboardChartStatus, number> {
  const summary: Record<DashboardChartStatus, number> = {
    'Hoàn thành': 0,
    'Đang làm': 0,
    'Quá hạn': 0,
  };

  for (const task of tasks) {
    summary[normalizeDashboardChartStatus(task.status)] += 1;
  }

  return summary;
}

/** Gộp theo khối (I–IV) — dễ đọc khi có nhiều phòng ban. */
export function buildDashboardBlockChartData(tasks: DashboardTask[]): DashboardChartRow[] {
  const grouped = new Map<string, DashboardChartRow>();
  const blockOrder = new Map<string, number>();

  ORG_BLOCKS.forEach((block, index) => {
    blockOrder.set(block.key, index);
    grouped.set(block.key, {
      name: block.label,
      shortName: `${BLOCK_ROMAN[index]}. ${abbreviateBlockLabel(block.label)}`,
      deptKey: block.key,
      'Hoàn thành': 0,
      'Đang làm': 0,
      'Quá hạn': 0,
      total: 0,
    });
  });

  for (const task of tasks) {
    const blockMeta = DEPT_KEY_TO_BLOCK.get(task.deptKey);
    const blockKey = blockMeta?.blockKey ?? 'unknown';
    let row = grouped.get(blockKey);

    if (!row && blockMeta) {
      row = {
        name: blockMeta.blockLabel,
        shortName: blockMeta.blockLabel.slice(0, 22),
        deptKey: blockKey,
        'Hoàn thành': 0,
        'Đang làm': 0,
        'Quá hạn': 0,
        total: 0,
      };
      grouped.set(blockKey, row);
    }

    if (!row) {
      continue;
    }

    const chartStatus = normalizeDashboardChartStatus(task.status);
    row[chartStatus] += 1;
    row.total += 1;
  }

  return Array.from(grouped.values())
    .filter(row => row.total > 0)
    .sort(
      (left, right) =>
        (blockOrder.get(left.deptKey) ?? 99) - (blockOrder.get(right.deptKey) ?? 99) ||
        right.total - left.total
    );
}

export type DashboardTask = {
  id: string;
  taskKey: string;
  deptKey: string;
  blockKey: string;
  table: string;
  name: string;
  department: string;
  status: string;
  impact: number;
  isIssue: boolean;
  assignee: string;
  deadline: string;
  week: string;
  desc: string;
  history: string;
  ngayGiao: string;
  ycXong: string;
  giaHan1: string;
  giaHan2: string;
  giaHan3: string;
  ketQua: string;
  linkKQ: string;
  tienDo: string;
  tienDoPhanTram: number;
  vuongMac: string;
  canLD: string;
  ngayHoanThanh: string;
  rowKey?: string | null;
  sourceRow?: Record<string, unknown>;
};

function weekKeyFromDate(dateStr: string): string {
  const date = dayjs(dateStr, 'DD/MM/YYYY', true);
  if (!date.isValid()) {
    return 'all';
  }

  let start = dayjs('2026-01-04');
  for (let week = 1; week <= 52; week += 1) {
    const end = start.add(6, 'day');
    if (!date.isBefore(start, 'day') && !date.isAfter(end, 'day')) {
      return `week_${week}`;
    }
    start = start.add(7, 'day');
  }

  return 'all';
}

function resolveDashboardWeek(kyBaoCao: string, deadline: string): string {
  const period = kyBaoCao.trim();
  if (/^week_\d+$/i.test(period)) {
    return period.toLowerCase();
  }

  const match = period.match(/tuần\s*(\d+)/i);
  if (match) {
    return `week_${match[1]}`;
  }

  return weekKeyFromDate(deadline);
}

function resolveBlockKey(deptKey: string): string {
  for (const block of ORG_BLOCKS) {
    if (block.depts.some(dept => dept.key === deptKey)) {
      return block.key;
    }
  }
  return '';
}

function mapTaskRecordToDashboardTask(
  taskKey: string,
  deptKey: string,
  department: string,
  table: string,
  task: TaskRecord
): DashboardTask {
  const deadline = normalizeDisplayDate(task.giaHan3 || task.giaHan2 || task.giaHan1 || task.ycXong);
  // Ưu tiên TIẾN ĐỘ đã lưu (để form sửa Trạng thái có hiệu lực); không thì mới tự tính.
  const storedTienDo = (task.tienDo || '').trim();
  let status: string;
  if (
    storedTienDo === 'Đang làm' ||
    storedTienDo === 'Hoàn thành' ||
    storedTienDo === 'Quá hạn' ||
    storedTienDo.toLowerCase().includes('gia hạn') ||
    storedTienDo === 'Đang thực hiện'
  ) {
    status = storedTienDo === 'Đang thực hiện' ? 'Đang làm' : storedTienDo;
  } else if (isTaskRecordCompleted(task)) {
    status = 'Hoàn thành';
  } else {
    status = calculateAutomaticStatus({
      deadline: task.ycXong,
      giaHan1: task.giaHan1,
      giaHan2: task.giaHan2,
      giaHan3: task.giaHan3,
      ngayHoanThanh: task.ngayGioHoanThanh,
    });
  }

  return {
    id: `${deptKey}-${taskKey}`,
    taskKey,
    deptKey,
    blockKey: resolveBlockKey(deptKey),
    table,
    name: task.congViec || task.ketQua || (task.stt ? `CV #${task.stt}` : 'Công việc'),
    department,
    status,
    impact: task.anhHuong || 1,
    isIssue: Boolean(task.vuongMac.trim()) || status === 'Quá hạn',
    assignee: task.nguoiGiao || '—',
    deadline: deadline || '—',
    week: resolveDashboardWeek(task.kyBaoCao, deadline),
    desc: task.ketQua || task.congViec || '',
    history: task.vuongMac || task.ketQua || '',
    ngayGiao: task.ngayGiao || '',
    ycXong: task.ycXong || '',
    giaHan1: task.giaHan1 || '',
    giaHan2: task.giaHan2 || '',
    giaHan3: task.giaHan3 || '',
    ketQua: task.ketQua || '',
    linkKQ: task.linkKQ || '',
    tienDo: task.tienDo || '',
    tienDoPhanTram: task.tienDoPhanTram ?? 0,
    vuongMac: task.vuongMac || '',
    canLD: task.canLD || 'Không',
    ngayHoanThanh: task.ngayGioHoanThanh || '',
    rowKey: task.rowKey,
    sourceRow: task.sourceRow,
  };
}

const TASKS_CACHE_TTL_MS = 30_000;
let cachedDashboardTasks: DashboardTask[] | null = null;
let cachedDashboardTasksAt = 0;
let dashboardTasksInflight: Promise<DashboardTask[]> | null = null;

export function invalidateDashboardTasksCache() {
  cachedDashboardTasks = null;
  cachedDashboardTasksAt = 0;
  dashboardTasksInflight = null;
}

async function fetchDashboardTasks(): Promise<DashboardTask[]> {
  const bindings = listTaskTableBindings();
  const tasks: DashboardTask[] = [];

  await Promise.all(
    bindings.map(async binding => {
      try {
        const result = await findDataRows({ table: binding.table });
        const byDept = mapRowsToTasksByDept(result.rows, result.table);

        Object.entries(byDept).forEach(([deptKey, bucket]) => {
          const department = DEPT_KEY_TO_NAME.get(deptKey) ?? binding.department;

          Object.entries(bucket).forEach(([taskKey, task]) => {
            tasks.push(
              mapTaskRecordToDashboardTask(taskKey, deptKey, department, result.table || binding.table, task)
            );
          });
        });
      } catch {
        // Bỏ qua bảng không đọc được để các phòng ban khác vẫn hiển thị.
      }
    })
  );

  return tasks.sort((left, right) => left.id.localeCompare(right.id));
}

/** Dùng chung 1 request giữa layout/dashboard; `force` để tải lại sau khi sửa task. */
export async function loadDashboardTasks(options?: { force?: boolean }): Promise<DashboardTask[]> {
  const force = Boolean(options?.force);
  const now = Date.now();

  if (
    !force &&
    cachedDashboardTasks &&
    now - cachedDashboardTasksAt < TASKS_CACHE_TTL_MS
  ) {
    return cachedDashboardTasks;
  }

  if (!force && dashboardTasksInflight) {
    return dashboardTasksInflight;
  }

  const request = fetchDashboardTasks()
    .then(tasks => {
      cachedDashboardTasks = tasks;
      cachedDashboardTasksAt = Date.now();
      return tasks;
    })
    .finally(() => {
      if (dashboardTasksInflight === request) {
        dashboardTasksInflight = null;
      }
    });

  dashboardTasksInflight = request;
  return request;
}
