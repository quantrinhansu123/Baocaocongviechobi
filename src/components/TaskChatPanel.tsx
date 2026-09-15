import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { MessageOutlined, PaperClipOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { TaskChatMessage } from '../types/task';
import type { PersonnelSelectOption } from '../services/auxiliaryData';
import PersonnelMentionMenu, {
  applyPersonnelMention,
  extractMentionedNames,
  filterPersonnelMentions,
  findActiveMention,
  textMentionsName,
  type MentionMatch,
} from './PersonnelMentionMenu';

type TaskChatPanelProps = {
  messages: TaskChatMessage[];
  sending?: boolean;
  disabled?: boolean;
  onSend: (text: string) => void | Promise<void>;
  personInitial: (name: string) => string;
  className?: string;
  hideHead?: boolean;
  mentionPeople?: PersonnelSelectOption[];
  currentUserName?: string;
};

function formatChatTime(ts: number): string {
  const d = dayjs(ts);
  if (!d.isValid()) return '';
  if (d.isSame(dayjs(), 'day')) return d.format('HH:mm');
  if (d.isSame(dayjs(), 'year')) return d.format('DD/MM HH:mm');
  return d.format('DD/MM/YYYY HH:mm');
}

function ChatMessageText({
  text,
  names,
  currentUserName,
}: {
  text: string;
  names: string[];
  currentUserName?: string;
}) {
  const mentions = extractMentionedNames(text, names);
  if (mentions.length === 0) return <>{text}</>;

  const pattern = mentions
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(name => `@${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
    .join('|');
  const parts = text.split(new RegExp(`(${pattern})`, 'gi'));
  const current = (currentUserName || '').toLocaleLowerCase('vi');

  return (
    <>
      {parts.map((part, index) => {
        const hit = mentions.find(
          name => part.toLocaleLowerCase('vi') === `@${name}`.toLocaleLowerCase('vi')
        );
        if (!hit) {
          return <React.Fragment key={`${index}-${part.slice(0, 8)}`}>{part}</React.Fragment>;
        }
        const isSelf = Boolean(current) && hit.toLocaleLowerCase('vi') === current;
        return (
          <span
            key={`${index}-${hit}`}
            className={`task-md-chat-mention${isSelf ? ' is-self' : ''}`}
          >
            @{hit}
          </span>
        );
      })}
    </>
  );
}

const TaskChatPanel: React.FC<TaskChatPanelProps> = ({
  messages,
  sending = false,
  disabled = false,
  onSend,
  personInitial,
  className = '',
  hideHead = false,
  mentionPeople = [],
  currentUserName = '',
}) => {
  const [draft, setDraft] = useState('');
  const [mention, setMention] = useState<{ match: MentionMatch; index: number } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<TextAreaRef>(null);
  const sorted = useMemo(
    () => [...messages].sort((a, b) => a.createdAt - b.createdAt),
    [messages]
  );
  const mentionNames = useMemo(
    () => mentionPeople.map(opt => opt.label).filter(Boolean),
    [mentionPeople]
  );
  const mentionOptions = useMemo(
    () => (mention ? filterPersonnelMentions(mentionPeople, mention.match.query, 0) : []),
    [mention, mentionPeople]
  );
  const mentionOpen = Boolean(mention);
  const selfMentionCount = useMemo(() => {
    if (!currentUserName) return 0;
    return sorted.filter(
      msg =>
        msg.author !== currentUserName && textMentionsName(msg.text, currentUserName)
    ).length;
  }, [sorted, currentUserName]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [sorted.length, sending, draft, mentionOpen]);

  const textareaEl = () =>
    inputRef.current?.resizableTextArea?.textArea ??
    (inputRef.current?.nativeElement as HTMLTextAreaElement | null) ??
    null;

  const syncMention = useCallback((value: string, caret: number) => {
    const match = findActiveMention(value, caret);
    if (!match) {
      setMention(null);
      return;
    }
    setMention(prev => ({
      match,
      index: prev && prev.match.query === match.query ? prev.index : 0,
    }));
  }, []);

  const insertMention = useCallback(
    (option: PersonnelSelectOption) => {
      if (!mention) return;
      const el = textareaEl();
      const caret = el?.selectionStart ?? mention.match.end;
      const match = findActiveMention(draft, caret) ?? mention.match;
      const { next, caret: nextCaret } = applyPersonnelMention(draft, match, option.label);
      setDraft(next);
      setMention(null);
      requestAnimationFrame(() => {
        const node = textareaEl();
        node?.focus();
        node?.setSelectionRange(nextCaret, nextCaret);
      });
    },
    [draft, mention]
  );

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending || disabled) return;
    setDraft('');
    setMention(null);
    await onSend(text);
  };

  return (
    <aside className={`task-md-chat ${className}`.trim()} aria-label="Chat công việc">
      {!hideHead ? (
        <div className="task-md-chat-head">
          <p className="task-md-chat-title">Chat công việc</p>
          <span className="task-md-chat-count">{sorted.length} tin</span>
        </div>
      ) : null}

      {selfMentionCount > 0 ? (
        <div className="task-md-chat-alert" role="status">
          Bạn được gắn trong {selfMentionCount} tin nhắn
        </div>
      ) : null}

      <div ref={listRef} className="task-md-chat-list">
        {sorted.length === 0 ? (
          <div className="task-md-chat-empty">
            <MessageOutlined className="task-md-chat-empty-icon" />
            <p className="m-0">Chưa có tin nhắn</p>
            <span>Gửi trao đổi để lưu lịch sử cho công việc này.</span>
          </div>
        ) : (
          sorted.map(msg => {
            const taggedMe =
              Boolean(currentUserName) &&
              msg.author !== currentUserName &&
              textMentionsName(msg.text, currentUserName);
            return (
              <div
                key={msg.id}
                className={`task-md-chat-bubble${taggedMe ? ' is-mentioned' : ''}`}
              >
                <div className="task-md-chat-bubble-top">
                  <span className="task-md-person-avatar task-md-chat-avatar">
                    {personInitial(msg.author)}
                  </span>
                  <div className="task-md-chat-bubble-meta">
                    <span className="task-md-chat-author">{msg.author}</span>
                    <span className="task-md-chat-time">{formatChatTime(msg.createdAt)}</span>
                  </div>
                  {taggedMe ? <span className="task-md-chat-mention-flag">Bạn được gắn</span> : null}
                </div>
                <p className="task-md-chat-text">
                  <ChatMessageText
                    text={msg.text}
                    names={mentionNames}
                    currentUserName={currentUserName}
                  />
                </p>
              </div>
            );
          })
        )}
        {sending ? (
          <div className="task-md-chat-sending">
            Đang lưu...
          </div>
        ) : null}
      </div>

      {mentionOpen ? (
        <div className="task-md-chat-mention-dock">
          <PersonnelMentionMenu
            open
            options={mentionOptions}
            activeIndex={mention?.index ?? 0}
            onHoverIndex={index => setMention(prev => (prev ? { ...prev, index } : prev))}
            onSelect={insertMention}
            emptyText={mentionPeople.length ? 'Không tìm thấy nhân sự' : 'Chưa có dữ liệu nhân sự'}
          />
        </div>
      ) : null}

      <div ref={composerRef} className="task-md-chat-composer">
        <span className="task-md-chat-attach" aria-hidden>
          <PaperClipOutlined />
        </span>
        <Input.TextArea
          ref={inputRef}
          value={draft}
          onChange={e => {
            const value = e.target.value;
            setDraft(value);
            syncMention(value, e.target.selectionStart ?? value.length);
          }}
          onKeyUp={e => {
            const node = e.currentTarget;
            syncMention(node.value, node.selectionStart ?? node.value.length);
          }}
          onClick={e => {
            const node = e.currentTarget;
            syncMention(node.value, node.selectionStart ?? node.value.length);
          }}
          placeholder={disabled ? 'Cần kết nối Supabase để chat' : 'Nhập tin nhắn... (@ để gắn nhân sự)'}
          autoSize={{ minRows: 1, maxRows: 5 }}
          disabled={disabled || sending}
          className="task-md-chat-input"
          onFocus={() => {
            requestAnimationFrame(() => {
              composerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              const node = listRef.current;
              if (node) node.scrollTop = node.scrollHeight;
            });
          }}
          onKeyDown={event => {
            if (mentionOpen) {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (mentionOptions.length === 0) return;
                setMention(prev =>
                  prev ? { ...prev, index: (prev.index + 1) % mentionOptions.length } : prev
                );
                return;
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (mentionOptions.length === 0) return;
                setMention(prev =>
                  prev
                    ? {
                        ...prev,
                        index: (prev.index - 1 + mentionOptions.length) % mentionOptions.length,
                      }
                    : prev
                );
                return;
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                setMention(null);
                return;
              }
              if ((event.key === 'Enter' || event.key === 'Tab') && mentionOptions.length > 0) {
                event.preventDefault();
                const opt =
                  mentionOptions[
                    Math.min(Math.max(mention?.index ?? 0, 0), mentionOptions.length - 1)
                  ];
                if (opt) insertMention(opt);
                return;
              }
            }
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          className="task-md-chat-send"
          loading={sending}
          disabled={disabled || !draft.trim()}
          onClick={() => void submit()}
          aria-label="Gửi tin nhắn"
        />
      </div>
    </aside>
  );
};

export default TaskChatPanel;
