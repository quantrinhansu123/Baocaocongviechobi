import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  App as AntdApp,
  Typography,
  Tag,
  Select,
  Spin,
  Tabs,
  Input,
  Avatar,
  Button,
  Modal,
  Form,
  DatePicker,
  Popconfirm,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  LinkOutlined,
  SearchOutlined,
  LeftOutlined,
  RightOutlined,
  MenuOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addAppsheetTask, deleteAppsheetTask, editAppsheetTask, findAppsheetTasks } from '../services/appsheetApi';
import { loadReportCatalog } from '../services/reportCatalog';
import {
  findReportGroup,
  listPeriodsForBlock,
  listPeriodsForGroup,
  parseBlockKeyFromGroupParam,
} from '../data/reportNavigation';
import {
  buildAppsheetReportDeleteRow,
  buildAppsheetReportEditRow,
  buildAppsheetReportRow,
  getNextReportRowNumber,
  getReportAppsheetTableName,
  kyLabelFromPeriodLabel,
} from '../services/reportAppsheet';
import { hasAppsheetRowKey } from '../services/appsheetRowKey';
import type { ReportCatalog, ReportGroupRecord, ReportRecord } from '../types/report';
import ReportMobileCards from '../components/ReportMobileCards';
import { useMobileShell } from '../contexts/MobileShellContext';
import { formatAppsheetDate, formatTaskDate, normalizeDisplayDate } from '../utils/taskDate';

const { Text } = Typography;

function parseFormDate(value: string): dayjs.Dayjs | undefined {
  if (!value.trim()) {
    return undefined;
  }
  const parsed = dayjs(value.trim(), ['DD/MM/YYYY', 'D/M/YYYY'], true);
  return parsed.isValid() ? parsed : undefined;
}

type WeekOption = {
  value: string;
  label: string;
  shortLabel: string;
};

const generateWeeks = (): WeekOption[] => {
  const weeks: WeekOption[] = [];
  let start = dayjs('2026-01-04');
  for (let i = 1; i <= 52; i++) {
    const end = start.add(6, 'day');
    weeks.push({
      value: `week_${i}`,
      label: `Tuần ${i}  (${start.format('DD/MM')} - ${end.format('DD/MM')})`,
      shortLabel: `Tuần ${i} · ${start.format('DD')}–${end.format('DD/MM')}`,
    });
    start = start.add(7, 'day');
  }
  return weeks;
};

const WEEK_OPTIONS = generateWeeks();

function senderInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed === '—') {
    return '?';
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function breadcrumbBlockLabel(blockLabel: string): string {
  return blockLabel.replace(/^\s*[IVXLCDM]+\.?\s+/i, '').trim() || blockLabel;
}

function stripLeadingIndex(label: string): string {
  return label.replace(/^\d+\.\s*/, '').trim() || label;
}

type ReportTableProps = {
  rows: ReportRecord[];
  selectedKey?: string;
  onRowClick: (report: ReportRecord) => void;
  emptyExtra?: React.ReactNode;
  showRowActions?: boolean;
  supabaseConnected?: boolean;
  deletingKey?: string | null;
  onEdit?: (report: ReportRecord) => void;
  onDelete?: (report: ReportRecord) => void;
};

function ReportTable({
  rows,
  selectedKey,
  onRowClick,
  emptyExtra,
  showRowActions,
  supabaseConnected,
  deletingKey,
  onEdit,
  onDelete,
}: ReportTableProps) {
  if (rows.length === 0) {
    return (
      <div className="px-6 py-16 text-center text-gray-400 text-sm space-y-4">
        <p className="m-0">Chưa có báo cáo trong kỳ này.</p>
        {emptyExtra}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
            {(showRowActions
              ? ['#', 'TÊN BÁO CÁO', 'NỘI DUNG', 'NGÀY TẠO BÁO CÁO', 'NGÀY GỬI', 'KỲ', 'NGƯỜI GỬI', 'NGƯỜI NHẬN', 'LINK', 'THAO TÁC']
              : ['#', 'TÊN BÁO CÁO', 'NỘI DUNG', 'NGÀY TẠO BÁO CÁO', 'NGÀY GỬI', 'KỲ', 'NGƯỜI GỬI', 'NGƯỜI NHẬN', '']
            ).map(header => (
              <th
                key={header || 'link'}
                className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((report, index) => {
            const isSelected = selectedKey === report.key;
            return (
              <tr
                key={report.key}
                onClick={() => onRowClick(report)}
                className={`cursor-pointer border-b border-gray-100 transition-colors ${
                  isSelected ? 'bg-orange-50/80' : 'hover:bg-slate-50'
                }`}
              >
                <td className="px-4 py-4 text-gray-500 font-medium align-top">{index + 1}</td>
                <td className="px-4 py-4 font-semibold text-[#1E386B] align-top min-w-[200px] max-w-[280px]">
                  <span className="leading-snug break-words">{report.name}</span>
                </td>
                <td className="px-4 py-4 text-gray-600 align-top min-w-[220px] max-w-[360px]">
                  <span className="leading-relaxed break-words whitespace-normal">{report.noidung || '—'}</span>
                </td>
                <td className="px-4 py-4 align-top text-xs whitespace-nowrap min-w-[120px]">
                  {report.ngayTaoBaoCao ? (
                    <Tag className="m-0 rounded-md border-0 bg-emerald-50 text-emerald-800 px-2 py-0.5 text-xs font-medium">
                      {normalizeDisplayDate(report.ngayTaoBaoCao)}
                    </Tag>
                  ) : (
                    <Text type="secondary">—</Text>
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                  {report.ngay ? (
                    <Tag className="m-0 rounded-md border-0 bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
                      {normalizeDisplayDate(report.ngay)}
                    </Tag>
                  ) : (
                    <Text type="secondary">—</Text>
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                  {report.ky ? (
                    <Tag className="m-0 rounded-md border-0 bg-violet-50 text-violet-700 px-2 py-0.5 text-xs font-medium">
                      {report.ky}
                    </Tag>
                  ) : (
                    <Text type="secondary">—</Text>
                  )}
                </td>
                <td className="px-4 py-4 align-top min-w-[140px]">
                  {report.nguoiGui ? (
                    <div className="flex items-center gap-2">
                      <Avatar size={28} className="bg-[#F38320] text-[10px] font-bold shrink-0">
                        {senderInitials(report.nguoiGui)}
                      </Avatar>
                      <span className="text-gray-800 text-xs leading-snug break-words">{report.nguoiGui}</span>
                    </div>
                  ) : (
                    <Text type="secondary">—</Text>
                  )}
                </td>
                <td className="px-4 py-4 text-gray-700 align-top text-xs leading-snug break-words min-w-[120px]">
                  {report.nguoiNhan || '—'}
                </td>
                <td className="px-4 py-4 align-top text-center">
                  {report.link ? (
                    <a
                      href={report.link}
                      target="_blank"
                      rel="noreferrer"
                      onClick={event => event.stopPropagation()}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-[#1E386B] hover:bg-orange-100"
                      title="Mở link báo cáo"
                    >
                      <LinkOutlined />
                    </a>
                  ) : null}
                </td>
                {showRowActions ? (
                  <td className="px-4 py-4 align-top text-center whitespace-nowrap">
                    <div
                      className="inline-flex items-center justify-center gap-0.5"
                      onClick={event => event.stopPropagation()}
                    >
                      <Button
                        type="text"
                        size="small"
                        className="!px-1"
                        icon={<EditOutlined />}
                        title="Sửa"
                        disabled={!supabaseConnected || !report.sourceRow}
                        onClick={() => onEdit?.(report)}
                      />
                      <Popconfirm
                        title="Xoá báo cáo này?"
                        okText="Xoá"
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true, loading: deletingKey === report.key }}
                        onConfirm={() => onDelete?.(report)}
                        disabled={!supabaseConnected || !report.sourceRow}
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          className="!px-1"
                          icon={<DeleteOutlined />}
                          title="Xóa"
                          loading={deletingKey === report.key}
                          disabled={!supabaseConnected || !report.sourceRow}
                        />
                      </Popconfirm>
                    </div>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const NavigationHub: React.FC = () => {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const { openMenu } = useMobileShell();
  const [searchParams] = useSearchParams();
  const [catalog, setCatalog] = useState<ReportCatalog>({ reports: {}, blocks: [], groups: [] });
  const [reportsLoading, setReportsLoading] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [selectedWeek, setSelectedWeek] = useState('week_16');
  const [searchText, setSearchText] = useState('');
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [reportFormMode, setReportFormMode] = useState<'create' | 'edit'>('create');
  const [editingReport, setEditingReport] = useState<ReportRecord | null>(null);
  const [savingReport, setSavingReport] = useState(false);
  const [deletingReportKey, setDeletingReportKey] = useState<string | null>(null);
  const [form] = Form.useForm();

  const reportId = searchParams.get('r')?.trim() || null;
  const groupKeyParam = searchParams.get('g')?.trim() || null;
  const blockKeyParam = searchParams.get('b')?.trim() || null;
  const periodParam = searchParams.get('period')?.trim() || null;

  const selectedReport = reportId ? catalog.reports[reportId] ?? null : null;

  const resolvedGroupFromParam = useMemo(() => {
    if (!groupKeyParam) {
      return null;
    }
    return findReportGroup(groupKeyParam, catalog);
  }, [groupKeyParam, catalog.groups]);

  const activeGroupKey = useMemo(() => {
    if (resolvedGroupFromParam) {
      return resolvedGroupFromParam.groupKey;
    }
    if (groupKeyParam) {
      return groupKeyParam;
    }
    return selectedReport?.groupKey ?? null;
  }, [resolvedGroupFromParam, groupKeyParam, selectedReport?.groupKey]);

  const activeBlockKey = useMemo(() => {
    if (blockKeyParam) {
      return blockKeyParam;
    }
    if (selectedReport?.blockKey) {
      return selectedReport.blockKey;
    }
    if (resolvedGroupFromParam) {
      return resolvedGroupFromParam.blockKey;
    }
    if (groupKeyParam) {
      const fallbackBlockKey = parseBlockKeyFromGroupParam(groupKeyParam);
      if (fallbackBlockKey && catalog.blocks.some(block => block.blockKey === fallbackBlockKey)) {
        return fallbackBlockKey;
      }
    }
    if (activeGroupKey) {
      return catalog.groups.find(group => group.groupKey === activeGroupKey)?.blockKey ?? null;
    }
    return null;
  }, [
    blockKeyParam,
    selectedReport?.blockKey,
    resolvedGroupFromParam,
    groupKeyParam,
    activeGroupKey,
    catalog.groups,
    catalog.blocks,
  ]);

  const activeGroup = useMemo<ReportGroupRecord | null>(() => {
    if (resolvedGroupFromParam) {
      return resolvedGroupFromParam;
    }
    if (!activeGroupKey) {
      return null;
    }
    return catalog.groups.find(group => group.groupKey === activeGroupKey) ?? null;
  }, [resolvedGroupFromParam, activeGroupKey, catalog.groups]);

  const unknownGroupParam = Boolean(
    groupKeyParam && !reportsLoading && !resolvedGroupFromParam
  );

  const activeBlock = useMemo(() => {
    if (!activeBlockKey) {
      return null;
    }
    return catalog.blocks.find(block => block.blockKey === activeBlockKey) ?? null;
  }, [activeBlockKey, catalog.blocks]);

  const periodOptions = useMemo(() => {
    if (activeGroupKey) {
      return listPeriodsForGroup(activeGroupKey, catalog.reports);
    }
    if (blockKeyParam) {
      return listPeriodsForBlock(blockKeyParam, catalog.reports);
    }
    return [];
  }, [activeGroupKey, blockKeyParam, catalog.reports]);

  const activePeriodKey = useMemo(() => {
    if (periodParam && periodOptions.some(period => period.periodKey === periodParam)) {
      return periodParam;
    }
    if (selectedReport?.periodKey && periodOptions.some(period => period.periodKey === selectedReport.periodKey)) {
      return selectedReport.periodKey;
    }
    return periodOptions[0]?.periodKey ?? null;
  }, [periodParam, periodOptions, selectedReport?.periodKey]);

  const activePeriodLabel = useMemo(
    () => periodOptions.find(period => period.periodKey === activePeriodKey)?.periodLabel ?? '',
    [periodOptions, activePeriodKey]
  );

  const periodReports = useMemo(() => {
    if (!activePeriodKey) {
      return [];
    }

    const allReports = Object.values(catalog.reports) as ReportRecord[];

    if (activeGroupKey) {
      return allReports
        .filter(report => report.groupKey === activeGroupKey && report.periodKey === activePeriodKey)
        .sort((left, right) => left.stt - right.stt);
    }

    if (blockKeyParam) {
      return allReports
        .filter(
          report =>
            report.blockKey === blockKeyParam && !report.groupKey && report.periodKey === activePeriodKey
        )
        .sort((left, right) => left.stt - right.stt);
    }

    return [];
  }, [activeGroupKey, blockKeyParam, activePeriodKey, catalog.reports]);

  const filteredReports = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return periodReports;
    }

    return periodReports.filter(report => {
      const haystack = [
        report.name,
        report.noidung,
        report.ngayTaoBaoCao,
        report.nguoiGui,
        report.nguoiNhan,
        report.ky,
        report.ngay,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [periodReports, searchText]);

  const weekIndex = WEEK_OPTIONS.findIndex(week => week.value === selectedWeek);
  const selectedWeekMeta = WEEK_OPTIONS[weekIndex] ?? WEEK_OPTIONS[0];

  const shiftWeek = (delta: number) => {
    const nextIndex = weekIndex + delta;
    if (nextIndex >= 0 && nextIndex < WEEK_OPTIONS.length) {
      setSelectedWeek(WEEK_OPTIONS[nextIndex].value);
    }
  };

  const reloadReports = async () => {
    const nextCatalog = await loadReportCatalog({ force: true });
    setCatalog(nextCatalog);
    setSupabaseConnected(true);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      setReportsLoading(true);
      try {
        const nextCatalog = await loadReportCatalog({ force: true });
        if (!cancelled) {
          setCatalog(nextCatalog);
          setSupabaseConnected(true);
        }
      } catch (error) {
        if (!cancelled) {
          setCatalog({ reports: {}, blocks: [], groups: [] });
          setSupabaseConnected(false);
          message.error(error instanceof Error ? error.message : 'Không thể tải bảng BC định kỳ từ Supabase.');
        }
      } finally {
        if (!cancelled) {
          setReportsLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, [message]);

  useEffect(() => {
    if (!groupKeyParam || reportsLoading || !resolvedGroupFromParam) {
      return;
    }
    if (resolvedGroupFromParam.groupKey === groupKeyParam) {
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.set('g', resolvedGroupFromParam.groupKey);
    navigate(`/navigation?${params.toString()}`, { replace: true });
  }, [groupKeyParam, reportsLoading, resolvedGroupFromParam, searchParams, navigate]);

  const buildNavigationParams = (overrides?: { periodKey?: string; reportKey?: string | null }) => {
    const params = new URLSearchParams();

    if (activeGroupKey) {
      params.set('g', activeGroupKey);
    } else if (blockKeyParam) {
      params.set('b', blockKeyParam);
    }

    const periodKey = overrides?.periodKey ?? activePeriodKey;
    if (periodKey) {
      params.set('period', periodKey);
    }

    const nextReportKey = overrides?.reportKey === null ? null : overrides?.reportKey ?? reportId;
    if (nextReportKey) {
      params.set('r', nextReportKey);
    }

    return params;
  };

  const handlePeriodChange = (periodKey: string) => {
    if (!activeGroupKey && !blockKeyParam) {
      return;
    }

    const currentReport = reportId ? catalog.reports[reportId] : null;
    const keepReport =
      currentReport &&
      currentReport.periodKey === periodKey &&
      ((activeGroupKey && currentReport.groupKey === activeGroupKey) ||
        (blockKeyParam && currentReport.blockKey === blockKeyParam && !currentReport.groupKey));

    navigate(`/navigation?${buildNavigationParams({ periodKey, reportKey: keepReport ? reportId : null }).toString()}`);
  };

  const handleReportSelect = (report: ReportRecord) => {
    navigate(
      `/navigation?${buildNavigationParams({
        periodKey: report.periodKey,
        reportKey: report.key,
      }).toString()}`
    );
  };

  const showContent = Boolean(activeGroupKey || blockKeyParam);
  const pageTitle =
    activeGroup?.label ??
    (unknownGroupParam && activeBlock ? activeBlock.blockLabel : null) ??
    activeBlock?.blockLabel ??
    'Báo cáo định kỳ';
  const mobileTitle = stripLeadingIndex(pageTitle);
  const breadcrumbParent = activeBlock ? breadcrumbBlockLabel(activeBlock.blockLabel) : 'Báo cáo định kỳ';

  const canCreateReport = Boolean(showContent && activeBlock?.ma && supabaseConnected);
  const canManageReports = Boolean(showContent && supabaseConnected);

  const openCreateModal = () => {
    setReportFormMode('create');
    setEditingReport(null);
    form.resetFields();
    form.setFieldsValue({
      loaiBaoCao: activeGroup?.label ?? '',
      kyBaoCao: kyLabelFromPeriodLabel(activePeriodLabel),
      ngayBaoCao: dayjs(),
      ngayUpdateLink: dayjs(),
    });
    setReportFormOpen(true);
  };

  const openEditModal = (report: ReportRecord) => {
    if (!report.sourceRow) {
      message.error('Không có dữ liệu báo cáo. Hãy F5 tải lại.');
      return;
    }
    setReportFormMode('edit');
    setEditingReport(report);
    form.setFieldsValue({
      loaiBaoCao: report.loaiBaoCao || activeGroup?.label || '',
      tenBaoCao: report.name,
      noidung: report.noidung,
      kyBaoCao: report.ky,
      ngayBaoCao: parseFormDate(report.ngay),
      nguoiGui: report.nguoiGui,
      nguoiNhan: report.nguoiNhan,
      link: report.link,
      ngayUpdateLink: parseFormDate(report.ngayTaoBaoCao),
    });
    setReportFormOpen(true);
  };

  const handleDeleteReport = async (report: ReportRecord) => {
    if (!report.sourceRow) {
      message.error('Không có dữ liệu để xóa. Hãy F5 tải lại.');
      return;
    }
    const reportTable = getReportAppsheetTableName();
    if (!hasAppsheetRowKey(report.sourceRow, report.key, reportTable)) {
      message.error('Không có khóa id để xóa.');
      return;
    }

    setDeletingReportKey(report.key);
    try {
      await deleteAppsheetTask(buildAppsheetReportDeleteRow(report.sourceRow, report.key), reportTable);
      await reloadReports();
      message.success('Đã xóa báo cáo.');
      if (reportId === report.key) {
        navigate(`/navigation?${buildNavigationParams({ reportKey: null }).toString()}`);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể xóa báo cáo.');
    } finally {
      setDeletingReportKey(null);
    }
  };

  const addReportButton = (options?: { size?: 'small' | 'middle' | 'large'; block?: boolean }) => (
    <Button
      type="primary"
      size={options?.size ?? 'middle'}
      block={options?.block}
      icon={<PlusOutlined />}
      className="bg-[#F38320] border-[#F38320] hover:!bg-[#e07518] hover:!border-[#e07518] shadow-sm font-semibold"
      disabled={!canCreateReport}
      onClick={openCreateModal}
    >
      Thêm
    </Button>
  );

  const handleReportFormSubmit = () => {
    form
      .validateFields()
      .then(async values => {
        if (!supabaseConnected) {
          message.error('Chưa kết nối Supabase.');
          return;
        }

        const loaiBaoCao = (values.loaiBaoCao as string)?.trim() || activeGroup?.label || '';
        if (!loaiBaoCao) {
          message.error('Nhập loại báo cáo / phòng ban.');
          return;
        }

        const reportTable = getReportAppsheetTableName();
        setSavingReport(true);

        try {
          if (reportFormMode === 'edit') {
            if (!editingReport?.sourceRow) {
              message.error('Không có dữ liệu để sửa.');
              return;
            }
            if (!hasAppsheetRowKey(editingReport.sourceRow, editingReport.key, reportTable)) {
              message.error('Không có khóa id để cập nhật.');
              return;
            }

            await editAppsheetTask(
              buildAppsheetReportEditRow(
                editingReport.sourceRow,
                {
                  loaiBaoCao,
                  tenBaoCao: values.tenBaoCao as string,
                  noidung: (values.noidung as string | undefined) ?? '',
                  kyBaoCao: values.kyBaoCao as string | undefined,
                  ngayBaoCao: formatTaskDate(values.ngayBaoCao),
                  nguoiGui: (values.nguoiGui as string | undefined) ?? '',
                  nguoiNhan: (values.nguoiNhan as string | undefined) ?? '',
                  link: (values.link as string | undefined) ?? '',
                  ngayUpdateLink: formatTaskDate(values.ngayUpdateLink),
                },
                editingReport.key
              ),
              reportTable
            );
            await reloadReports();
            message.success('Đã cập nhật báo cáo.');
          } else {
            if (!activeBlock?.ma) {
              message.error('Chọn phòng ban trên menu để thêm báo cáo.');
              return;
            }

            const findResult = await findAppsheetTasks({ table: reportTable });
            await addAppsheetTask(
              buildAppsheetReportRow({
                ma: activeBlock.ma,
                blockKey: activeBlock.blockKey,
                loaiBaoCao,
                tenBaoCao: values.tenBaoCao as string,
                existingRows: findResult.rows,
                rowNumber: getNextReportRowNumber(findResult.rows),
                noidung: values.noidung as string | undefined,
                kyBaoCao: values.kyBaoCao as string | undefined,
                ngayBaoCao: formatTaskDate(values.ngayBaoCao),
                nguoiGui: values.nguoiGui as string | undefined,
                nguoiNhan: values.nguoiNhan as string | undefined,
                link: values.link as string | undefined,
                ngayUpdateLink: formatTaskDate(values.ngayUpdateLink),
              }),
              reportTable
            );
            await reloadReports();
            message.success('Đã thêm báo cáo.');
          }

          setReportFormOpen(false);
          setEditingReport(null);
          form.resetFields();
        } catch (error) {
          message.error(
            error instanceof Error
              ? error.message
              : reportFormMode === 'edit'
                ? 'Không thể cập nhật báo cáo.'
                : 'Không thể thêm báo cáo.'
          );
        } finally {
          setSavingReport(false);
        }
      })
      .catch(() => {});
  };

  const emptyState = (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 p-8 text-center pb-24 md:pb-8">
      <div className="bg-white p-8 rounded-full shadow-sm border border-gray-100 text-[#1E386B]/15">
        <FileTextOutlined className="text-5xl" />
      </div>
      <Text type="secondary" className="text-base max-w-md">
        Chọn <strong>phòng ban</strong> để xem báo cáo.
      </Text>
      <Button
        type="primary"
        icon={<MenuOutlined />}
        onClick={openMenu}
        className="md:hidden mt-2 bg-[#F38320]"
      >
        Mở menu phòng ban
      </Button>
    </div>
  );

  const desktopContent = showContent ? (
    <>
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-5 flex-shrink-0">
        <div className="text-xs text-gray-500 mb-1">
          <span className="hover:text-[#1E386B] cursor-default">Báo cáo định kỳ</span>
          <span className="mx-2 text-gray-300">›</span>
          <span className="text-gray-700 font-medium">{breadcrumbParent}</span>
        </div>

        <h1 className="text-xl md:text-2xl font-bold text-[#1E386B] m-0 leading-tight">{pageTitle}</h1>
        {unknownGroupParam ? (
          <p className="text-sm text-amber-700 mt-2 mb-0">
            Không tìm thấy nhóm báo cáo trong menu (link có thể cũ). Chọn lại mục ở thanh trái hoặc thêm báo cáo mới.
          </p>
        ) : null}

        <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {periodOptions.length > 0 ? (
            <Tabs
              activeKey={activePeriodKey ?? undefined}
              onChange={key => handlePeriodChange(String(key))}
              items={periodOptions.map(period => ({
                key: period.periodKey,
                label: (
                  <span className="text-sm font-semibold px-1">
                    {period.periodLabel.replace(/^Báo cáo\s+/i, 'Báo cáo ')}
                  </span>
                ),
              }))}
              className="report-period-tabs mb-0 [&_.ant-tabs-nav]:mb-0"
            />
          ) : (
            <div />
          )}

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {addReportButton()}
            <div className="flex items-center gap-2">
              <Text className="text-gray-600 text-sm whitespace-nowrap mb-0">Chọn tuần:</Text>
              <Select
                showSearch
                value={selectedWeek}
                onChange={setSelectedWeek}
                options={WEEK_OPTIONS}
                placeholder="Chọn tuần"
                size="middle"
                className="min-w-[200px]"
              />
            </div>
            {supabaseConnected === true ? (
              <Tag className="m-0 px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-700 font-medium">
                Supabase
              </Tag>
            ) : supabaseConnected === false ? (
              <Tag color="error">Không kết nối</Tag>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-w-[1600px] mx-auto">
          <div className="bg-[#F38320] px-4 md:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-white font-bold text-sm tracking-wide uppercase">Thông tin chi tiết</span>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
              {addReportButton({ size: 'small' })}
              <Input
                allowClear
                prefix={<SearchOutlined className="text-white/70" />}
                placeholder="Tìm báo cáo..."
                value={searchText}
                onChange={event => setSearchText(event.target.value)}
                className="max-w-full sm:max-w-xs flex-1 sm:flex-none [&_input]:bg-white/10 [&_input]:border-white/20 [&_input]:text-white [&_input::placeholder]:text-white/60"
              />
            </div>
          </div>

          <ReportTable
            rows={filteredReports}
            selectedKey={selectedReport?.key}
            onRowClick={handleReportSelect}
            showRowActions={canManageReports}
            supabaseConnected={supabaseConnected === true}
            deletingKey={deletingReportKey}
            onEdit={openEditModal}
            onDelete={report => void handleDeleteReport(report)}
            emptyExtra={
              <div className="flex justify-center pt-2">
                {addReportButton()}
              </div>
            }
          />
        </div>
      </div>
    </>
  ) : (
    emptyState
  );

  const mobileContent = showContent ? (
    <>
      <div className="bg-[#F38320] text-white px-4 pb-5 pt-1">
        <p className="text-xs text-white/75 m-0 mb-1">
          Báo cáo định kỳ · {breadcrumbParent}
        </p>
        <h1 className="text-[22px] font-bold m-0 mb-4 leading-tight">{mobileTitle}</h1>

        <div className="flex items-center gap-2 mb-3">
          {addReportButton({ size: 'small' })}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="text"
            size="small"
            icon={<LeftOutlined className="text-white/90" />}
            onClick={() => shiftWeek(-1)}
            disabled={weekIndex <= 0}
            className="!text-white hover:!bg-white/10 disabled:!text-white/30"
          />
          <span className="flex-1 text-center text-sm font-semibold tracking-tight">
            {selectedWeekMeta?.shortLabel}
          </span>
          <Button
            type="text"
            size="small"
            icon={<RightOutlined className="text-white/90" />}
            onClick={() => shiftWeek(1)}
            disabled={weekIndex < 0 || weekIndex >= WEEK_OPTIONS.length - 1}
            className="!text-white hover:!bg-white/10 disabled:!text-white/30"
          />
          {supabaseConnected === true ? (
            <Tag className="m-0 rounded-full border-0 bg-[#5b7cff]/30 text-white text-xs px-3 py-0.5 font-medium">
              Supabase
            </Tag>
          ) : supabaseConnected === false ? (
            <Tag color="error" className="m-0 rounded-full text-xs">
              Lỗi
            </Tag>
          ) : null}
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 px-2">
        {periodOptions.length > 0 ? (
          <Tabs
            centered
            activeKey={activePeriodKey ?? undefined}
            onChange={key => handlePeriodChange(String(key))}
            items={periodOptions.map(period => ({
              key: period.periodKey,
              label: (
                <span className="text-sm font-semibold">
                  {period.periodLabel.replace(/^Báo cáo\s+/i, 'Báo cáo ')}
                </span>
              ),
            }))}
            className="report-period-tabs report-period-tabs--mobile mb-0 [&_.ant-tabs-nav]:mb-0"
          />
        ) : null}
      </div>

      <div className="bg-[#eef1f6] flex-1 pb-24">
        <div className="px-4 pt-3">{addReportButton({ block: true })}</div>
        <div className="px-4 py-3">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Tìm báo cáo..."
            value={searchText}
            onChange={event => setSearchText(event.target.value)}
            className="rounded-xl h-10 shadow-sm border-gray-200"
          />
        </div>
        <ReportMobileCards
          rows={filteredReports}
          selectedKey={selectedReport?.key}
          onSelect={handleReportSelect}
          showRowActions={canManageReports}
          supabaseConnected={supabaseConnected === true}
          deletingKey={deletingReportKey}
          onEdit={openEditModal}
          onDelete={report => void handleDeleteReport(report)}
        />
      </div>
    </>
  ) : (
    emptyState
  );

  return (
    <div className="flex flex-col min-h-full md:min-h-[calc(100vh-80px)] bg-[#eef1f6] md:bg-[#f0f2f5] -mx-0">
      <Modal
        title={reportFormMode === 'edit' ? 'Sửa báo cáo định kỳ' : 'Thêm báo cáo định kỳ'}
        open={reportFormOpen}
        onOk={handleReportFormSubmit}
        onCancel={() => {
          setReportFormOpen(false);
          setEditingReport(null);
          form.resetFields();
        }}
        okText="Lưu"
        cancelText="Huỷ"
        confirmLoading={savingReport}
        destroyOnHidden
        width={720}
        styles={{ body: { paddingTop: 8 } }}
      >
        <Form form={form} layout="vertical" className="mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            {activeBlock ? (
              <Form.Item label="Khối (Mã)" className="sm:col-span-2 mb-2">
                <Input disabled value={`${activeBlock.ma} — ${activeBlock.blockLabel}`} />
              </Form.Item>
            ) : null}
            <Form.Item
              name="loaiBaoCao"
              label="Loại báo cáo / Phòng ban"
              rules={[{ required: true, message: 'Nhập loại báo cáo' }]}
              className="mb-2"
            >
              <Input
                placeholder="VD: 1. PHÒNG HCNS"
                disabled={Boolean(activeGroup) && reportFormMode === 'create'}
              />
            </Form.Item>
            <Form.Item
              name="tenBaoCao"
              label="Tên báo cáo"
              rules={[{ required: true, message: 'Nhập tên báo cáo' }]}
              className="mb-2"
            >
              <Input placeholder="Tên báo cáo" />
            </Form.Item>
            <Form.Item name="noidung" label="Nội dung" className="sm:col-span-2 mb-2">
              <Input.TextArea rows={3} placeholder="Mô tả báo cáo" />
            </Form.Item>
            <Form.Item
              name="kyBaoCao"
              label="Kỳ báo cáo"
              rules={[{ required: true, message: 'Nhập kỳ' }]}
              className="mb-2"
            >
              <Input placeholder="Tuần / Tháng / Quý" />
            </Form.Item>
            <Form.Item name="ngayBaoCao" label="Ngày báo cáo" className="mb-2">
              <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày" />
            </Form.Item>
            <Form.Item name="nguoiGui" label="Người gửi" className="mb-2">
              <Input />
            </Form.Item>
            <Form.Item name="nguoiNhan" label="Người nhận" className="mb-2">
              <Input />
            </Form.Item>
            <Form.Item name="link" label="Link báo cáo" className="mb-2">
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item name="ngayUpdateLink" label="Ngày tạo báo cáo (Ngày update link)" className="mb-0">
              <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Spin spinning={reportsLoading} tip="Đang tải BC định kỳ từ Supabase...">
        <div className="hidden md:flex flex-col min-h-[calc(100vh-80px)]">{desktopContent}</div>
        <div className="md:hidden flex flex-col min-h-full">{mobileContent}</div>
      </Spin>
    </div>
  );
};

export default NavigationHub;

