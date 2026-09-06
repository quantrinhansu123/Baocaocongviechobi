import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  DatePicker,
  Empty,
  Modal,
  Select,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckOutlined,
  CloudOutlined,
  CloudSyncOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import BackButton from '../components/BackButton';
import { ORG_BLOCKS } from '../data/orgBlocks';
import {
  loadGeneralNotesFromSupabase,
  loadWorkNotesFromSupabase,
  syncGeneralNotesToSupabase,
  type GeneralNoteIdea,
  type WorkNoteIdea,
} from '../services/workNotesData';

const { Text } = Typography;

const STORAGE_KEY = 'hobi-general-notes-v1';
const WORK_NOTES_STORAGE_KEY = 'hobi-work-notes-v2';
const SYNC_DEBOUNCE_MS = 600;
const GENERAL_DEPT_KEY = '__general__';

type GeneralNote = GeneralNoteIdea;

type ArchiveItem = {
  id: string;
  text: string;
  deptKey: string;
  deptLabel: string;
  resolved: boolean;
  createdAt: number;
  dayKey: string;
};

function newNoteId() {
  return `gnote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createNote(text = ''): GeneralNote {
  return {
    id: newNoteId(),
    lines: [text],
    hidden: false,
    createdAt: Date.now(),
  };
}

function normalizeNote(raw: Partial<GeneralNote>): GeneralNote | null {
  if (!raw || typeof raw !== 'object') return null;
  const lines = Array.isArray(raw.lines) && raw.lines.length ? raw.lines.map(String) : [''];
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newNoteId(),
    lines,
    hidden: Boolean(raw.hidden),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
  };
}

function loadNotes(): GeneralNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<GeneralNote>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(item => normalizeNote(item))
      .filter((item): item is GeneralNote => Boolean(item))
      .sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

function saveNotes(notes: GeneralNote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function noteBodyText(note: GeneralNote): string {
  return (note.lines.length ? note.lines : ['']).join('\n');
}

function dayKeyFromTs(ts: number): string {
  const d = dayjs(ts);
  return d.isValid() ? d.format('YYYY-MM-DD') : 'unknown';
}

function formatDayLabel(dayKey: string): string {
  if (dayKey === 'unknown') return 'Không rõ ngày';
  const d = dayjs(dayKey);
  return d.isValid() ? d.format('DD/MM/YYYY') : dayKey;
}

function deptLabelFromKey(deptKey: string): string {
  if (deptKey === GENERAL_DEPT_KEY) return 'Ghi chú chung';
  for (const block of ORG_BLOCKS) {
    const dept = block.depts.find(item => item.key === deptKey);
    if (dept) return dept.name;
  }
  return deptKey || 'Không rõ phòng';
}

function loadLocalWorkNotes(): WorkNoteIdea[] {
  try {
    const raw = localStorage.getItem(WORK_NOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<WorkNoteIdea>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(item => {
        if (!item || typeof item !== 'object') return null;
        const id = typeof item.id === 'string' ? item.id : '';
        if (!id) return null;
        return {
          id,
          blockKey: typeof item.blockKey === 'string' ? item.blockKey : '',
          deptKey: typeof item.deptKey === 'string' ? item.deptKey : '',
          title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : 'Ghi chú',
          lines: Array.isArray(item.lines) && item.lines.length ? item.lines.map(String) : [''],
          hidden: Boolean(item.hidden),
          createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
        } satisfies WorkNoteIdea;
      })
      .filter((item): item is WorkNoteIdea => Boolean(item));
  } catch {
    return [];
  }
}

function toArchiveFromGeneral(notes: GeneralNote[]): ArchiveItem[] {
  return notes
    .map(note => {
      const text = noteBodyText(note).trim();
      if (!text) return null;
      return {
        id: `general:${note.id}`,
        text,
        deptKey: GENERAL_DEPT_KEY,
        deptLabel: 'Ghi chú chung',
        resolved: Boolean(note.hidden),
        createdAt: note.createdAt,
        dayKey: dayKeyFromTs(note.createdAt),
      } satisfies ArchiveItem;
    })
    .filter((item): item is ArchiveItem => Boolean(item));
}

function toArchiveFromWork(notes: WorkNoteIdea[]): ArchiveItem[] {
  return notes
    .map(note => {
      const text = (note.lines.length ? note.lines : ['']).join('\n').trim();
      if (!text) return null;
      return {
        id: `work:${note.id}`,
        text,
        deptKey: note.deptKey || 'unknown',
        deptLabel: deptLabelFromKey(note.deptKey),
        resolved: Boolean(note.hidden),
        createdAt: note.createdAt,
        dayKey: dayKeyFromTs(note.createdAt),
      } satisfies ArchiveItem;
    })
    .filter((item): item is ArchiveItem => Boolean(item));
}

const DEPT_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả phòng ban' },
  { value: GENERAL_DEPT_KEY, label: 'Ghi chú chung' },
  ...ORG_BLOCKS.flatMap(block =>
    block.depts.map(dept => ({
      value: dept.key,
      label: `${block.label} · ${dept.name}`,
    }))
  ),
];

const GeneralNotesView: React.FC = () => {
  const [notes, setNotes] = useState<GeneralNote[]>(() => loadNotes());
  const [showHidden, setShowHidden] = useState(false);
  const [focusNoteId, setFocusNoteId] = useState<string | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const syncReadyRef = useRef(false);
  const syncTimerRef = useRef<number | null>(null);
  const notesRef = useRef(notes);
  notesRef.current = notes;

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>([]);
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);
  const [filterDept, setFilterDept] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;

    async function hydrateFromSupabase() {
      setLoadingRemote(true);
      try {
        const remote = await loadGeneralNotesFromSupabase();
        if (cancelled) return;
        setSupabaseConnected(true);
        if (remote.length > 0) {
          setNotes(remote);
          saveNotes(remote);
        } else {
          const local = loadNotes();
          if (local.length > 0) {
            await syncGeneralNotesToSupabase(local);
            if (!cancelled) {
              message.success('Đã đẩy ghi chú chung từ máy lên Supabase.');
            }
          }
        }
      } catch {
        if (!cancelled) {
          setSupabaseConnected(false);
          message.warning('Chưa kết nối Supabase — ghi chú đang lưu tạm trên máy.');
        }
      } finally {
        if (!cancelled) {
          setLoadingRemote(false);
          syncReadyRef.current = true;
        }
      }
    }

    void hydrateFromSupabase();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: GeneralNote[]) => {
    const sorted = [...next].sort((a, b) => a.createdAt - b.createdAt);
    setNotes(sorted);
    saveNotes(sorted);
  }, []);

  useEffect(() => {
    if (!syncReadyRef.current || supabaseConnected === false) {
      return;
    }

    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = window.setTimeout(() => {
      const snapshot = notesRef.current;
      setSyncing(true);
      void syncGeneralNotesToSupabase(snapshot)
        .then(() => {
          setSupabaseConnected(true);
        })
        .catch(error => {
          setSupabaseConnected(false);
          message.error(error instanceof Error ? error.message : 'Không đồng bộ được lên Supabase.');
        })
        .finally(() => {
          setSyncing(false);
        });
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [notes, supabaseConnected]);

  const timelineNotes = useMemo(() => {
    return notes
      .filter(note => showHidden || !note.hidden)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [notes, showHidden]);

  const updateNote = (noteId: string, patch: Partial<GeneralNote>) => {
    persist(notes.map(note => (note.id === noteId ? { ...note, ...patch } : note)));
  };

  const handleBodyChange = (noteId: string, raw: string) => {
    const lines = raw.replace(/\r\n/g, '\n').split('\n');
    updateNote(noteId, { lines: lines.length ? lines : [''] });
  };

  const appendNote = (text = '') => {
    const created = createNote(text);
    persist([...notes, created]);
    setFocusNoteId(created.id);
    return created;
  };

  const openArchiveModal = async () => {
    setArchiveOpen(true);
    setArchiveLoading(true);
    setFilterDate(null);
    setFilterDept('all');

    try {
      const [remoteWork, remoteGeneral] = await Promise.all([
        loadWorkNotesFromSupabase().catch(() => [] as WorkNoteIdea[]),
        loadGeneralNotesFromSupabase().catch(() => [] as GeneralNoteIdea[]),
      ]);

      const workSource = remoteWork.length > 0 ? remoteWork : loadLocalWorkNotes();
      const generalSource = remoteGeneral.length > 0 ? remoteGeneral : notesRef.current;

      const merged = [...toArchiveFromGeneral(generalSource), ...toArchiveFromWork(workSource)].sort(
        (a, b) => b.createdAt - a.createdAt
      );
      setArchiveItems(merged);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không tải được danh sách việc.');
      setArchiveItems([
        ...toArchiveFromGeneral(notesRef.current),
        ...toArchiveFromWork(loadLocalWorkNotes()),
      ].sort((a, b) => b.createdAt - a.createdAt));
    } finally {
      setArchiveLoading(false);
    }
  };

  const filteredArchiveItems = useMemo(() => {
    return archiveItems.filter(item => {
      if (filterDept !== 'all' && item.deptKey !== filterDept) return false;
      if (filterDate) {
        if (item.dayKey !== filterDate.format('YYYY-MM-DD')) return false;
      }
      return true;
    });
  }, [archiveItems, filterDate, filterDept]);

  const archiveByDay = useMemo(() => {
    const groups: { dayKey: string; items: ArchiveItem[] }[] = [];
    const indexByDay = new Map<string, number>();

    for (const item of filteredArchiveItems) {
      const existing = indexByDay.get(item.dayKey);
      if (existing === undefined) {
        indexByDay.set(item.dayKey, groups.length);
        groups.push({ dayKey: item.dayKey, items: [item] });
      } else {
        groups[existing].items.push(item);
      }
    }

    return groups;
  }, [filteredArchiveItems]);

  const handleIdeaKeyDown = (noteId: string, event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    const index = notes.findIndex(note => note.id === noteId);
    if (index < 0) return;
    const note = notes[index];

    // 2 dấu cách liên tiếp → xuống dòng cùng ý
    if (event.key === ' ' || event.key === 'Spacebar') {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const value = el.value;
      if (start === end && start > 0 && value[start - 1] === ' ') {
        event.preventDefault();
        const nextValue = `${value.slice(0, start - 1)}\n${value.slice(end)}`;
        handleBodyChange(noteId, nextValue);
        requestAnimationFrame(() => {
          const node = textareaRefs.current[noteId];
          if (!node) return;
          const caret = start;
          node.selectionStart = caret;
          node.selectionEnd = caret;
          node.focus();
        });
        return;
      }
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const value = el.value;
      const before = value.slice(0, start);
      const after = value.slice(end);
      const beforeLines = before.replace(/\r\n/g, '\n').split('\n');

      const updatedCurrent: GeneralNote = {
        ...note,
        lines: beforeLines.length ? beforeLines : [''],
      };
      const created = createNote(after);
      created.createdAt = note.createdAt + 0.001;

      const next = notes.map(item => (item.id === note.id ? updatedCurrent : item));
      const insertAt = next.findIndex(item => item.id === note.id) + 1;
      next.splice(insertAt, 0, created);
      const normalized = next.map((item, i) => ({ ...item, createdAt: i + 1 }));
      persist(normalized);
      setFocusNoteId(created.id);
      return;
    }

    if (event.key === 'Backspace' && el.selectionStart === 0 && el.selectionEnd === 0) {
      const isEmpty = note.lines.every(line => !line.trim());
      const visible = notes.filter(n => showHidden || !n.hidden);
      const pos = visible.findIndex(n => n.id === noteId);
      if (!isEmpty || visible.length <= 1 || pos <= 0) {
        return;
      }
      event.preventDefault();
      const prev = visible[pos - 1];
      persist(notes.filter(n => n.id !== noteId));
      setFocusNoteId(prev.id);
      requestAnimationFrame(() => {
        const node = textareaRefs.current[prev.id];
        if (!node) return;
        const end = node.value.length;
        node.selectionStart = end;
        node.selectionEnd = end;
      });
    }
  };

  useEffect(() => {
    if (!focusNoteId) return;
    const node = textareaRefs.current[focusNoteId];
    if (node) {
      node.focus();
      node.selectionStart = 0;
      node.selectionEnd = 0;
    }
    setFocusNoteId(null);
  }, [focusNoteId, timelineNotes]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 min-h-0 p-3 md:p-4">
      <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-[#F38320] text-white px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="min-w-0 flex items-start gap-3">
            <BackButton variant="light" size="small" className="mt-0.5" />
            <div className="min-w-0">
              <p className="m-0 text-[11px] font-bold uppercase tracking-widest text-white/80">Ghi chú chung</p>
              <h2 className="m-0 mt-0.5 text-base md:text-lg font-extrabold uppercase leading-snug truncate">
                Theo thứ tự gõ
              </h2>
              <p className="m-0 mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/90">
                {syncing || loadingRemote ? (
                  <span>
                    <CloudSyncOutlined className="mr-1" />
                    Đang đồng bộ
                  </span>
                ) : supabaseConnected ? (
                  <span>
                    <CloudOutlined className="mr-1" />
                    Supabase
                  </span>
                ) : (
                  <span>Chưa kết nối Supabase</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="default"
              size="middle"
              icon={<UnorderedListOutlined />}
              className="font-bold"
              onClick={() => void openArchiveModal()}
            >
              Theo ngày
            </Button>
            <Button
              type="default"
              size="middle"
              icon={<PlusOutlined />}
              className="font-bold"
              onClick={() => appendNote('')}
            >
              Thêm ý
            </Button>
          </div>
        </div>

        <div className="px-3 py-2 border-b border-gray-100 flex flex-wrap items-center gap-2 bg-slate-50">
          <Text type="secondary" className="text-xs md:text-sm font-medium">
            List theo <strong>thứ tự gõ</strong> · <strong>2 dấu cách</strong> xuống dòng cùng ý ·{' '}
            <strong>Enter</strong> ý mới · <strong>Chưa xong</strong> để ẩn
          </Text>
          <label className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-gray-600 ml-auto cursor-pointer select-none">
            <Checkbox checked={showHidden} onChange={e => setShowHidden(e.target.checked)} />
            Hiện ý đã xong
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 bg-[#fafafa]">
          <Spin spinning={loadingRemote} tip="Đang tải từ Supabase...">
            {timelineNotes.length === 0 && !loadingRemote ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có ghi chú — bấm Thêm ý để bắt đầu"
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={() => appendNote('')}>
                  Thêm ý
                </Button>
              </Empty>
            ) : (
              timelineNotes.map(note => (
                <div
                  key={note.id}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 transition ${
                    note.hidden
                      ? 'bg-gray-100 border-gray-200 opacity-75'
                      : 'bg-white border-gray-200 shadow-sm'
                  }`}
                >
                  <span
                    className={`work-notes-bullet select-none mt-0.5 ${
                      note.hidden ? 'text-gray-400' : 'text-[#1E386B]'
                    }`}
                    aria-hidden
                  >
                    −
                  </span>
                  <textarea
                    ref={node => {
                      textareaRefs.current[note.id] = node;
                    }}
                    value={noteBodyText(note)}
                    onChange={e => handleBodyChange(note.id, e.target.value)}
                    onKeyDown={e => handleIdeaKeyDown(note.id, e)}
                    rows={Math.max(1, note.lines.length)}
                    spellCheck={false}
                    disabled={note.hidden && !showHidden}
                    className={`work-notes-idea-input flex-1 min-w-0 resize-none outline-none bg-transparent ${
                      note.hidden ? 'line-through text-gray-400' : 'text-gray-900'
                    }`}
                    placeholder="Nội dung ghi chú..."
                  />
                  {note.hidden ? (
                    <Button
                      size="middle"
                      className="work-notes-done-btn shrink-0 font-bold"
                      onClick={() => updateNote(note.id, { hidden: false })}
                    >
                      Hiện lại
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      size="middle"
                      icon={<CheckOutlined />}
                      className="work-notes-done-btn shrink-0 font-bold"
                      onClick={() => updateNote(note.id, { hidden: true })}
                    >
                      Chưa xong
                    </Button>
                  )}
                </div>
              ))
            )}
          </Spin>
        </div>
      </div>

      <Modal
        title="Danh sách việc theo ngày"
        open={archiveOpen}
        onCancel={() => setArchiveOpen(false)}
        footer={null}
        width={920}
        destroyOnClose
        styles={{ body: { paddingTop: 12 } }}
      >
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <DatePicker
            value={filterDate}
            onChange={value => setFilterDate(value)}
            format="DD/MM/YYYY"
            placeholder="Lọc theo ngày"
            allowClear
            className="w-[160px]"
          />
          <Select
            value={filterDept}
            onChange={value => setFilterDept(value)}
            options={DEPT_FILTER_OPTIONS}
            showSearch
            optionFilterProp="label"
            className="min-w-[220px] flex-1"
            placeholder="Phòng ban"
          />
          <Text type="secondary" className="text-sm ml-auto">
            {filteredArchiveItems.length} việc
            {filteredArchiveItems.filter(item => item.resolved).length > 0
              ? ` · ${filteredArchiveItems.filter(item => item.resolved).length} đã giải quyết`
              : ''}
          </Text>
        </div>

        <Spin spinning={archiveLoading}>
          <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4">
            {archiveByDay.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không có việc phù hợp bộ lọc"
              />
            ) : (
              archiveByDay.map(group => (
                <section key={group.dayKey}>
                  <div className="sticky top-0 z-[1] bg-white/95 backdrop-blur-sm py-1.5 mb-2 border-b border-orange-100">
                    <p className="m-0 text-sm font-extrabold text-[#1E386B] uppercase tracking-wide">
                      {formatDayLabel(group.dayKey)}
                      <span className="ml-2 text-xs font-semibold text-gray-500 normal-case tracking-normal">
                        ({group.items.length})
                      </span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    {group.items.map(item => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${
                          item.resolved
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className={`m-0 text-sm whitespace-pre-wrap break-words ${
                              item.resolved ? 'text-gray-500 line-through' : 'text-gray-900'
                            }`}
                          >
                            {item.text}
                          </p>
                          <p className="m-0 mt-1 text-xs font-semibold text-[#F38320]">
                            {item.deptLabel}
                          </p>
                        </div>
                        <Tag
                          color={item.resolved ? 'success' : 'processing'}
                          className="shrink-0 m-0 font-semibold"
                        >
                          {item.resolved ? 'Đã giải quyết' : 'Đang xử lý'}
                        </Tag>
                      </div>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </Spin>
      </Modal>
    </div>
  );
};

export default GeneralNotesView;
