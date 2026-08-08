import React from 'react';
import { Button } from 'antd';
import { BorderOutlined, CheckSquareOutlined } from '@ant-design/icons';

type TaskCompleteTickProps = {
  completed?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onComplete?: () => void;
  className?: string;
};

const TaskCompleteTick: React.FC<TaskCompleteTickProps> = ({
  completed = false,
  loading = false,
  disabled = false,
  onComplete,
  className = '',
}) => {
  return (
    <div
      className={`task-complete-tick-wrap ${className}`}
      data-task-action
      onClick={event => event.stopPropagation()}
      onMouseDown={event => event.stopPropagation()}
    >
      <Button
        type="text"
        className={`task-complete-tick ${completed ? 'task-complete-tick--done' : ''}`}
        icon={completed ? <CheckSquareOutlined /> : <BorderOutlined />}
        loading={loading}
        disabled={disabled || completed || !onComplete}
        title={completed ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
        aria-label={completed ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
        onClick={() => {
          if (!completed && onComplete) {
            onComplete();
          }
        }}
      />
    </div>
  );
};

export default TaskCompleteTick;
