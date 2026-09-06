import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Empty, Spin, Tag, Typography, message } from 'antd';
import {
  CheckOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { ORG_BLOCKS } from '../data/orgBlocks';
import { useHeaderToolbar } from '../contexts/HeaderToolbarContext';
import {
  loadWorkNotesFromSupabase,
  syncWorkNotesToSupabase,
  type WorkNoteIdea,
} from '../services/workNotesData';

const { Text } = Typography;

const ROMAN = ['I', 'II', 'III', 'IV'] as const;
const STORAGE_KEY = 'hobi-work-notes-v2';
const SYNC_DEBOUNCE_MS = 600;

type NoteIdea = WorkNoteIdea;

function newIdeaId() {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createIdea(input: {
  blockKey: string;
  deptKey: string;
  title: string;
  text?: string;
}): NoteIdea {
  return {
    id: newIdeaId(),
    blockKey: input.blockKey,
    deptKey: input.deptKey,
    title: input.title.trim() || 'Ghi chú',
    lines: [input.text ?? ''],
    hidden: false,
    createdAt: Date.now(),
  };
}

function normalizeIdea(raw: Partial<NoteIdea>): NoteIdea | null {
  if (!raw || typeof raw !== 'object') return null;
  const lines = Array.isArray(raw.lines) && raw.lines.length ? raw.lines.map(String) : [''];
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newIdeaId(),
    blockKey: typeof raw.blockKey === 'string' ? raw.blockKey : '',
    deptKey: typeof raw.deptKey === 'string' ? raw.deptKey : '',
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : 'Ghi chú',
    lines,
    hidden: Boolean(raw.hidden),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
  };
}

/** Migrate v1 (notes-by-dept) -> flat chronological list */
function migrateV1IfNeeded(): NoteIdea[] {
  try {
    const raw = localStorage.getItem('hobi-work-notes-v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, Array<Partial<NoteIdea>>>;
    if (!parsed || typeof parsed !== 'object') return [];

    const migrated: NoteIdea[] = [];
    let stamp = Date.now() - 100000;

    for (const [deptKey, ideas] of Object.entries(parsed)) {
      if (!Array.isArray(ideas)) continue;
      const block = ORG_BLOCKS.find(b => b.depts.some(d => d.key === deptKey));
      const deptIndex = block?.depts.findIndex(d => d.key === deptKey) ?? -1;
      const deptName = block?.depts[deptIndex]?.name ?? 'Ghi chú';
      const title = deptIndex >= 0 ? `${deptIndex + 1}. ${deptName}` : deptName;

      ideas.forEach(item => {
        const lines = Array.isArray(item.lines) ? item.lines.map(String) : [''];
        const empty = lines.every(line => !String(line).trim());
        if (empty) return;
        migrated.push({
          id: typeof item.id === 'string' ? item.id : newIdeaId(),
          blockKey: block?.key ?? '',
          deptKey,
          title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : title,
          lines,
          hidden: Boolean(item.hidden),
          createdAt: stamp++,
        });
      });
    }

    return migrated;
  } catch {
    return [];
  }
}

function loadNotes(): NoteIdea[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<NoteIdea>[];
      if (Array.isArray(parsed)) {
        return parsed
          .map(item => normalizeIdea(item))
          .filter((item): item is NoteIdea => Boolean(item))
          .sort((a, b) => a.createdAt - b.createdAt);
      }
    }
  } catch {
    // fall through to migrate
  }

  const migrated = migrateV1IfNeeded();
  if (migrated.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  }
  return migrated;
}

function saveNotes(notes: NoteIdea[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function ideaBodyText(idea: NoteIdea): string {
  return (idea.lines.length ? idea.lines : ['']).join('\n');
}

function deptDisplayTitle(_index: number, name: string): string {
  return name;
}

/** Bỏ tiền tố "1. " / "2. " trên tiêu đề cũ khi hiển thị. */
function displayTitle(title: string): string {
  return title.replace(/^\d+\.\s*/, '').trim() || title;
}

const WorkNotesView: React.FC = () => {
  const [activeBlockKey, setActiveBlockKey] = useState(() => ORG_BLOCKS[1]?.key ?? ORG_BLOCKS[0]?.key ?? 'tm');
  const [activeDeptKey, setActiveDeptKey] = useState<string | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [notes, setNotes] = useState<NoteIdea[]>(() => loadNotes());
  const [showHidden, setShowHidden] = useState(false);
  const [focusIdeaId, setFocusIdeaId] = useState<string | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const syncReadyRef = useRef(false);
  const syncTimerRef = useRef<number | null>(null);
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const { setToolbar, clearToolbar } = useHeaderToolbar();

  const activeBlock = useMemo(
    () => ORG_BLOCKS.find(block => block.key === activeBlockKey) ?? ORG_BLOCKS[0],
    [activeBlockKey]
  );

  const leftDepts = useMemo(() => {
    if (!activeBlock) return [];
    return activeBlock.depts.filter(dept => dept.key !== 'bld-danh-muc');
  }, [activeBlock]);

  useEffect(() => {
    // Đổi khối: bỏ chọn phòng → hiện cả khối; nếu phòng cũ không thuộc khối mới thì clear.
    setActiveDeptKey(previous => {
      if (!previous) return null;
      if (leftDepts.some(dept => dept.key === previous)) return previous;
      return null;
    });
  }, [leftDepts]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateFromSupabase() {
      setLoadingRemote(true);
      try {
        const remote = await loadWorkNotesFromSupabase();
        if (cancelled) return;
        setSupabaseConnected(true);
        if (remote.length > 0) {
          setNotes(remote);
          saveNotes(remote);
        } else {
          const local = loadNotes();
          if (local.length > 0) {
            await syncWorkNotesToSupabase(local);
            if (!cancelled) {
              message.success('Đã đẩy ghi chú phòng ban từ máy lên Supabase.');
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

  const persist = useCallback((next: NoteIdea[]) => {
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
      void syncWorkNotesToSupabase(snapshot)
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

  const resolveDeptMeta = useCallback(
    (deptKey: string) => {
      const index = leftDepts.findIndex(dept => dept.key === deptKey);
      const dept = leftDepts[index];
      if (!dept || index < 0) {
        return { deptKey, title: 'Ghi chú', index: 0 };
      }
      return {
        deptKey,
        title: deptDisplayTitle(index + 1, dept.name),
        index,
      };
    },
    [leftDepts]
  );

  /** Toàn bộ ý (để đếm badge) — chỉ ẩn/hiện theo checkbox. */
  const visibleNotes = useMemo(() => {
    return notes
      .filter(note => showHidden || !note.hidden)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [notes, showHidden]);

  /** Nội dung chính: lọc theo khối đang chọn; nếu chọn phòng thì chỉ hiện phòng đó. */
  const timelineNotes = useMemo(() => {
    return visibleNotes.filter(note => {
      if (note.blockKey !== activeBlockKey) return false;
      if (activeDeptKey && note.deptKey !== activeDeptKey) return false;
      return true;
    });
  }, [visibleNotes, activeBlockKey, activeDeptKey]);

  /** Gộp các ý cùng tiêu đề thành một nhóm (giữ thứ tự xuất hiện). */
  const groupedNotes = useMemo(() => {
    const groups: { key: string; title: string; ideas: NoteIdea[] }[] = [];
    const indexByKey = new Map<string, number>();

    for (const idea of timelineNotes) {
      const key = `${idea.deptKey}::${idea.title}`;
      const existing = indexByKey.get(key);
      if (existing === undefined) {
        indexByKey.set(key, groups.length);
        groups.push({ key, title: idea.title, ideas: [idea] });
      } else {
        groups[existing].ideas.push(idea);
      }
    }
    return groups;
  }, [timelineNotes]);

  /** Số ý theo khối (tiêu đề cha) và theo phòng (thanh trái). */
  const countByBlockKey = useMemo(() => {
    const map: Record<string, number> = {};
    for (const idea of visibleNotes) {
      const key = idea.blockKey || 'unknown';
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [visibleNotes]);

  const countByDeptKey = useMemo(() => {
    const map: Record<string, number> = {};
    for (const idea of visibleNotes) {
      const key = idea.deptKey || 'unknown';
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [visibleNotes]);

  const activeDeptName = useMemo(() => {
    if (!activeDeptKey) return null;
    return leftDepts.find(dept => dept.key === activeDeptKey)?.name ?? null;
  }, [activeDeptKey, leftDepts]);

  const updateIdea = (ideaId: string, patch: Partial<NoteIdea>) => {
    persist(notes.map(idea => (idea.id === ideaId ? { ...idea, ...patch } : idea)));
  };

  const handleBodyChange = (ideaId: string, raw: string) => {
    const lines = raw.replace(/\r\n/g, '\n').split('\n');
    updateIdea(ideaId, { lines: lines.length ? lines : [''] });
  };

  const appendIdea = (deptKey: string, text = '') => {
    const meta = resolveDeptMeta(deptKey);
    const created = createIdea({
      blockKey: activeBlockKey,
      deptKey: meta.deptKey,
      title: meta.title,
      text,
    });
    persist([...notes, created]);
    setActiveDeptKey(deptKey);
    setFocusIdeaId(created.id);
    return created;
  };

  const handleIdeaKeyDown = (ideaId: string, event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    const index = notes.findIndex(idea => idea.id === ideaId);
    if (index < 0) return;
    const idea = notes[index];

    // 2 dấu cách liên tiếp → xuống dòng cùng ý
    if (event.key === ' ' || event.key === 'Spacebar') {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const value = el.value;
      if (start === end && start > 0 && value[start - 1] === ' ') {
        event.preventDefault();
        const nextValue = `${value.slice(0, start - 1)}\n${value.slice(end)}`;
        handleBodyChange(ideaId, nextValue);
        requestAnimationFrame(() => {
          const node = textareaRefs.current[ideaId];
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

      const updatedCurrent: NoteIdea = {
        ...idea,
        lines: beforeLines.length ? beforeLines : [''],
      };
      const created = createIdea({
        blockKey: idea.blockKey,
        deptKey: idea.deptKey,
        title: idea.title,
        text: after,
      });
      // Chèn ngay sau ý hiện tại theo thứ tự gõ
      created.createdAt = idea.createdAt + 0.001;

      const next = notes.map(item => (item.id === idea.id ? updatedCurrent : item));
      const insertAt = next.findIndex(item => item.id === idea.id) + 1;
      next.splice(insertAt, 0, created);
      // Chuẩn hóa createdAt thành số nguyên tăng dần theo vị trí
      const normalized = next.map((item, i) => ({ ...item, createdAt: i + 1 }));
      persist(normalized);
      setActiveDeptKey(idea.deptKey);
      setFocusIdeaId(created.id);
      return;
    }

    if (event.key === 'Backspace' && el.selectionStart === 0 && el.selectionEnd === 0) {
      const isEmpty = idea.lines.every(line => !line.trim());
      const visible = notes.filter(n => showHidden || !n.hidden);
      const pos = visible.findIndex(n => n.id === ideaId);
      if (!isEmpty || visible.length <= 1 || pos <= 0) {
        return;
      }
      event.preventDefault();
      const prev = visible[pos - 1];
      persist(notes.filter(n => n.id !== ideaId));
      setFocusIdeaId(prev.id);
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
    if (!focusIdeaId) return;
    const node = textareaRefs.current[focusIdeaId];
    if (node) {
      node.focus();
      const end = node.value.length;
      node.selectionStart = Math.min(end, 0);
      node.selectionEnd = Math.min(end, 0);
    }
    setFocusIdeaId(null);
  }, [focusIdeaId, timelineNotes]);

  const blockIndex = ORG_BLOCKS.findIndex(block => block.key === activeBlockKey);
  const roman = blockIndex >= 0 ? ROMAN[blockIndex] : '';

  useEffect(() => {
    setToolbar(
      <div className="flex items-center gap-1.5 md:gap-2 w-full min-w-0">
        <div className="flex items-center gap-1.5 md:gap-2 min-w-0 overflow-x-auto flex-1 py-0.5">
          {ORG_BLOCKS.map((block, index) => {
            const active = block.key === activeBlockKey;
            const blockCount = countByBlockKey[block.key] ?? 0;
            return (
              <button
                key={block.key}
                type="button"
                onClick={() => {
                  setActiveBlockKey(block.key);
                  setActiveDeptKey(null);
                }}
                className={`px-2 md:px-2.5 py-1.5 rounded-md text-xs md:text-sm font-extrabold uppercase tracking-wide transition whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#1E386B] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={`${ROMAN[index]}. ${block.label}`}
              >
                <span className="lg:hidden">{ROMAN[index]}</span>
                <span className="hidden lg:inline">
                  {ROMAN[index]}. {block.label}
                </span>
                {blockCount > 0 ? (
                  <span className={`ml-1 font-bold ${active ? 'text-white/90' : 'text-[#F38320]'}`}>
                    ({blockCount})
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden xl:block min-w-0 max-w-[180px]">
            <p className="m-0 text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-tight truncate">
              Ghi chú PB
            </p>
            <p className="m-0 text-xs font-extrabold uppercase text-[#1E386B] leading-snug truncate">
              {activeDeptName
                ? activeDeptName
                : `${roman}. ${activeBlock?.label ?? ''}`.trim()}
            </p>
          </div>
          {supabaseConnected ? (
            <Tag color="success" className="m-0 hidden md:inline-flex">
              Supabase
            </Tag>
          ) : supabaseConnected === false ? (
            <Tag color="error" className="m-0 hidden md:inline-flex">
              Offline
            </Tag>
          ) : null}
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            className="font-bold bg-[#F38320] border-[#F38320]"
            onClick={() => {
              if (!activeDeptKey) {
                message.info('Chọn một phòng ban bên trái rồi bấm Thêm ý.');
                return;
              }
              appendIdea(activeDeptKey, '');
            }}
          >
            Thêm ý
          </Button>
        </div>
      </div>
    );
    return () => clearToolbar();
  }, [
    activeBlockKey,
    activeDeptKey,
    activeDeptName,
    activeBlock?.label,
    roman,
    countByBlockKey,
    supabaseConnected,
    setToolbar,
    clearToolbar,
  ]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 min-h-0">
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <aside
          className={`flex-shrink-0 bg-[#1E386B] text-white overflow-hidden transition-[width] duration-200 ${
            leftCollapsed ? 'w-12' : 'w-[260px] md:w-[320px]'
          }`}
        >
          <div
            className={`flex items-center border-b border-white/10 ${
              leftCollapsed ? 'justify-center px-1 py-3' : 'justify-between gap-2 px-3 py-3'
            }`}
          >
            {!leftCollapsed ? (
              <div className="min-w-0">
                <p className="m-0 text-[11px] uppercase tracking-widest text-white/70 font-bold">Phòng ban</p>
                <button
                  type="button"
                  onClick={() => setActiveDeptKey(null)}
                  className="m-0 mt-1 text-left text-sm font-extrabold text-white hover:text-[#F38320] transition"
                  title="Hiện tất cả phòng trong khối"
                >
                  {roman}. {activeBlock?.label}
                  {(countByBlockKey[activeBlockKey] ?? 0) > 0 ? (
                    <span className="ml-2 text-[#F38320]">({countByBlockKey[activeBlockKey]})</span>
                  ) : null}
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setLeftCollapsed(prev => !prev)}
              className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-md text-white/90 hover:bg-white/15 transition"
              title={leftCollapsed ? 'Mở danh sách phòng ban' : 'Thu gọn danh sách phòng ban'}
              aria-label={leftCollapsed ? 'Mở danh sách phòng ban' : 'Thu gọn danh sách phòng ban'}
            >
              {leftCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
          </div>

          {!leftCollapsed ? (
            <div className="py-1 overflow-y-auto h-[calc(100%-4.5rem)]">
              <button
                type="button"
                onClick={() => setActiveDeptKey(null)}
                className={`w-full text-left px-3 py-2.5 text-sm md:text-base font-bold border-l-4 transition ${
                  !activeDeptKey
                    ? 'bg-white/15 border-[#F38320] text-white'
                    : 'border-transparent text-white/80 hover:bg-white/10'
                }`}
              >
                Tất cả phòng ban
                {(countByBlockKey[activeBlockKey] ?? 0) > 0 ? (
                  <span className={`ml-2 ${!activeDeptKey ? 'text-[#F38320]' : 'text-white/70'}`}>
                    ({countByBlockKey[activeBlockKey]})
                  </span>
                ) : null}
              </button>
              {leftDepts.map(dept => {
                const active = dept.key === activeDeptKey;
                const deptCount = countByDeptKey[dept.key] ?? 0;
                return (
                  <button
                    key={dept.key}
                    type="button"
                    onClick={() => setActiveDeptKey(dept.key)}
                    className={`w-full text-left px-3 py-2.5 pl-5 text-sm md:text-base font-bold border-l-4 transition ${
                      active
                        ? 'bg-white/15 border-[#F38320] text-white'
                        : 'border-transparent text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <span className="inline-flex items-center justify-between gap-2 w-full">
                      <span className="min-w-0 truncate">{dept.name}</span>
                      {deptCount > 0 ? (
                        <span className={`shrink-0 ${active ? 'text-[#F38320]' : 'text-white/70'}`}>
                          ({deptCount})
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-200 flex flex-wrap items-center gap-2 bg-white shrink-0">
            <Text type="secondary" className="text-xs md:text-sm font-medium">
              {activeDeptKey
                ? 'Đang lọc theo phòng đã chọn'
                : 'Đang hiện tất cả phòng trong khối'}{' '}
              · <strong>2 dấu cách</strong> xuống dòng · <strong>Enter</strong> ý mới
            </Text>
            <label className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-gray-600 ml-auto cursor-pointer select-none">
              <Checkbox checked={showHidden} onChange={e => setShowHidden(e.target.checked)} />
              Hiện ý đã xong
            </label>
          </div>

          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
              <Spin spinning={loadingRemote} tip="Đang tải từ Supabase...">
              {groupedNotes.length === 0 && !loadingRemote ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    activeDeptKey
                      ? 'Phòng này chưa có ghi chú — bấm Thêm ý'
                      : 'Chưa có ghi chú trong khối này — chọn phòng rồi Thêm ý'
                  }
                >
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      if (!activeDeptKey) {
                        message.info('Chọn một phòng ban bên trái rồi bấm Thêm ý.');
                        return;
                      }
                      appendIdea(activeDeptKey, '');
                    }}
                  >
                    Thêm ý
                  </Button>
                </Empty>
              ) : (
                groupedNotes.map(group => {
                  const allHidden = group.ideas.every(idea => idea.hidden);
                  const groupCount = group.ideas.length;
                  return (
                    <div
                      key={group.key}
                      className={`rounded-lg border px-3 py-3 transition ${
                        allHidden
                          ? 'bg-gray-100 border-gray-200 opacity-75'
                          : 'bg-white border-gray-200 shadow-sm'
                      }`}
                    >
                      <h3
                        className={`m-0 mb-2 work-notes-idea-title uppercase tracking-wide ${
                          allHidden ? 'text-gray-400 line-through' : 'text-[#1E386B]'
                        }`}
                      >
                        {displayTitle(group.title)}
                        {groupCount > 0 ? (
                          <span className={`ml-2 ${allHidden ? 'text-gray-400' : 'text-[#F38320]'}`}>
                            ({groupCount})
                          </span>
                        ) : null}
                      </h3>

                      <div className="space-y-2">
                        {group.ideas.map(idea => (
                          <div key={idea.id} className="flex items-start gap-2">
                            <span
                              className={`work-notes-bullet select-none mt-0.5 ${
                                idea.hidden ? 'text-gray-400' : 'text-[#1E386B]'
                              }`}
                              aria-hidden
                            >
                              −
                            </span>
                            <textarea
                              ref={node => {
                                textareaRefs.current[idea.id] = node;
                              }}
                              value={ideaBodyText(idea)}
                              onChange={e => handleBodyChange(idea.id, e.target.value)}
                              onKeyDown={e => handleIdeaKeyDown(idea.id, e)}
                              rows={Math.max(1, idea.lines.length)}
                              spellCheck={false}
                              disabled={idea.hidden && !showHidden}
                              className={`work-notes-idea-input flex-1 min-w-0 resize-none outline-none bg-transparent ${
                                idea.hidden ? 'line-through text-gray-400' : 'text-gray-900'
                              }`}
                              placeholder="Nội dung ghi chú..."
                            />
                            {idea.hidden ? (
                              <Button
                                size="middle"
                                className="work-notes-done-btn shrink-0 font-bold"
                                onClick={() => updateIdea(idea.id, { hidden: false })}
                              >
                                Hiện lại
                              </Button>
                            ) : (
                              <Button
                                type="primary"
                                size="middle"
                                icon={<CheckOutlined />}
                                className="work-notes-done-btn shrink-0 font-bold"
                                onClick={() => updateIdea(idea.id, { hidden: true })}
                              >
                                Chưa xong
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
              </Spin>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WorkNotesView;
