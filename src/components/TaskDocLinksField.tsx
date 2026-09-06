import React from 'react';
import { Button, Form, Input } from 'antd';
import { DeleteOutlined, ExportOutlined, FileTextOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import { formatUrlValue } from '../services/taskData';

type TaskDocLinksFieldProps = {
  name?: string;
  size?: 'small' | 'middle' | 'large';
};

const OpenLinkButton: React.FC<{
  listName: string;
  index: number;
  size?: 'small' | 'middle' | 'large';
}> = ({ listName, index, size = 'small' }) => {
  const value = Form.useWatch([listName, index, 'link']);
  const raw = String(value || '').trim();

  return (
    <Button
      size={size}
      type="primary"
      icon={<ExportOutlined />}
      disabled={!raw}
      className="bg-[#1E386B] border-[#1E386B]"
      onClick={() => {
        const url = formatUrlValue(raw);
        if (!url) return;
        window.open(url, '_blank', 'noopener,noreferrer');
      }}
    >
      Mở
    </Button>
  );
};

const TaskDocLinksField: React.FC<TaskDocLinksFieldProps> = ({ name = 'taiLieuLinks', size = 'small' }) => {
  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <div className="task-doc-links">
          {fields.map(({ key, name: fieldName, ...restField }) => (
            <div key={key} className="task-doc-links-row">
              <Form.Item {...restField} name={[fieldName, 'ten']} className="mb-0 task-doc-links-ten">
                <Input
                  size={size}
                  prefix={<FileTextOutlined className="text-gray-400" />}
                  placeholder="Tên tài liệu"
                  allowClear
                />
              </Form.Item>
              <Form.Item {...restField} name={[fieldName, 'link']} className="mb-0 task-doc-links-url">
                <Input
                  size={size}
                  prefix={<LinkOutlined className="text-gray-400" />}
                  placeholder="https://..."
                  allowClear
                />
              </Form.Item>
              <OpenLinkButton listName={name} index={fieldName} size={size} />
              <Button
                size={size}
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => remove(fieldName)}
                aria-label="Xóa link"
              />
            </div>
          ))}
          <Button
            type="dashed"
            size={size}
            block
            icon={<PlusOutlined />}
            onClick={() => add({ ten: '', link: '' })}
            className="task-doc-links-add"
          >
            Thêm link
          </Button>
        </div>
      )}
    </Form.List>
  );
};

export default TaskDocLinksField;
