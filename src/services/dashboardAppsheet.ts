import dayjs from 'dayjs';
import type { TaskRecord } from '../types/task';
import { findAppsheetTasks } from './appsheetApi';
import { listAppsheetTableBindings, mapAppsheetRowsToTasksByDept } from './taskAppsheet';

export type DashboardTask = {
  id: string;
  deptKey: string;
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

function mapTaskRecordToDashboardTask(
  taskKey: string,
  deptKey: string,
  department: string,
  task: TaskRecord
): DashboardTask {
  const deadline = task.giaHan3 || task.giaHan2 || task.giaHan1 || task.ycXong;
  const status = task.tienDo || 'Chưa bắt đầu';

  return {
    id: `${deptKey}-${taskKey}`,
    deptKey,
    name: task.congViec || 'Công việc',
    department,
    status,
    impact: task.anhHuong || 1,
    isIssue: Boolean(task.vuongMac.trim()) || status === 'Quá hạn',
    assignee: task.nguoiGiao || '—',
    deadline: deadline || '—',
    week: resolveDashboardWeek(task.kyBaoCao, deadline),
    desc: task.ketQua || task.congViec || '',
    history: task.vuongMac || task.ketQua || '',
  };
}

export async function loadDashboardTasksFromAppsheet(): Promise<DashboardTask[]> {
  const bindings = listAppsheetTableBindings();
  const tasks: DashboardTask[] = [];

  await Promise.all(
    bindings.map(async binding => {
      try {
        const result = await findAppsheetTasks({ table: binding.table });
        const byDept = mapAppsheetRowsToTasksByDept(result.rows, result.table);
        const bucket = byDept[binding.deptKey] ?? {};

        Object.entries(bucket).forEach(([taskKey, task]) => {
          tasks.push(mapTaskRecordToDashboardTask(taskKey, binding.deptKey, binding.department, task));
        });
      } catch {
        // Bỏ qua bảng không đọc được để các phòng ban khác vẫn hiển thị.
      }
    })
  );

  return tasks.sort((left, right) => left.id.localeCompare(right.id));
}
