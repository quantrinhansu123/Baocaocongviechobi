import React from 'react';
import { Button, Dropdown, Popconfirm } from 'antd';
import {
  MoreOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

type TaskActionMenuProps = {
  completed?: boolean;
  disabled?: boolean;
  completing?: boolean;
  deleting?: boolean;
  onComplete?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleteTitle?: string;
  className?: string;
};

const TaskActionMenu: React.FC<TaskActionMenuProps> = ({
  completed = false,
  disabled = false,
  completing = false,
  deleting = false,
  onComplete,
  onEdit,
  onDelete,
  deleteTitle = 'Xoá công việc này trên Supabase?',
  className = '',
}) => {
  return (
    <div
      className={`task-action-menu ${className}`}
      data-task-action
      onClick={event => event.stopPropagation()}
      onMouseDown={event => event.stopPropagation()}
    >
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        getPopupContainer={() => document.body}
        dropdownRender={() => (
          <div className="task-action-menu-panel">
            {!completed && onComplete ? (
              <Button
                type="primary"
                size="large"
                block
                className="task-action-menu-btn task-action-menu-btn--done"
                icon={<CheckCircleOutlined />}
                loading={completing}
                disabled={disabled}
                onClick={onComplete}
              >
                Đã hoàn thành
              </Button>
            ) : null}
            <Button
              size="large"
              block
              className="task-action-menu-btn"
              icon={<EditOutlined />}
              onClick={onEdit}
            >
              Sửa
            </Button>
            <Popconfirm
              title={deleteTitle}
              okText="Xoá"
              cancelText="Huỷ"
              okButtonProps={{ danger: true, loading: deleting }}
              onConfirm={onDelete}
              disabled={disabled}
              zIndex={11000}
              getPopupContainer={() => document.body}
            >
              <Button
                size="large"
                block
                danger
                className="task-action-menu-btn"
                icon={<DeleteOutlined />}
                loading={deleting}
                disabled={disabled}
              >
                Xóa
              </Button>
            </Popconfirm>
          </div>
        )}
      >
        <Button
          type="text"
          size="middle"
          className="task-action-menu-trigger"
          icon={<MoreOutlined />}
          aria-label="Thao tác"
          title="Thao tác"
        />
      </Dropdown>
    </div>
  );
};

export default TaskActionMenu;
