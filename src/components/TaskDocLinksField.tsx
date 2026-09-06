import React, { useState } from 'react';
import { Button, Form, Input, Modal } from 'antd';
import {
  DeleteOutlined,
  ExportOutlined,
  FileTextOutlined,
  LinkOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { formatUrlValue } from '../services/taskData';

type TaskDocLinksFieldProps = {
  name?: string;
  size?: 'small' | 'middle' | 'large';
  variant?: 'default' | 'mobileDocs';
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

const MobileDocRow: React.FC<{
  listName: string;
  fieldName: number;
  onRemove: () => void;
}> = ({ listName, fieldName, onRemove }) => {
  const ten = String(Form.useWatch([listName, fieldName, 'ten']) || '');
  const link = String(Form.useWatch([listName, fieldName, 'link']) || '');
  const raw = link.trim();

  return (
    <div className="mtd-doc">
      <FileTextOutlined className="mtd-doc-icon" />
      <div className="mtd-doc-txt">
        <div className="mtd-doc-name">{ten || 'Tài liệu'}</div>
        <div className="mtd-doc-url">{raw || 'https://…'}</div>
      </div>
      <button
        type="button"
        className="mtd-doc-btn"
        aria-label="Mở tài liệu"
        disabled={!raw}
        onClick={() => {
          const url = formatUrlValue(raw);
          if (!url) return;
          window.open(url, '_blank', 'noopener,noreferrer');
        }}
      >
        <ExportOutlined />
      </button>
      <button type="button" className="mtd-doc-btn is-del" aria-label="Xoá tài liệu" onClick={onRemove}>
        <DeleteOutlined />
      </button>
      <Form.Item name={[fieldName, 'ten']} hidden>
        <Input />
      </Form.Item>
      <Form.Item name={[fieldName, 'link']} hidden>
        <Input />
      </Form.Item>
    </div>
  );
};

const TaskDocLinksField: React.FC<TaskDocLinksFieldProps> = ({
  name = 'taiLieuLinks',
  size = 'small',
  variant = 'default',
}) => {
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftTen, setDraftTen] = useState('');
  const [draftLink, setDraftLink] = useState('');

  if (variant === 'mobileDocs') {
    return (
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <>
            <div className="mtd-docs">
              {fields.map(field => (
                <MobileDocRow
                  key={field.key}
                  listName={name}
                  fieldName={field.name}
                  onRemove={() => remove(field.name)}
                />
              ))}
            </div>
            <button
              type="button"
              className="mtd-add-link"
              onClick={() => {
                setDraftTen('');
                setDraftLink('');
                setDraftOpen(true);
              }}
            >
              <PlusOutlined /> Thêm link tài liệu
            </button>
            <Modal
              title="Thêm link tài liệu"
              open={draftOpen}
              okText="Thêm"
              cancelText="Huỷ"
              onCancel={() => setDraftOpen(false)}
              onOk={() => {
                if (!draftTen.trim() && !draftLink.trim()) {
                  setDraftOpen(false);
                  return;
                }
                add({ ten: draftTen.trim(), link: draftLink.trim() });
                setDraftOpen(false);
              }}
              destroyOnHidden
            >
              <div className="flex flex-col gap-3 mt-2">
                <Input
                  prefix={<FileTextOutlined className="text-gray-400" />}
                  placeholder="Tên tài liệu"
                  value={draftTen}
                  onChange={e => setDraftTen(e.target.value)}
                />
                <Input
                  prefix={<LinkOutlined className="text-gray-400" />}
                  placeholder="https://..."
                  value={draftLink}
                  onChange={e => setDraftLink(e.target.value)}
                />
              </div>
            </Modal>
          </>
        )}
      </Form.List>
    );
  }

  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <div className="task-doc-links">
          {fields.map(field => (
            <div key={field.key} className="task-doc-links-row">
              <Form.Item name={[field.name, 'ten']} className="mb-0 task-doc-links-ten">
                <Input
                  size={size}
                  prefix={<FileTextOutlined className="text-gray-400" />}
                  placeholder="Tên tài liệu"
                  allowClear
                />
              </Form.Item>
              <Form.Item name={[field.name, 'link']} className="mb-0 task-doc-links-url">
                <Input
                  size={size}
                  prefix={<LinkOutlined className="text-gray-400" />}
                  placeholder="https://..."
                  allowClear
                />
              </Form.Item>
              <OpenLinkButton listName={name} index={field.name} size={size} />
              <Button
                size={size}
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => remove(field.name)}
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
