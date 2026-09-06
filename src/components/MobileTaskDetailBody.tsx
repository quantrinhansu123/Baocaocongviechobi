import React, { useMemo, useRef } from 'react';
import { DatePicker, Form, Input, InputNumber, Select } from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { Star } from 'lucide-react';
import dayjs from 'dayjs';
import type { FormInstance } from 'antd/es/form';
import TaskDocLinksField from './TaskDocLinksField';
import PersonnelMultiSelect from './PersonnelMultiSelect';
import { clampProgressPercent } from './TaskProgressBar';
import type { PersonnelSelectOption } from '../services/auxiliaryData';
import { TIEN_DO_EDIT_OPTIONS } from '../services/taskData';

const PROGRESS_PRESETS = [0, 25, 50, 75, 100] as const;
const IMPACT_LABELS = ['', 'Rất thấp', 'Thấp', 'Trung bình', 'Cao'] as const;

type MobileTaskDetailBodyProps = {
  form: FormInstance;
  taskCode: string;
  statusLabel: string;
  blockLabel: string;
  deptLabel: string;
  ngayGiaoDisplay: string;
  ngayCapNhatDisplay: string;
  assigneeName: string;
  assigneeOptions: PersonnelSelectOption[];
  followerOptions: PersonnelSelectOption[];
  saving: boolean;
  canSave: boolean;
  onBack: () => void;
  onSave: () => void;
  personInitial: (name: string) => string;
};

function daysLeftLabel(ycXong: unknown): string {
  const d = dayjs.isDayjs(ycXong) ? ycXong : null;
  if (!d || !d.isValid()) return '';
  const diff = d.startOf('day').diff(dayjs().startOf('day'), 'day');
  if (diff > 0) return `còn ${diff} ngày`;
  if (diff === 0) return 'hết hạn hôm nay';
  return `quá ${Math.abs(diff)} ngày`;
}

const MobileTaskDetailBody: React.FC<MobileTaskDetailBodyProps> = ({
  form,
  taskCode,
  statusLabel,
  blockLabel,
  deptLabel,
  ngayGiaoDisplay,
  ngayCapNhatDisplay,
  assigneeName: propsAssigneeName,
  assigneeOptions,
  followerOptions,
  saving,
  canSave,
  onBack,
  onSave,
  personInitial,
}) => {
  const followerPickerRef = useRef<HTMLDivElement>(null);
  const percent = clampProgressPercent(Form.useWatch('tienDoPhanTram', form));
  const impact = Number(Form.useWatch('anhHuong', form) || 1);
  const canLD = String(Form.useWatch('canLD', form) || 'Không');
  const ycXong = Form.useWatch('ycXong', form);
  const assigneeName =
    String(Form.useWatch('nguoiGiao', form) || propsAssigneeName || '').trim();
  const statusFromForm = String(Form.useWatch('tienDo', form) || statusLabel || '').trim();
  const followers = (Form.useWatch('nguoiTheoDoi', form) as string[] | undefined) ?? [];
  const leftLabel = useMemo(() => daysLeftLabel(ycXong), [ycXong]);

  const setPercent = (value: number) => {
    form.setFieldsValue({ tienDoPhanTram: clampProgressPercent(value) });
  };

  const openFollowers = () => {
    const trigger = followerPickerRef.current?.querySelector(
      '.ant-select-selector'
    ) as HTMLElement | null;
    trigger?.click();
  };

  return (
    <div className="mtd">
      <header className="mtd-head">
        <div className="mtd-head-row">
          <button type="button" className="mtd-back" onClick={onBack}>
            <ArrowLeftOutlined /> Quay lại
          </button>
        </div>
        <div className="mtd-crumb">
          <span className="mtd-crumb-up">{blockLabel || 'Công việc'}</span>
          <span style={{ color: 'var(--mtd-n400)' }}>/</span>
          <span className="mtd-crumb-cur">{deptLabel || '—'}</span>
        </div>
      </header>

      <div className="mtd-body">
        <Form.Item name="congViec" rules={[{ required: true, message: 'Nhập công việc' }]} className="mb-0">
          <Input.TextArea className="mtd-title" autoSize={{ minRows: 1, maxRows: 4 }} placeholder="Tên công việc" />
        </Form.Item>

        <div className="mtd-meta">
          <span>{taskCode}</span>
          <span className="mtd-meta-sep" />
          <span className="mtd-tag">{statusFromForm || 'Đang thực hiện'}</span>
        </div>

        <p className="mtd-kicker">Tiến độ</p>
        <div className="mtd-pct">
          <span className="mtd-pct-num">{percent}</span>
          <span className="mtd-pct-unit">%</span>
          {leftLabel ? <span className="mtd-pct-left">{leftLabel}</span> : null}
        </div>
        <Form.Item
          name="tienDoPhanTram"
          rules={[
            { required: true, message: 'Nhập tiến độ' },
            { type: 'number', min: 0, max: 100, message: '0–100' },
          ]}
          className="!hidden"
        >
          <InputNumber className="!hidden" />
        </Form.Item>
        <input
          className="mtd-range"
          type="range"
          min={0}
          max={100}
          step={5}
          value={percent}
          aria-label="Tiến độ"
          style={{ ['--mtd-fill' as string]: `${percent}%` }}
          onChange={e => setPercent(Number(e.target.value))}
        />
        <div className="mtd-seg mtd-gap" style={{ marginTop: 2 }}>
          {PROGRESS_PRESETS.map(v => (
            <button
              key={v}
              type="button"
              className={`mtd-seg-opt${percent === v ? ' is-on' : ''}`}
              onClick={() => setPercent(v)}
            >
              {v}%
            </button>
          ))}
        </div>

        <p className="mtd-kicker">Mức ảnh hưởng</p>
        <Form.Item name="anhHuong" rules={[{ required: true, message: 'Chọn mức độ' }]} className="!hidden">
          <InputNumber className="!hidden" />
        </Form.Item>
        <div className="mtd-stars">
          {[1, 2, 3, 4].map(level => (
            <button
              key={level}
              type="button"
              className={`mtd-star${level <= impact ? ' is-on' : ''}`}
              aria-label={`${level} sao`}
              onClick={() => form.setFieldsValue({ anhHuong: level })}
            >
              <Star size={26} className={level <= impact ? 'fill-current' : ''} />
            </button>
          ))}
          <span className="mtd-star-label">{IMPACT_LABELS[impact] || `${impact} sao`}</span>
        </div>

        <p className="mtd-kicker">Người liên quan</p>
        <div className="mtd-people">
          <div className="mtd-stack">
            {assigneeName ? (
              <span className="mtd-chip mtd-chip-me" title={assigneeName}>
                {personInitial(assigneeName)}
              </span>
            ) : null}
            {followers.slice(0, 4).map(name => (
              <span key={name} className="mtd-chip" title={name}>
                {personInitial(name)}
              </span>
            ))}
          </div>
          <button type="button" className="mtd-add-person" onClick={openFollowers}>
            <UserAddOutlined /> Thêm người
          </button>
        </div>
        <div className="mtd-follower-hidden" ref={followerPickerRef} aria-hidden>
          <Form.Item name="nguoiGiao" className="mb-2" rules={[{ required: true, message: 'Chọn người phụ trách' }]}>
            <Select
              showSearch
              allowClear
              optionFilterProp="label"
              options={assigneeOptions}
              optionLabelProp="value"
              placeholder="Người phụ trách"
            />
          </Form.Item>
          <Form.Item name="nguoiTheoDoi" className="mb-0">
            <PersonnelMultiSelect options={followerOptions} placeholder="Thêm người liên quan" />
          </Form.Item>
        </div>

        <p className="mtd-kicker mtd-kicker-tight">Thời gian &amp; thông tin</p>
        <div className="mtd-row">
          <span className="mtd-row-k">Ngày tạo</span>
          <span className={`mtd-row-v${ngayGiaoDisplay ? '' : ' is-empty'}`}>
            {ngayGiaoDisplay || 'Chưa có'}
          </span>
        </div>
        <div className="mtd-row">
          <span className="mtd-row-k">Hạn hoàn thành</span>
          <div className="mtd-row-v">
            <Form.Item name="ycXong" className="mb-0">
              <DatePicker format="DD/MM/YYYY" placeholder="Chọn hạn" allowClear inputReadOnly />
            </Form.Item>
          </div>
        </div>
        <div className="mtd-row">
          <span className="mtd-row-k">Cập nhật lần cuối</span>
          <span className={`mtd-row-v${ngayCapNhatDisplay ? '' : ' is-empty'}`}>
            {ngayCapNhatDisplay || 'Chưa có'}
          </span>
        </div>
        <div className="mtd-row">
          <span className="mtd-row-k">Người giao</span>
          <span className={`mtd-row-v${assigneeName ? '' : ' is-empty'}`}>
            {assigneeName || 'Chưa giao'}
          </span>
        </div>
        <div className="mtd-row">
          <span className="mtd-row-k">Trạng thái</span>
          <div className="mtd-row-v">
            <Form.Item name="tienDo" className="mb-0">
              <Select
                options={[...TIEN_DO_EDIT_OPTIONS]}
                variant="borderless"
                popupMatchSelectWidth={false}
                className="mtd-status-select"
              />
            </Form.Item>
          </div>
        </div>
        <Form.Item name="ngayGiao" hidden>
          <DatePicker />
        </Form.Item>

        <p className="mtd-kicker mtd-section-spacer">Kết quả &amp; vướng mắc</p>
        <div className="mtd-field">
          <Form.Item name="ketQua" label="Kết quả đến hôm nay" className="mb-0">
            <Input.TextArea rows={3} placeholder="Kết quả đạt được..." />
          </Form.Item>
        </div>
        <div className="mtd-field mtd-gap">
          <Form.Item name="vuongMac" label="Vướng mắc cần hỗ trợ" className="mb-0">
            <Input.TextArea rows={2} placeholder="Chưa có vướng mắc" />
          </Form.Item>
        </div>

        <p className="mtd-kicker mtd-kicker-tight">Tài liệu</p>
        <TaskDocLinksField name="taiLieuLinks" variant="mobileDocs" />

        <p className="mtd-kicker mtd-section-spacer">Lãnh đạo tác động</p>
        <Form.Item name="canLD" className="!hidden">
          <Input className="!hidden" />
        </Form.Item>
        <div className="mtd-seg" style={{ marginBottom: 16 }}>
          <button
            type="button"
            className={`mtd-seg-opt${canLD !== 'Có' ? ' is-on' : ''}`}
            style={{ minHeight: 42, fontSize: 14 }}
            onClick={() => form.setFieldsValue({ canLD: 'Không' })}
          >
            Không cần
          </button>
          <button
            type="button"
            className={`mtd-seg-opt${canLD === 'Có' ? ' is-on' : ''}`}
            style={{ minHeight: 42, fontSize: 14 }}
            onClick={() => form.setFieldsValue({ canLD: 'Có' })}
          >
            Cần tác động
          </button>
        </div>
        {canLD === 'Có' ? (
          <div className="mtd-field">
            <Form.Item name="noiDungCanTacDong" label="Nội dung cần tác động" className="mb-0">
              <Input.TextArea rows={2} placeholder="Mô tả nội dung cần lãnh đạo tác động…" />
            </Form.Item>
          </div>
        ) : null}

        <p className="mtd-kicker mtd-section-spacer">Gia hạn</p>
        <div className="mtd-grid3">
          <Form.Item name="giaHan1" label="GH 1" className="mb-0">
            <DatePicker className="w-full" format="DD/MM/YYYY" inputReadOnly />
          </Form.Item>
          <Form.Item name="giaHan2" label="GH 2" className="mb-0">
            <DatePicker className="w-full" format="DD/MM/YYYY" inputReadOnly />
          </Form.Item>
          <Form.Item name="giaHan3" label="GH 3" className="mb-0">
            <DatePicker className="w-full" format="DD/MM/YYYY" inputReadOnly />
          </Form.Item>
        </div>

        <p className="mtd-kicker">Lịch sử hoạt động</p>
        <div className="mtd-history">
          <ClockCircleOutlined style={{ fontSize: 20, color: 'var(--mtd-n600)', marginTop: 2 }} />
          <p>Chưa có hoạt động nào. Mọi thay đổi tiến độ sẽ được ghi lại ở đây.</p>
        </div>
      </div>

      <div className="mtd-save-bar">
        <button type="button" className="mtd-save" disabled={!canSave || saving} onClick={onSave}>
          {saving ? 'Đang lưu…' : 'Lưu cập nhật'}
        </button>
      </div>
    </div>
  );
};

export default MobileTaskDetailBody;
