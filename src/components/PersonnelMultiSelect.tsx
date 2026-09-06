import React from 'react';
import { Checkbox, Select } from 'antd';
import type { PersonnelSelectOption } from '../services/auxiliaryData';

type PersonnelMultiSelectProps = {
  value?: string[];
  onChange?: (value: string[]) => void;
  options: PersonnelSelectOption[];
  placeholder?: string;
  notFoundContent?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement;
};

/** Chọn nhiều nhân sự — dropdown có tick checkbox. */
const PersonnelMultiSelect: React.FC<PersonnelMultiSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Chọn người theo dõi',
  notFoundContent,
  disabled,
  className,
  getPopupContainer,
}) => {
  return (
    <Select
      mode="multiple"
      allowClear
      showSearch
      optionFilterProp="label"
      value={value}
      onChange={onChange}
      options={options}
      optionLabelProp="value"
      placeholder={placeholder}
      notFoundContent={notFoundContent}
      disabled={disabled}
      className={className}
      maxTagCount="responsive"
      menuItemSelectedIcon={null}
      getPopupContainer={getPopupContainer}
      optionRender={(option, info) => {
        const data = option.data as PersonnelSelectOption;
        return (
          <div className="flex items-start gap-2 py-0.5">
            <Checkbox checked={Boolean(info.selected)} className="mt-0.5 pointer-events-none" />
            <div className="min-w-0 leading-tight">
              <div className="font-semibold text-[#0f274d]">{data.value}</div>
              {data.description ? (
                <div className="text-[11px] text-gray-500">{data.description}</div>
              ) : null}
            </div>
          </div>
        );
      }}
    />
  );
};

export default PersonnelMultiSelect;
