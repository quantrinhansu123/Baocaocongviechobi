import React from 'react';
import { Progress } from 'antd';

type TaskProgressBarProps = {
  value?: number | null;
  size?: 'small' | 'default';
  className?: string;
  showInfo?: boolean;
};

export function clampProgressPercent(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').replace(/%/g, '').trim());
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

const TaskProgressBar: React.FC<TaskProgressBarProps> = ({
  value = 0,
  size = 'small',
  className = '',
  showInfo = true,
}) => {
  const percent = clampProgressPercent(value);
  const status = percent >= 100 ? 'success' : percent > 0 ? 'active' : 'normal';

  return (
    <div className={`task-progress-bar ${className}`} data-task-action onClick={event => event.stopPropagation()}>
      <Progress
        percent={percent}
        size={size === 'small' ? 'small' : undefined}
        status={status}
        strokeColor={percent >= 100 ? '#16a34a' : percent >= 60 ? '#F38320' : '#1E386B'}
        showInfo={showInfo}
        format={p => `${p ?? 0}%`}
      />
    </div>
  );
};

export default TaskProgressBar;
