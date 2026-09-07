import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, Input, Modal, Select, Spin, Tag, message } from 'antd';
import BackButton from '../components/BackButton';
import {
  loadPersonnelSelectOptions,
  loadWorkReportTasks,
  type PersonnelSelectOption,
  type WorkReportTask,
} from '../services/auxiliaryData';

export default function ReportDetailScreen() {
  const [tasks, setTasks] = useState<WorkReportTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'important' | 'overdue' | 'upcoming' | 'completed'>('all');
  const [personnelOptions, setPersonnelOptions] = useState<PersonnelSelectOption[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: number | null; field: string | null }>({
    id: null,
    field: null,
  });
  const [selectedTask, setSelectedTask] = useState<WorkReportTask | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    let active = true;
    void Promise.all([loadWorkReportTasks(), loadPersonnelSelectOptions().catch(() => [])])
      .then(([data, options]) => {
        if (active) {
          setTasks(data);
          setPersonnelOptions(options);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => {
    let important = 0;
    let overdue = 0;
    let upcoming = 0;
    let completed = 0;

    for (const t of tasks) {
      if (t.impact >= 3) important++;
      if (t.status === 'Trễ hạn') overdue++;
      else if (t.status === 'Hoàn thành') completed++;
      else upcoming++;
    }

    return {
      all: tasks.length,
      important,
      overdue,
      upcoming,
      completed,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterType === 'important' && task.impact < 3) return false;
      if (filterType === 'overdue' && task.status !== 'Trễ hạn') return false;
      if (filterType === 'upcoming' && (task.status === 'Trễ hạn' || task.status === 'Hoàn thành')) return false;
      if (filterType === 'completed' && task.status !== 'Hoàn thành') return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const str = [task.name, task.assignee, task.desc, task.status].join(' ').toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, filterType, search]);

  const handleInlineSave = (id: number, field: string, value: unknown) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, [field]: value } : t)));
    setEditingCell({ id: null, field: null });
    message.success('Đã cập nhật trạng thái');
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'Hoàn thành') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircleOutlined className="text-emerald-600 text-xs" />
          Hoàn thành
        </span>
      );
    }
    if (status === 'Trễ hạn') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <ClockCircleOutlined className="text-rose-600 text-xs" />
          Quá hạn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Sắp đến hạn
      </span>
    );
  };

  const renderImpact = (level: number) => {
    return (
      <div className="inline-flex items-center gap-0.5">
        {[...Array(4)].map((_, i) =>
          i < level ? (
            <StarFilled key={i} className="text-[#F38320] text-xs" />
          ) : (
            <StarOutlined key={i} className="text-slate-300 text-xs" />
          )
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 min-h-0 p-2 sm:p-3 md:p-4 pb-20 md:pb-4">
      <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Header: Midnight Cobalt Gradient */}
        <div className="bg-gradient-to-r from-[#00327D] via-[#0047AB] to-[#1E386B] text-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 shadow-sm flex-shrink-0">
          <div className="min-w-0 flex items-center gap-2 sm:gap-3">
            <BackButton
              variant="light"
              size="small"
              label=""
              className="!w-9 !h-9 !min-w-[36px] !p-0 !rounded-xl !border-white/25 !bg-white/10 !text-white flex items-center justify-center hover:!bg-white/20 transition-all shadow-sm shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="m-0 text-sm sm:text-base md:text-lg font-bold text-white leading-tight truncate flex items-center gap-1.5">
                  <ExclamationCircleOutlined className="text-[#F38320]" />
                  Báo Cáo Tuần Nhà Máy
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 text-white/90">
                  {tasks.length} mục
                </span>
              </div>
              <p className="m-0 text-[11px] text-blue-100/80 font-medium truncate">
                {filteredTasks.length}/{tasks.length} công việc · Supabase bc_chi_tiet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-semibold px-2.5 py-1 bg-white/15 text-white rounded-lg border border-white/20">
              Mức 3-4: <strong className="text-[#F38320]">{counts.important}</strong>
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-3 sm:px-4 py-2.5 border-b border-slate-200/80 bg-white flex flex-col gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Input
              allowClear
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm công việc, người phụ trách..."
              prefix={<SearchOutlined className="text-slate-400" />}
              className="flex-1 rounded-xl bg-slate-50 border-slate-200 focus:bg-white text-xs sm:text-sm"
            />
            <span className="text-slate-500 text-xs shrink-0 font-medium hidden sm:inline">
              Hiển thị <strong className="text-slate-800">{filteredTasks.length}</strong>/{tasks.length}
            </span>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { key: 'all', label: 'Tất cả', count: counts.all },
              { key: 'important', label: '⭐ Quan trọng (3-4)', count: counts.important },
              { key: 'overdue', label: '🔴 Quá hạn', count: counts.overdue },
              { key: 'upcoming', label: '🟡 Sắp đến hạn', count: counts.upcoming },
              { key: 'completed', label: '🟢 Hoàn thành', count: counts.completed },
            ].map(chip => {
              const active = filterType === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setFilterType(chip.key as typeof filterType)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                    active
                      ? 'bg-[#0047AB] text-white shadow-sm ring-1 ring-[#0047AB]'
                      : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600 border border-slate-200/60'
                  }`}
                >
                  <span>{chip.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-slate-50/60">
          <Spin spinning={loading} tip="Đang tải từ Supabase...">
            {filteredTasks.length === 0 && !loading ? (
              <div className="p-12 text-center text-slate-400">Không có công việc nào khớp với bộ lọc</div>
            ) : (
              <>
                {/* Mobile Cards (block md:hidden) */}
                <div className="block md:hidden space-y-3">
                  {filteredTasks.map((task, idx) => {
                    const isOverdue =
                      new Date(task.deadline) < new Date() && task.status !== 'Hoàn thành';

                    return (
                      <article
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
                      >
                        {/* Header: Title + Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                              {renderImpact(task.impact)}
                            </div>
                            <h2 className="text-sm font-bold text-slate-900 leading-snug m-0 hover:text-[#0047AB] transition">
                              {task.name}
                            </h2>
                          </div>
                          <div className="shrink-0">{renderStatusBadge(task.status)}</div>
                        </div>

                        {/* Middle: Assignee & Deadline */}
                        <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-blue-50 text-[#0047AB] flex items-center justify-center font-bold text-[10px]">
                              <UserOutlined />
                            </div>
                            <span className="font-semibold text-slate-800 truncate">{task.assignee || 'Chưa gán'}</span>
                          </div>

                          <div
                            className={`flex items-center gap-1 text-[11px] ${
                              isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                            }`}
                          >
                            <CalendarOutlined className="text-xs" />
                            <span>Hạn: {task.deadline}</span>
                          </div>
                        </div>

                        {/* Description snippet if any */}
                        {task.desc && (
                          <p className="text-xs text-slate-500 mt-2 m-0 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {task.desc}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>

                {/* Desktop Table View (hidden md:block) */}
                <div className="hidden md:block bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#00327D] text-white">
                        <th className="px-4 py-3.5 font-bold text-center w-14 text-white text-xs uppercase tracking-wider">STT</th>
                        <th className="px-4 py-3.5 font-bold text-white text-xs uppercase tracking-wider">Công việc</th>
                        <th className="px-4 py-3.5 font-bold w-44 text-white text-xs uppercase tracking-wider">Người phụ trách</th>
                        <th className="px-4 py-3.5 font-bold w-36 text-white text-xs uppercase tracking-wider">Hạn chót</th>
                        <th className="px-4 py-3.5 font-bold w-36 text-white text-xs uppercase tracking-wider">Trạng thái</th>
                        <th className="px-4 py-3.5 font-bold w-28 text-white text-xs uppercase tracking-wider text-center">Ảnh hưởng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTasks.map((task, index) => {
                        const isOverdue =
                          new Date(task.deadline) < new Date() && task.status !== 'Hoàn thành';

                        return (
                          <tr key={task.id} className="hover:bg-slate-50/80 transition group">
                            <td className="px-4 py-3.5 text-center text-slate-400 font-semibold text-xs">{index + 1}</td>
                            <td className="px-4 py-3.5">
                              <span
                                className="font-bold text-slate-800 cursor-pointer hover:text-[#0047AB] transition"
                                onClick={() => setSelectedTask(task)}
                              >
                                {task.name}
                              </span>
                              {task.desc && (
                                <p className="text-xs text-slate-400 truncate max-w-md m-0 mt-0.5">{task.desc}</p>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              {editingCell.id === task.id && editingCell.field === 'assignee' ? (
                                <Select
                                  autoFocus
                                  defaultOpen
                                  defaultValue={task.assignee}
                                  onChange={val => handleInlineSave(task.id, 'assignee', val)}
                                  onBlur={() => setEditingCell({ id: null, field: null })}
                                  className="w-full text-xs"
                                  options={personnelOptions.map(p => ({ value: p.value, label: p.value }))}
                                />
                              ) : (
                                <div
                                  className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-[#0047AB] font-medium text-xs"
                                  onClick={() => setEditingCell({ id: task.id, field: 'assignee' })}
                                  title="Bấm để đổi người phụ trách"
                                >
                                  <UserOutlined className="text-slate-400 text-xs" />
                                  <span>{task.assignee || 'Chưa gán'}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              {editingCell.id === task.id && editingCell.field === 'deadline' ? (
                                <input
                                  type="date"
                                  autoFocus
                                  defaultValue={task.deadline}
                                  onBlur={e => handleInlineSave(task.id, 'deadline', e.target.value)}
                                  className="border border-[#0047AB] outline-none rounded px-2 py-1 text-xs w-full"
                                />
                              ) : (
                                <div
                                  className={`flex items-center gap-1.5 cursor-pointer text-xs ${
                                    isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                                  }`}
                                  onClick={() => setEditingCell({ id: task.id, field: 'deadline' })}
                                  title="Bấm để chỉnh deadline"
                                >
                                  <CalendarOutlined className="text-xs" />
                                  <span>{task.deadline}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              {editingCell.id === task.id && editingCell.field === 'status' ? (
                                <Select
                                  autoFocus
                                  defaultOpen
                                  defaultValue={task.status}
                                  onChange={val => handleInlineSave(task.id, 'status', val)}
                                  onBlur={() => setEditingCell({ id: null, field: null })}
                                  className="w-full text-xs"
                                  options={[
                                    { value: 'Sắp đến hạn', label: '🟡 Sắp đến hạn' },
                                    { value: 'Hoàn thành', label: '🟢 Hoàn thành' },
                                    { value: 'Trễ hạn', label: '🔴 Quá hạn' },
                                  ]}
                                />
                              ) : (
                                <div
                                  className="cursor-pointer inline-block"
                                  onClick={() => setEditingCell({ id: task.id, field: 'status' })}
                                  title="Bấm để đổi trạng thái"
                                >
                                  {renderStatusBadge(task.status)}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">{renderImpact(task.impact)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Spin>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <Modal
          title={
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <ExclamationCircleOutlined className="text-[#F38320]" />
              <span>{selectedTask.name}</span>
            </div>
          }
          open={Boolean(selectedTask)}
          onCancel={() => setSelectedTask(null)}
          footer={null}
          width={720}
          destroyOnClose
          styles={{
            header: {
              background: 'linear-gradient(135deg, #00327D 0%, #0047AB 100%)',
              padding: '16px 20px',
              borderRadius: '16px 16px 0 0',
              margin: '-20px -24px 16px -24px',
            },
          }}
        >
          <div className="space-y-4">
            {/* Quick stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase m-0">Người phụ trách</p>
                <p className="font-bold text-slate-800 text-xs mt-1 m-0 flex items-center gap-1">
                  <UserOutlined className="text-[#0047AB]" /> {selectedTask.assignee || '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase m-0">Hạn chót</p>
                <p className="font-bold text-slate-800 text-xs mt-1 m-0 flex items-center gap-1">
                  <CalendarOutlined className="text-[#0047AB]" /> {selectedTask.deadline || '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase m-0">Trạng thái</p>
                <div className="mt-1">{renderStatusBadge(selectedTask.status)}</div>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase m-0">Mức ảnh hưởng</p>
                <div className="mt-1">{renderImpact(selectedTask.impact)}</div>
              </div>
            </div>

            {/* Detailed Description */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
              <h4 className="text-xs font-bold text-[#0047AB] uppercase tracking-wide m-0 mb-1.5">Mô tả chi tiết</h4>
              <p className="text-sm text-slate-700 leading-relaxed m-0 whitespace-pre-wrap">
                {selectedTask.desc || 'Chưa có mô tả chi tiết cho công việc này.'}
              </p>
            </div>

            {/* History */}
            {selectedTask.history && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide m-0 mb-1.5">Lịch sử cập nhật</h4>
                <div className="border-l-2 border-[#F38320] pl-3 py-0.5">
                  <p className="text-xs text-slate-600 m-0">{selectedTask.history}</p>
                </div>
              </div>
            )}

            {/* Comment Section */}
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-start gap-2">
                <MessageOutlined className="text-slate-400 mt-2 text-base" />
                <div className="flex-1">
                  <Input.TextArea
                    rows={2}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Nhập ý kiến chỉ đạo hoặc cập nhật trạng thái..."
                    className="rounded-xl border-slate-200 text-xs"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      type="primary"
                      onClick={() => {
                        if (!commentText.trim()) return;
                        message.success('Đã gửi ý kiến chỉ đạo');
                        setCommentText('');
                      }}
                      className="!bg-[#F38320] hover:!bg-[#d96f12] !border-none font-bold text-xs !rounded-xl shadow-sm"
                    >
                      Gửi ý kiến
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}