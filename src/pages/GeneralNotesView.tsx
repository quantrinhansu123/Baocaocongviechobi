import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Empty, Typography } from 'antd';
import { CheckOutlined, PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;

const STORAGE_KEY = 'hobi-general-notes-v1';

type GeneralNote = {
  id: string;
  lines: string[];
  hidden: boolean;
  createdAt: number;
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

const GeneralNotesView: React.FC = () => {
  const [notes, setNotes] = useState<GeneralNote[]>(() => loadNotes());
  const [showHidden, setShowHidden] = useState(false);
  const [focusNoteId, setFocusNoteId] = useState<string | null>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const persist = useCallback((next: GeneralNote[]) => {
    const sorted = [...next].sort((a, b) => a.createdAt - b.createdAt);
    setNotes(sorted);
    saveNotes(sorted);
  }, []);

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
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-bold uppercase tracking-widest text-white/80">Ghi chú chung</p>
            <h2 className="m-0 mt-0.5 text-base md:text-lg font-extrabold uppercase leading-snug truncate">
              Theo thứ tự gõ
            </h2>
          </div>
          <Button
            type="default"
            size="middle"
            icon={<PlusOutlined />}
            className="shrink-0 font-bold"
            onClick={() => appendNote('')}
          >
            Thêm ý
          </Button>
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
          {timelineNotes.length === 0 ? (
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
        </div>
      </div>
    </div>
  );
};

export default GeneralNotesView;
