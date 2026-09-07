import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Spin } from 'antd';
import { MessageOutlined, PaperClipOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { TaskChatMessage } from '../types/task';

type TaskChatPanelProps = {
  messages: TaskChatMessage[];
  sending?: boolean;
  disabled?: boolean;
  onSend: (text: string) => void | Promise<void>;
  personInitial: (name: string) => string;
  className?: string;
  hideHead?: boolean;
};

function formatChatTime(ts: number): string {
  const d = dayjs(ts);
  if (!d.isValid()) return '';
  if (d.isSame(dayjs(), 'day')) return d.format('HH:mm');
  if (d.isSame(dayjs(), 'year')) return d.format('DD/MM HH:mm');
  return d.format('DD/MM/YYYY HH:mm');
}

const TaskChatPanel: React.FC<TaskChatPanelProps> = ({
  messages,
  sending = false,
  disabled = false,
  onSend,
  personInitial,
  className = '',
  hideHead = false,
}) => {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const sorted = useMemo(
    () => [...messages].sort((a, b) => a.createdAt - b.createdAt),
    [messages]
  );

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [sorted.length, sending, draft]);

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending || disabled) return;
    setDraft('');
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

      <div ref={listRef} className="task-md-chat-list">
        {sorted.length === 0 ? (
          <div className="task-md-chat-empty">
            <MessageOutlined className="task-md-chat-empty-icon" />
            <p className="m-0">Chưa có tin nhắn</p>
            <span>Gửi trao đổi để lưu lịch sử cho công việc này.</span>
          </div>
        ) : (
          sorted.map(msg => (
            <div key={msg.id} className="task-md-chat-bubble">
              <div className="task-md-chat-bubble-top">
                <span className="task-md-person-avatar task-md-chat-avatar">
                  {personInitial(msg.author)}
                </span>
                <div className="task-md-chat-bubble-meta">
                  <span className="task-md-chat-author">{msg.author}</span>
                  <span className="task-md-chat-time">{formatChatTime(msg.createdAt)}</span>
                </div>
              </div>
              <p className="task-md-chat-text">{msg.text}</p>
            </div>
          ))
        )}
        {sending ? (
          <div className="task-md-chat-sending">
            <Spin size="small" /> Đang lưu...
          </div>
        ) : null}
      </div>

      <div ref={composerRef} className="task-md-chat-composer">
        <span className="task-md-chat-attach" aria-hidden>
          <PaperClipOutlined />
        </span>
        <Input.TextArea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={disabled ? 'Cần kết nối Supabase để chat' : 'Nhập tin nhắn...'}
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
          onPressEnter={event => {
            if (!event.shiftKey) {
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
