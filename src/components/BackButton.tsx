import React from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

type BackButtonProps = {
  /** Fallback khi không còn lịch sử trong app */
  fallbackTo?: string;
  onClick?: () => void;
  label?: string;
  /** Dùng trên nền cam/xanh đậm */
  variant?: 'default' | 'light';
  className?: string;
  size?: 'small' | 'middle' | 'large';
};

function canGoBackInApp(): boolean {
  const idx = (window.history.state as { idx?: number } | null)?.idx;
  if (typeof idx === 'number') {
    return idx > 0;
  }
  return window.history.length > 1;
}

const BackButton: React.FC<BackButtonProps> = ({
  fallbackTo = '/',
  onClick,
  label = 'Quay lại',
  variant = 'default',
  className = '',
  size = 'middle',
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (canGoBackInApp()) {
      navigate(-1);
      return;
    }
    navigate(fallbackTo);
  };

  const light = variant === 'light';

  return (
    <Button
      type="default"
      size={size}
      icon={<ArrowLeftOutlined />}
      onClick={handleClick}
      className={`shrink-0 font-bold ${
        light
          ? 'bg-white/15 text-white border-white/40 hover:!bg-white/25 hover:!text-white hover:!border-white'
          : 'text-[#1E386B] border-[#1E386B]/30 hover:!text-[#F38320] hover:!border-[#F38320]'
      } ${className}`}
    >
      {label}
    </Button>
  );
};

export default BackButton;
