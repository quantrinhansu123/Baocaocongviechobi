import type { PersonnelRecord } from '../services/auxiliaryData';

const HEADERS = [
  'Họ tên',
  'Phòng ban',
  'Chức vụ',
  'Email',
  'SĐT',
  'Trạng thái',
  'Ngày vào',
] as const;

const SAMPLE_ROWS: string[][] = [
  ['Nguyễn Văn A', 'HCNS', 'Chuyên viên', 'a@hobiwood.com', '0901234567', 'Đang làm', '01/01/2024'],
  ['Trần Thị B', 'Ban IT', 'Trưởng nhóm', 'b@hobiwood.com', '0912345678', 'Thử việc', '15/03/2025'],
];

const STATUS_SET = new Set(['Đang làm', 'Thử việc', 'Nghỉ phép', 'Đã nghỉ']);

type SheetJsLike = {
  utils: {
    aoa_to_sheet: (data: unknown[][]) => unknown;
    book_new: () => unknown;
    book_append_sheet: (wb: unknown, ws: unknown, name: string) => void;
    sheet_to_json: (ws: unknown, opts?: { header?: number; defval?: string; raw?: boolean }) => Record<string, unknown>[];
  };
  write: (wb: unknown, opts: { bookType: string; type: string }) => ArrayBuffer;
  read: (data: ArrayBuffer, opts: { type: string }) => { SheetNames: string[]; Sheets: Record<string, unknown> };
};

declare global {
  interface Window {
    XLSX?: SheetJsLike;
  }
}

let sheetJsPromise: Promise<SheetJsLike> | null = null;

function loadSheetJs(): Promise<SheetJsLike> {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (sheetJsPromise) return sheetJsPromise;

  sheetJsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-hobi-xlsx]');
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.XLSX) resolve(window.XLSX);
        else reject(new Error('Không tải được thư viện Excel.'));
      });
      existing.addEventListener('error', () => reject(new Error('Không tải được thư viện Excel.')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    script.async = true;
    script.dataset.hobiXlsx = '1';
    script.onload = () => {
      if (window.XLSX) resolve(window.XLSX);
      else reject(new Error('Không tải được thư viện Excel.'));
    };
    script.onerror = () => reject(new Error('Không tải được thư viện Excel (CDN).'));
    document.head.appendChild(script);
  });

  return sheetJsPromise;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase();
}

function cell(row: Record<string, unknown>, aliases: string[]): string {
  const entries = Object.entries(row);
  for (const alias of aliases) {
    const want = normalizeHeader(alias);
    const hit = entries.find(([k]) => normalizeHeader(k) === want);
    if (hit) return String(hit[1] ?? '').trim();
  }
  return '';
}

function normalizeStatus(raw: string): string {
  const s = raw.trim();
  if (!s) return 'Đang làm';
  if (STATUS_SET.has(s)) return s;
  const lower = s.toLowerCase();
  if (lower.includes('thử')) return 'Thử việc';
  if (lower.includes('nghỉ phép') || lower.includes('nghi phep')) return 'Nghỉ phép';
  if (lower.includes('đã nghỉ') || lower.includes('nghi viec') || lower.includes('nghỉ việc')) {
    return 'Đã nghỉ';
  }
  return 'Đang làm';
}

export function newPersonnelImportId(): string {
  return `ns-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function downloadPersonnelExcelTemplate(): Promise<void> {
  const XLSX = await loadSheetJs();
  const aoa = [HEADERS as unknown as string[], ...SAMPLE_ROWS];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Nhan su');
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Mau_nhan_su_HOBI.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function parsePersonnelExcelFile(file: File): Promise<PersonnelRecord[]> {
  const XLSX = await loadSheetJs();
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: false,
  }) as Record<string, unknown>[];

  const records: PersonnelRecord[] = [];
  for (const row of rows) {
    const name = cell(row, ['Họ tên', 'Ho ten', 'Name', 'Tên', 'Ten']);
    if (!name) continue;
    const department = cell(row, ['Phòng ban', 'Phong ban', 'Department']);
    const position = cell(row, ['Chức vụ', 'Chuc vu', 'Position', 'Chức danh']);
    if (!department || !position) continue;

    records.push({
      key: newPersonnelImportId(),
      name,
      department,
      position,
      email: cell(row, ['Email', 'E-mail']),
      phone: cell(row, ['SĐT', 'SDT', 'Phone', 'Điện thoại', 'Dien thoai']),
      status: normalizeStatus(cell(row, ['Trạng thái', 'Trang thai', 'Status'])),
      joinDate: cell(row, ['Ngày vào', 'Ngay vao', 'Join date', 'Ngày vào làm']),
    });
  }

  return records;
}
