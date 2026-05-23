import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { App as AntdApp, Typography, Tag, Select, Spin, Tabs, Input, Avatar, Button, Modal, Form, DatePicker } from 'antd';
import {
  FileTextOutlined,
  LinkOutlined,
  SearchOutlined,
  LeftOutlined,
  RightOutlined,
  MenuOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addAppsheetTask } from '../services/appsheetApi';
import { loadReportCatalog } from '../services/reportCatalog';
import { listPeriodsForBlock, listPeriodsForGroup } from '../data/reportNavigation';
import {
  buildAppsheetReportRow,
  getReportAppsheetTableName,
  kyLabelFromPeriodLabel,
} from '../services/reportAppsheet';
import type { ReportCatalog, ReportGroupRecord, ReportRecord } from '../types/report';
import ReportMobileCards from '../components/ReportMobileCards';
import { useMobileShell } from '../contexts/MobileShellContext';
import { formatAppsheetDate, formatTaskDate, normalizeDisplayDate } from '../utils/taskDate';

const { Text } = Typography;

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
};

function ReportTable({ rows, selectedKey, onRowClick, emptyExtra }: ReportTableProps) {
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
            {['#', 'TÊN BÁO CÁO', 'NỘI DUNG', 'NGÀY TẠO BÁO CÁO', 'NGÀY GỬI', 'KỲ', 'NGƯỜI GỬI', 'NGƯỜI NHẬN', ''].map(
              header => (
                <th
                  key={header || 'link'}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
                >
                  {header}
                </th>
              )
            )}
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
                      <Avatar size={28} className="bg-[#1E386B] text-[10px] font-bold shrink-0">
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
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[#1677ff] hover:bg-blue-100"
                      title="Mở link báo cáo"
                    >
                      <LinkOutlined />
                    </a>
                  ) : null}
                </td>
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
  const [appsheetConnected, setAppsheetConnected] = useState<boolean | null>(null);
  const [selectedWeek, setSelectedWeek] = useState('week_16');
  const [searchText, setSearchText] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creatingReport, setCreatingReport] = useState(false);
  const [form] = Form.useForm();

  const reportId = searchParams.get('r')?.trim() || null;
  const groupKeyParam = searchParams.get('g')?.trim() || null;
  const blockKeyParam = searchParams.get('b')?.trim() || null;
  const periodParam = searchParams.get('period')?.trim() || null;

  const selectedReport = reportId ? catalog.reports[reportId] ?? null : null;

  const activeGroupKey = useMemo(() => {
    if (groupKeyParam) {
      return groupKeyParam;
    }
    return selectedReport?.groupKey ?? null;
  }, [groupKeyParam, selectedReport?.groupKey]);

  const activeBlockKey = useMemo(() => {
    if (blockKeyParam) {
      return blockKeyParam;
    }
    if (selectedReport?.blockKey) {
      return selectedReport.blockKey;
    }
    if (activeGroupKey) {
      return catalog.groups.find(group => group.groupKey === activeGroupKey)?.blockKey ?? null;
    }
    return null;
  }, [blockKeyParam, selectedReport?.blockKey, activeGroupKey, catalog.groups]);

  const activeGroup = useMemo<ReportGroupRecord | null>(() => {
    if (!activeGroupKey) {
      return null;
    }
    return catalog.groups.find(group => group.groupKey === activeGroupKey) ?? null;
  }, [activeGroupKey, catalog.groups]);

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
    setAppsheetConnected(true);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      setReportsLoading(true);
      try {
        const nextCatalog = await loadReportCatalog({ force: true });
        if (!cancelled) {
          setCatalog(nextCatalog);
          setAppsheetConnected(true);
        }
      } catch (error) {
        if (!cancelled) {
          setCatalog({ reports: {}, blocks: [], groups: [] });
          setAppsheetConnected(false);
          message.error(error instanceof Error ? error.message : 'Không thể tải bảng BC định kỳ từ AppSheet.');
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
  const pageTitle = activeGroup?.label ?? activeBlock?.blockLabel ?? 'Báo cáo định kỳ';
  const mobileTitle = stripLeadingIndex(pageTitle);
  const breadcrumbParent = activeBlock ? breadcrumbBlockLabel(activeBlock.blockLabel) : 'Báo cáo định kỳ';

  const canCreateReport = Boolean(showContent && activeBlock?.ma && appsheetConnected);

  const openCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({
      loaiBaoCao: activeGroup?.label ?? '',
      kyBaoCao: kyLabelFromPeriodLabel(activePeriodLabel),
    });
    setCreateOpen(true);
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

  const handleCreateSubmit = () => {
    form
      .validateFields()
      .then(async values => {
        if (!activeBlock?.ma) {
          message.error('Chọn phòng ban trên menu để thêm báo cáo.');
          return;
        }

        if (!appsheetConnected) {
          message.error('Chưa kết nối AppSheet API.');
          return;
        }

        const loaiBaoCao = (values.loaiBaoCao as string)?.trim() || activeGroup?.label || '';
        if (!loaiBaoCao) {
          message.error('Nhập loại báo cáo / phòng ban.');
          return;
        }

        setCreatingReport(true);
        try {
          await addAppsheetTask(
            buildAppsheetReportRow({
              ma: activeBlock.ma,
              loaiBaoCao,
              tenBaoCao: values.tenBaoCao as string,
              noidung: values.noidung as string | undefined,
              kyBaoCao: values.kyBaoCao as string | undefined,
              ngayBaoCao: normalizeDisplayDate(values.ngayBaoCao as string | undefined),
              nguoiGui: values.nguoiGui as string | undefined,
              nguoiNhan: values.nguoiNhan as string | undefined,
              link: values.link as string | undefined,
              ngayUpdateLink: formatTaskDate(values.ngayUpdateLink),
            }),
            getReportAppsheetTableName()
          );
          await reloadReports();
          message.success('Đã thêm báo cáo vào AppSheet.');
          setCreateOpen(false);
          form.resetFields();
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Không thể thêm báo cáo trên AppSheet.');
        } finally {
          setCreatingReport(false);
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
        className="md:hidden mt-2 bg-[#1E386B]"
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
            {appsheetConnected === true ? (
              <Tag className="m-0 px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-700 font-medium">
                AppSheet
              </Tag>
            ) : appsheetConnected === false ? (
              <Tag color="error">Không kết nối</Tag>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-w-[1600px] mx-auto">
          <div className="bg-[#1E386B] px-4 md:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
      <div className="bg-[#1E386B] text-white px-4 pb-5 pt-1">
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
          {appsheetConnected === true ? (
            <Tag className="m-0 rounded-full border-0 bg-[#5b7cff]/30 text-white text-xs px-3 py-0.5 font-medium">
              AppSheet
            </Tag>
          ) : appsheetConnected === false ? (
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
        />
      </div>
    </>
  ) : (
    emptyState
  );

  return (
    <div className="flex flex-col min-h-full md:min-h-[calc(100vh-80px)] bg-[#eef1f6] md:bg-[#f0f2f5] -mx-0">
      <Modal
        title="Thêm báo cáo định kỳ"
        open={createOpen}
        onOk={handleCreateSubmit}
        onCancel={() => {
          setCreateOpen(false);
          form.resetFields();
        }}
        okText="Lưu"
        cancelText="Huỷ"
        confirmLoading={creatingReport}
        destroyOnHidden
        width={560}
      >
        <Form form={form} layout="vertical" className="mt-2">
          {activeBlock ? (
            <Form.Item label="Khối (Mã)">
              <Input disabled value={`${activeBlock.ma} — ${activeBlock.blockLabel}`} />
            </Form.Item>
          ) : null}
          <Form.Item
            name="loaiBaoCao"
            label="Loại báo cáo / Phòng ban"
            rules={[{ required: true, message: 'Nhập loại báo cáo' }]}
          >
            <Input placeholder="VD: 1. CÔNG VIỆC CÁ NHÂN" disabled={Boolean(activeGroup)} />
          </Form.Item>
          <Form.Item
            name="tenBaoCao"
            label="Tên báo cáo"
            rules={[{ required: true, message: 'Nhập tên báo cáo' }]}
          >
            <Input placeholder="Tên báo cáo" />
          </Form.Item>
          <Form.Item name="noidung" label="Nội dung">
            <Input.TextArea rows={3} placeholder="Mô tả báo cáo" />
          </Form.Item>
          <Form.Item name="kyBaoCao" label="Kỳ báo cáo" rules={[{ required: true, message: 'Nhập kỳ' }]}>
            <Input placeholder="Tuần / Tháng / Quý" />
          </Form.Item>
          <Form.Item name="ngayBaoCao" label="Ngày báo cáo">
            <Input placeholder="VD: Thứ 7" />
          </Form.Item>
          <Form.Item name="nguoiGui" label="Người gửi">
            <Input />
          </Form.Item>
          <Form.Item name="nguoiNhan" label="Người nhận">
            <Input />
          </Form.Item>
          <Form.Item name="link" label="Link báo cáo">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="ngayUpdateLink" label="Ngày tạo báo cáo (Ngày update link)">
            <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày" />
          </Form.Item>
        </Form>
      </Modal>

      <Spin spinning={reportsLoading} tip="Đang tải BC định kỳ từ AppSheet...">
        <div className="hidden md:flex flex-col min-h-[calc(100vh-80px)]">{desktopContent}</div>
        <div className="md:hidden flex flex-col min-h-full">{mobileContent}</div>
      </Spin>
    </div>
  );
};

export default NavigationHub;

