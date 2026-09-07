import React, { useEffect, useMemo, useRef } from 'react';
import type { PersonnelSelectOption } from '../services/auxiliaryData';

export type MentionMatch = {
  start: number;
  end: number;
  query: string;
};

/** Tìm đoạn @đang-gõ ngay trước caret (sau khoảng trắng / đầu dòng). */
export function findActiveMention(value: string, caret: number): MentionMatch | null {
  if (caret < 1) return null;
  const before = value.slice(0, caret);
  const match = before.match(/(?:^|[\s\n\r])@([^\s@]*)$/);
  if (!match) return null;
  const query = match[1] ?? '';
  const start = caret - query.length - 1;
  if (start < 0 || value[start] !== '@') return null;
  return { start, end: caret, query };
}

export function filterPersonnelMentions(
  options: PersonnelSelectOption[],
  query: string,
  limit = 8
): PersonnelSelectOption[] {
  const q = query.trim().toLocaleLowerCase('vi');
  const list = !q
    ? options
    : options.filter(opt => {
        const name = opt.label.toLocaleLowerCase('vi');
        const desc = (opt.description || '').toLocaleLowerCase('vi');
        return name.includes(q) || desc.includes(q);
      });
  return list.slice(0, limit);
}

export function applyPersonnelMention(
  value: string,
  match: MentionMatch,
  name: string
): { next: string; caret: number } {
  const insert = `@${name} `;
  const next = `${value.slice(0, match.start)}${insert}${value.slice(match.end)}`;
  return { next, caret: match.start + insert.length };
}

type PersonnelMentionMenuProps = {
  open: boolean;
  options: PersonnelSelectOption[];
  activeIndex: number;
  onHoverIndex: (index: number) => void;
  onSelect: (option: PersonnelSelectOption) => void;
  emptyText?: string;
};

const PersonnelMentionMenu: React.FC<PersonnelMentionMenuProps> = ({
  open,
  options,
  activeIndex,
  onHoverIndex,
  onSelect,
  emptyText = 'Không tìm thấy nhân sự',
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-mention-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const items = useMemo(() => options, [options]);

  if (!open) return null;

  return (
    <div
      ref={listRef}
      className="work-notes-mention-menu"
      role="listbox"
      aria-label="Gắn nhân sự"
    >
      {items.length === 0 ? (
        <div className="work-notes-mention-empty">{emptyText}</div>
      ) : (
        items.map((opt, index) => (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            data-mention-index={index}
            className={`work-notes-mention-item${index === activeIndex ? ' is-active' : ''}`}
            onMouseEnter={() => onHoverIndex(index)}
            onMouseDown={event => {
              event.preventDefault();
              onSelect(opt);
            }}
          >
            <span className="work-notes-mention-name">{opt.label}</span>
            {opt.description ? (
              <span className="work-notes-mention-desc">{opt.description}</span>
            ) : null}
          </button>
        ))
      )}
    </div>
  );
};

export default PersonnelMentionMenu;
