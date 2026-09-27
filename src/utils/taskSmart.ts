import dayjs from 'dayjs';
import type { TaskMilestone } from '../types/task';
import { formatTaskDate, getEffectiveDueDate, parseTaskDate } from './taskDate';

export const DEFAULT_MILESTONE_LABELS = [
  'Tiếp nhận yêu cầu',
  'Khảo sát / lấy thông tin',
  'Gửi báo giá',
  'Theo dõi & chốt',
] as const;

export function createDefaultMilestones(): TaskMilestone[] {
  return DEFAULT_MILESTONE_LABELS.map((label, index) => ({
    id: `ms-default-${index + 1}`,
    label,
    done: false,
    required: true,
  }));
}

export function normalizeMilestones(raw: unknown): TaskMilestone[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const items: TaskMilestone[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Partial<TaskMilestone>;
    const label = String(record.label ?? '').trim();
    if (!label) continue;
    let id = String(record.id ?? '').trim();
    if (!id || seen.has(id)) {
      id = `ms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    }
    seen.add(id);
    items.push({
      id,
      label,
      done: Boolean(record.done),
      required: record.required !== false,
    });
  }
  return items;
}

export function parseMilestonesField(value: unknown): TaskMilestone[] {
  if (Array.isArray(value)) return normalizeMilestones(value);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    return normalizeMilestones(JSON.parse(value) as unknown);
  } catch {
    return [];
  }
}

export function milestonePercent(milestones: TaskMilestone[]): number {
  if (milestones.length === 0) return 0;
  const done = milestones.filter(item => item.done).length;
  return Math.round((done / milestones.length) * 100);
}

export type TaskHealthKey =
  | 'done'
  | 'overdue'
  | 'waiting_approval'
  | 'waiting_coord'
  | 'at_risk'
  | 'on_track'
  | 'paused'
  | 'cancelled';

export type TaskHealth = {
  key: TaskHealthKey;
  label: string;
  hint: string;
};

const HEALTH_LABEL: Record<TaskHealthKey, string> = {
  done: 'Đã hoàn thành',
  overdue: 'Quá hạn',
  waiting_approval: 'Chờ duyệt',
  waiting_coord: 'Chờ phối hợp',
  at_risk: 'Có nguy cơ trễ',
  on_track: 'Đúng tiến độ',
  paused: 'Tạm dừng',
  cancelled: 'Đã hủy',
};

function isBlankBlocker(value: string): boolean {
  const text = value.trim().toLowerCase();
  return !text || text === 'không' || text === 'khong' || text === 'không có' || text === 'khong co';
}

function dueHint(due: dayjs.Dayjs | null): string {
  if (!due) return '';
  const diff = due.startOf('day').diff(dayjs().startOf('day'), 'day');
  if (diff < 0) return `Quá hạn ${Math.abs(diff)} ngày`;
  if (diff === 0) return 'Đến hạn hôm nay';
  return `Còn ${diff} ngày`;
}

function progressIsLagging(input: {
  ngayGiao: string;
  due: dayjs.Dayjs | null;
  percent: number;
}): boolean {
  if (!input.due) return false;
  const start = parseTaskDate(input.ngayGiao);
  if (!start) return false;
  const total = Math.max(input.due.startOf('day').diff(start.startOf('day'), 'day'), 1);
  const elapsed = dayjs().startOf('day').diff(start.startOf('day'), 'day');
  if (elapsed <= 0) return false;
  const expected = Math.min(100, (elapsed / total) * 100);
  return expected >= 40 && input.percent + 20 < expected;
}

export function deriveTaskHealth(input: {
  tienDo?: string;
  completed?: boolean;
  ngayGiao?: string;
  ycXong?: string;
  giaHan1?: string;
  giaHan2?: string;
  giaHan3?: string;
  percent?: number;
  canLD?: string;
  vuongMac?: string;
  anhHuong?: number;
}): TaskHealth {
  const status = (input.tienDo || '').trim();
  const due = getEffectiveDueDate({
    deadline: input.ycXong || '',
    giaHan1: input.giaHan1,
    giaHan2: input.giaHan2,
    giaHan3: input.giaHan3,
  });
  const hint = dueHint(due);
  const percent = input.percent ?? 0;

  if (input.completed || status === 'Hoàn thành' || status.toLowerCase().includes('hoàn thành')) {
    return { key: 'done', label: HEALTH_LABEL.done, hint: '' };
  }
  if (status === 'Hủy' || status === 'Huỷ') {
    return { key: 'cancelled', label: HEALTH_LABEL.cancelled, hint };
  }
  if (status === 'Tạm dừng') {
    return { key: 'paused', label: HEALTH_LABEL.paused, hint };
  }

  const overdue =
    status === 'Quá hạn' ||
    (due ? dayjs().startOf('day').isAfter(due.startOf('day')) : false);
  if (overdue) {
    return { key: 'overdue', label: HEALTH_LABEL.overdue, hint: hint || 'Quá hạn' };
  }

  if ((input.canLD || '').trim() === 'Có') {
    return { key: 'waiting_approval', label: HEALTH_LABEL.waiting_approval, hint };
  }
  if (!isBlankBlocker(input.vuongMac || '')) {
    return { key: 'waiting_coord', label: HEALTH_LABEL.waiting_coord, hint };
  }

  const daysLeft = due ? due.startOf('day').diff(dayjs().startOf('day'), 'day') : null;
  const dueSoon = daysLeft !== null && daysLeft <= 3 && percent < 80;
  const highImpactLag = (input.anhHuong ?? 0) >= 3 && percent < 50 && daysLeft !== null && daysLeft <= 7;
  if (
    dueSoon ||
    highImpactLag ||
    progressIsLagging({ ngayGiao: input.ngayGiao || '', due, percent })
  ) {
    return { key: 'at_risk', label: HEALTH_LABEL.at_risk, hint };
  }

  return { key: 'on_track', label: HEALTH_LABEL.on_track, hint };
}

export function extensionReasonError(
  slots: Array<{ date?: unknown; reason?: unknown; label: string }>
): string | null {
  for (const slot of slots) {
    if (formatTaskDate(slot.date) && !String(slot.reason ?? '').trim()) {
      return `Nhập lý do cho ${slot.label}.`;
    }
  }
  return null;
}

export function completionBlockReason(input: {
  ketQua?: string;
  milestones?: TaskMilestone[];
  giaHan1?: unknown;
  lyDoGiaHan1?: unknown;
  giaHan2?: unknown;
  lyDoGiaHan2?: unknown;
  giaHan3?: unknown;
  lyDoGiaHan3?: unknown;
}): string | null {
  const reasonError = extensionReasonError([
    { date: input.giaHan1, reason: input.lyDoGiaHan1, label: 'gia hạn 1' },
    { date: input.giaHan2, reason: input.lyDoGiaHan2, label: 'gia hạn 2' },
    { date: input.giaHan3, reason: input.lyDoGiaHan3, label: 'gia hạn 3' },
  ]);
  if (reasonError) return reasonError;

  const milestones = input.milestones ?? [];
  const missing = milestones.filter(item => item.required && !item.done);
  if (missing.length > 0) {
    return `Còn mốc bắt buộc chưa xong: ${missing.map(item => item.label).join(', ')}.`;
  }
  if (!String(input.ketQua ?? '').trim()) {
    return 'Nhập kết quả cuối cùng trước khi hoàn thành công việc.';
  }
  return null;
}
