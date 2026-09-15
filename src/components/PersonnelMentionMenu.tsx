import React, { useEffect, useMemo, useRef } from 'react';
import type { PersonnelSelectOption } from '../services/auxiliaryData';

export type MentionMatch = {
  start: number;
  end: number;
  query: string;
};

/** Tìm đoạn @đang-gõ ngay trước caret (cho phép khoảng trắng trong tên). */
export function findActiveMention(value: string, caret: number): MentionMatch | null {
  if (caret < 1) return null;
  const before = value.slice(0, caret);
  const match = before.match(/(?:^|[\s\n\r])@([^\n\r@]*)$/);
  if (!match) return null;
  const query = match[1] ?? '';
  const start = caret - query.length - 1;
  if (start < 0 || value[start] !== '@') return null;
  return { start, end: caret, query };
}

function foldVi(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi');
}

export function filterPersonnelMentions(
  options: PersonnelSelectOption[],
  query: string,
  limit = 8
): PersonnelSelectOption[] {
  const q = foldVi(query.trim());
  const list = !q
    ? options
    : options.filter(opt => {
        const name = foldVi(opt.label);
        const desc = foldVi(opt.description || '');
        return name.includes(q) || desc.includes(q);
      });
  if (!limit || limit < 0) return list;
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Lấy các tên nhân sự được @ trong nội dung (ưu tiên tên dài hơn). */
export function extractMentionedNames(text: string, names: string[]): string[] {
  if (!text || names.length === 0) return [];
  const found: string[] = [];
  const sorted = [...new Set(names.map(n => n.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length
  );
  for (const name of sorted) {
    const re = new RegExp(`@${escapeRegExp(name)}(?=$|[\\s,.;:!?])`, 'i');
    if (re.test(text) && !found.some(item => item.toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi'))) {
      found.push(name);
    }
  }
  return found;
}

export function textMentionsName(text: string, name: string): boolean {
  return extractMentionedNames(text, [name]).length > 0;
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
            key={`${opt.value}-${opt.description || ''}-${index}`}
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
