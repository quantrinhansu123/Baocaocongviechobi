import React, { useRef, useState } from 'react';
import { Button, DatePicker, Form, Input, Select, Tabs } from 'antd';
import type { FormInstance } from 'antd';
import {
  CalendarOutlined,
  CloseOutlined,
  FileTextOutlined,
  FlagOutlined,
  HistoryOutlined,
  PlusOutlined,
  SaveOutlined,
  StarFilled,
  UnorderedListOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { formatTaskDate, getEffectiveDueDate } from '../utils/taskDate';
import {
  completionBlockReason,
  milestonePercent,
  normalizeMilestones,
} from '../utils/taskSmart';
import type { PersonnelSelectOption } from '../services/auxiliaryData';
import type { TaskMilestone } from '../types/task';
import PersonnelMultiSelect from './PersonnelMultiSelect';
import TaskDocLinksField from './TaskDocLinksField';
import TaskProgressBar from './TaskProgressBar';

type TaskSmartDetailProps = {
  form: FormInstance;
  statusOptions: Array<{ value: string; label: string }>;
  assigneeOptions: PersonnelSelectOption[];
  followerOptions: PersonnelSelectOption[];
  deptLabel: string;
  blockLabel: string;
  taskCode: string;
  completed: boolean;
  saving: boolean;
  completing: boolean;
  canSave: boolean;
  personInitial: (name: string) => string;
  onSave: () => void;
  onComplete: () => void;
  onClose: () => void;
};

const SilentValue: React.FC<{ value?: unknown }> = () => null;

function asMilestones(value: unknown): TaskMilestone[] {
  return normalizeMilestones(value);
}

function milestoneState(item: TaskMilestone, index: number, activeIndex: number): string {
  if (item.done || index < activeIndex) return 'done';
  if (index === activeIndex) return 'active';
  return 'todo';
}

const TaskSmartDetail: React.FC<TaskSmartDetailProps> = ({
  form,
  statusOptions,
  assigneeOptions,
  followerOptions,
  deptLabel,
  blockLabel,
  taskCode,
  completed,
  saving,
  completing,
  canSave,
  personInitial,
  onSave,
  onComplete,
  onClose,
}) => {
  const [tab, setTab] = useState('content');
  const tienDo = Form.useWatch('tienDo', form);
  const percentRaw = Form.useWatch('tienDoPhanTram', form);
  const milestoneDriven = Boolean(Form.useWatch('milestoneDriven', form));
  const milestones = asMilestones(Form.useWatch('milestones', form));
  const ngayGiao = Form.useWatch('ngayGiao', form);
  const ycXong = Form.useWatch('ycXong', form);
  const giaHan1 = Form.useWatch('giaHan1', form);
  const giaHan2 = Form.useWatch('giaHan2', form);
  const giaHan3 = Form.useWatch('giaHan3', form);
  const anhHuong = Number(Form.useWatch('anhHuong', form) || 1);
  const canLD = Form.useWatch('canLD', form);
  const nguoiGiao = String(Form.useWatch('nguoiGiao', form) || '');
  const taiLieuLinks = Form.useWatch('taiLieuLinks', form);
  const docCount = Array.isArray(taiLieuLinks)
    ? taiLieuLinks.filter(item => item && (item.ten || item.link)).length
    : 0;

  const computedPercent = milestones.length ? milestonePercent(milestones) : 0;
  const percent = milestoneDriven && milestones.length ? computedPercent : Number(percentRaw) || 0;
  const activeIndex = milestones.findIndex(item => !item.done);
  const giaoLabel = formatTaskDate(ngayGiao);
  const gocLabel = formatTaskDate(ycXong);
  const extLabels = [giaHan1, giaHan2, giaHan3].map(value => formatTaskDate(value));
  const due = getEffectiveDueDate({
    deadline: gocLabel,
    giaHan1: extLabels[0],
    giaHan2: extLabels[1],
    giaHan3: extLabels[2],
  });
  const daysLeft = due ? due.startOf('day').diff(dayjs().startOf('day'), 'day') : null;
  const dueText = due ? due.format('DD/MM/YYYY') : '—';
  const currentExtIndex = extLabels.reduce((latest, label, index) => (label ? index : latest), -1);

  const setMilestones = (next: TaskMilestone[], drivePercent: boolean) => {
    const normalized = normalizeMilestones(next);
    form.setFieldsValue({
      milestones: normalized,
      milestoneDriven: drivePercent || normalized.some(item => item.done),
      tienDoPhanTram:
        drivePercent || normalized.some(item => item.done)
          ? milestonePercent(normalized)
          : form.getFieldValue('tienDoPhanTram'),
    });
  };

  const toggleMilestone = (id: string) => {
    setMilestones(
      milestones.map(item => (item.id === id ? { ...item, done: !item.done } : item)),
      true
    );
  };

  return (
    <div className="cvd">
      <Form.Item name="tienDoPhanTram" hidden><SilentValue /></Form.Item>
      <Form.Item name="milestones" hidden><SilentValue /></Form.Item>
      <Form.Item name="milestoneDriven" hidden><SilentValue /></Form.Item>
      <Form.Item name="anhHuong" hidden rules={[{ required: true, message: 'Chọn mức độ' }]}>
        <SilentValue />
      </Form.Item>

      <div className="cvd-head">
        <Form.Item name="congViec" rules={[{ required: true, message: 'Nhập công việc' }]} className="mb-0 cvd-title-item">
          <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} className="cvd-title" placeholder="Tên công việc" />
        </Form.Item>
        <p className="cvd-dept">
          {deptLabel}
          {blockLabel ? ` · ${blockLabel}` : ''}
        </p>
      </div>

      <div className="cvd-kpis">
        <article className="cvd-kpi">
          <span>Tiến độ</span>
          <strong>{percent}%</strong>
          <div className="cvd-kpi-bar"><i style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} /></div>
        </article>
        <article className="cvd-kpi">
          <span><CalendarOutlined /> Hạn hoàn thành</span>
          <strong className="is-due">{dueText}</strong>
          <em className={daysLeft !== null && daysLeft < 0 ? 'is-late' : ''}>
            {daysLeft === null ? 'Chưa có hạn' : daysLeft < 0 ? `Quá hạn ${Math.abs(daysLeft)} ngày` : daysLeft === 0 ? 'Đến hạn hôm nay' : `Còn ${daysLeft} ngày`}
          </em>
        </article>
        <article className="cvd-kpi">
          <span><StarFilled /> Mức ảnh hưởng</span>
          <strong>{anhHuong} sao</strong>
          <div className="cvd-stars">
            {[1, 2, 3, 4].map(level => (
              <button
                key={level}
                type="button"
                className={level <= anhHuong ? 'is-on' : ''}
                onClick={() => form.setFieldsValue({ anhHuong: level })}
                aria-label={`${level} sao`}
              >
                ★
              </button>
            ))}
          </div>
        </article>
        <article className="cvd-kpi">
          <span>Trạng thái</span>
          <Form.Item name="tienDo" className="mb-0" rules={[{ required: true, message: 'Chọn trạng thái' }]}>
            <Select size="small" options={statusOptions} disabled={!canSave} popupMatchSelectWidth={false} />
          </Form.Item>
        </article>
      </div>

      <div className="cvd-split">
        <div className="cvd-main">
          <Tabs
            activeKey={tab}
            onChange={setTab}
            className="cvd-tabs"
            items={[
              {
                key: 'content',
                label: 'Nội dung công việc',
                children: (
                  <div className="cvd-pane">
                    <label className="cvd-label"><FileTextOutlined /> Mô tả công việc</label>
                    <Form.Item name="moTa" className="mb-3">
                      <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} placeholder="Mô tả nội dung công việc..." />
                    </Form.Item>
                    <label className="cvd-label">Kết quả mong đợi</label>
                    <Form.Item name="ketQuaMongDoi" className="mb-3">
                      <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} placeholder="Kết quả cần đạt..." />
                    </Form.Item>
                    <div className="cvd-people">
                      <div>
                        <label className="cvd-label">Nhân sự phụ trách</label>
                        <div className="cvd-assignee">
                          <span>{personInitial(nguoiGiao)}</span>
                          <Form.Item name="nguoiGiao" className="mb-0 flex-1" rules={[{ required: true, message: 'Chọn người phụ trách' }]}>
                            <Select showSearch allowClear optionFilterProp="label" options={assigneeOptions} placeholder="Chọn nhân sự" disabled={!canSave} />
                          </Form.Item>
                        </div>
                      </div>
                      <div>
                        <label className="cvd-label">Người liên quan</label>
                        <Form.Item name="nguoiTheoDoi" className="mb-0">
                          <PersonnelMultiSelect options={followerOptions} placeholder="+ Thêm người liên quan" />
                        </Form.Item>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'progress',
                label: 'Cập nhật tiến độ',
                children: (
                  <div className="cvd-progress">
                    <div className="cvd-progress-bar">
                      <TaskProgressBar value={percent} />
                    </div>
                    <MilestoneEditor
                      milestones={milestones}
                      activeIndex={activeIndex}
                      onToggle={toggleMilestone}
                      onRename={(id, label) => {
                        const current = asMilestones(form.getFieldValue('milestones'));
                        if (!label.trim()) {
                          setMilestones(current.filter(item => item.id !== id), true);
                          return;
                        }
                        setMilestones(
                          current.map(item => (item.id === id ? { ...item, label } : item)),
                          milestoneDriven
                        );
                      }}
                      onRemove={id => {
                        const current = asMilestones(form.getFieldValue('milestones'));
                        setMilestones(current.filter(item => item.id !== id), true);
                      }}
                      onAdd={() =>
                        setMilestones(
                          [
                            ...milestones,
                            { id: `ms-${Date.now()}`, label: 'Mốc mới', done: false, required: true },
                          ],
                          milestoneDriven
                        )
                      }
                    />
                  </div>
                ),
              },
              {
                key: 'docs',
                label: `Tài liệu (${docCount})`,
                children: <TaskDocLinksField name="taiLieuLinks" size="small" />,
              },
            ]}
          />

          <section className="cvd-result">
            <div className="cvd-result-head">Cập nhật kết quả gần nhất</div>
            <Form.Item name="ketQua" className="mb-2">
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} placeholder="Nhập kết quả công việc đã thực hiện..." />
            </Form.Item>
            <div className="cvd-result-actions">
              <Button type="primary" icon={<SaveOutlined />} loading={saving} disabled={!canSave} onClick={onSave}>
                Cập nhật tiến độ
              </Button>
            </div>
          </section>
        </div>

        <aside className="cvd-side">
          <section className="cvd-side-card">
            <div className="cvd-side-head cvd-side-head--red"><WarningOutlined /> Vướng mắc / cần hỗ trợ</div>
            <div className="cvd-side-body">
              <Form.Item name="canLD" className="mb-2">
                <Select
                  size="small"
                  options={[
                    { value: 'Không', label: 'Không cần duyệt' },
                    { value: 'Có', label: 'Chờ duyệt' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="vuongMac" className="mb-0">
                <Input.TextArea autoSize={{ minRows: 3, maxRows: 5 }} placeholder="Nhập vướng mắc, rủi ro hoặc đề xuất hỗ trợ..." />
              </Form.Item>
              {canLD === 'Có' ? (
                <Form.Item name="noiDungCanTacDong" className="mb-0" style={{ marginTop: 8 }}>
                  <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} placeholder="Nội dung cần lãnh đạo duyệt..." />
                </Form.Item>
              ) : (
                <Form.Item name="noiDungCanTacDong" hidden><Input /></Form.Item>
              )}
            </div>
          </section>

          <section className="cvd-side-card">
            <div className="cvd-side-head cvd-side-head--blue">Thông tin chung</div>
            <div className="cvd-side-body">
              <div className="cvd-info-row">
                <span className="cvd-info-ico">▣</span>
                <strong>Mã công việc</strong>
                <span className="cvd-info-val">{taskCode || '—'}</span>
              </div>
              <div className="cvd-info-row">
                <span className="cvd-info-ico"><CalendarOutlined /></span>
                <strong>Ngày giao việc</strong>
                <Form.Item name="ngayGiao" className="mb-0 cvd-info-date">
                  <DatePicker format="DD/MM/YYYY" placeholder="—" allowClear size="small" suffixIcon={null} />
                </Form.Item>
              </div>
              <div className="cvd-info-row">
                <span className="cvd-info-ico"><CalendarOutlined /></span>
                <strong>Hạn hoàn thành</strong>
                <span className="cvd-info-val is-due">{dueText}</span>
              </div>
              <div className="cvd-info-row">
                <span className="cvd-info-ico is-star"><StarFilled /></span>
                <strong>Mức ảnh hưởng</strong>
                <span className="cvd-info-val">{anhHuong} sao</span>
              </div>
              <div className="cvd-info-row">
                <span className="cvd-info-ico">▶</span>
                <strong>Trạng thái</strong>
                <span className="cvd-info-val is-status">{String(tienDo || 'Đang thực hiện')}</span>
              </div>
              <div className="cvd-info-row">
                <span className="cvd-info-ico">▥</span>
                <strong>Tiến độ</strong>
                <span className="cvd-info-val">{percent}%</span>
              </div>
            </div>
          </section>

          <section className="cvd-side-card">
            <div className="cvd-side-head cvd-side-head--orange"><UnorderedListOutlined /> Danh sách mốc công việc</div>
            <div className="cvd-side-body cvd-timeline">
              {milestones.map((item, index) => {
                const state = milestoneState(item, index, activeIndex === -1 ? milestones.length : activeIndex);
                return (
                  <button key={item.id} type="button" className={`cvd-trow is-${state}`} onClick={() => toggleMilestone(item.id)}>
                    <i className={`cvd-dot is-${state}`} />
                    <span>
                      <strong>{item.label}</strong>
                      <small><CalendarOutlined /> {state === 'done' && giaoLabel ? giaoLabel : '—'}</small>
                    </span>
                    <em>{state === 'done' ? 'Hoàn thành' : state === 'active' ? 'Đang thực hiện' : 'Chưa thực hiện'}</em>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="cvd-side-card">
            <div className="cvd-side-head cvd-side-head--blue"><HistoryOutlined /> Lịch sử gia hạn</div>
            <div className="cvd-side-body cvd-timeline cvd-ext">
              <div className={`cvd-trow${currentExtIndex < 0 ? ' is-active' : ''}`}>
                <i className={`cvd-dot${currentExtIndex < 0 ? ' is-active' : ''}`} />
                <strong>Hạn gốc</strong>
                <Form.Item name="ycXong" className="mb-0 cvd-ext-date">
                  <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" allowClear size="small" inputReadOnly={false} />
                </Form.Item>
              </div>
              {([1, 2, 3] as const).map(index => (
                <div key={index} className={`cvd-trow${currentExtIndex === index - 1 ? ' is-active' : ''}`}>
                  <i className={`cvd-dot${currentExtIndex === index - 1 ? ' is-active' : ''}`} />
                  <strong>Gia hạn {index}</strong>
                  <Form.Item name={`giaHan${index}`} className="mb-0 cvd-ext-date">
                    <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" allowClear size="small" inputReadOnly={false} />
                  </Form.Item>
                  {extLabels[index - 1] ? (
                    <Form.Item name={`lyDoGiaHan${index}`} className="mb-0 cvd-reason">
                      <Input size="small" placeholder="Lý do gia hạn" />
                    </Form.Item>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <div className="cvd-footer">
            <Button className="cvd-btn-cancel" icon={<CloseOutlined />} onClick={onClose}>Hủy</Button>
            <Button className="cvd-btn-save" icon={<SaveOutlined />} loading={saving} disabled={!canSave} onClick={onSave}>
              Lưu cập nhật
            </Button>
            <Button className="cvd-btn-done" icon={<FlagOutlined />} loading={completing} disabled={!canSave || completed} onClick={onComplete}>
              {completed ? 'Đã hoàn thành' : 'Hoàn thành công việc'}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
};

function MilestoneEditor({
  milestones,
  activeIndex,
  onToggle,
  onRename,
  onRemove,
  onAdd,
}: {
  milestones: TaskMilestone[];
  activeIndex: number;
  onToggle: (id: string) => void;
  onRename: (id: string, label: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  const removedIds = useRef(new Set<string>());
  return (
    <div className="cvd-ms-edit">
      {milestones.map((item, index) => {
        if (removedIds.current.has(item.id)) return null;
        const state = milestoneState(item, index, activeIndex === -1 ? milestones.length : activeIndex);
        return (
          <div key={item.id} className="cvd-ms-row">
            <button type="button" className={`cvd-ms-tick is-${state}`} onClick={() => onToggle(item.id)}>
              {state === 'done' ? '☑' : '☐'}
            </button>
            <Input
              value={item.label}
              variant="borderless"
              onChange={event => {
                const next = event.target.value;
                if (!next.trim()) {
                  removedIds.current.add(item.id);
                  onRemove(item.id);
                  return;
                }
                onRename(item.id, next);
              }}
            />
            <button type="button" className="cvd-ms-x" onClick={() => onRemove(item.id)} aria-label="Xóa mốc">×</button>
          </div>
        );
      })}
      <button type="button" className="cvd-ms-add" onClick={onAdd}>
        <PlusOutlined /> Thêm mốc
      </button>
    </div>
  );
}

export function readCompletionBlock(form: FormInstance): string | null {
  const values = form.getFieldsValue([
    'ketQua',
    'milestones',
    'giaHan1',
    'giaHan2',
    'giaHan3',
    'lyDoGiaHan1',
    'lyDoGiaHan2',
    'lyDoGiaHan3',
  ]);
  return completionBlockReason({
    ketQua: values.ketQua as string,
    milestones: asMilestones(values.milestones),
    giaHan1: values.giaHan1,
    giaHan2: values.giaHan2,
    giaHan3: values.giaHan3,
    lyDoGiaHan1: values.lyDoGiaHan1,
    lyDoGiaHan2: values.lyDoGiaHan2,
    lyDoGiaHan3: values.lyDoGiaHan3,
  });
}

export default TaskSmartDetail;
