import React from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

type BackButtonProps = {
  to?: string;
  onClick?: () => void;
  label?: string;
  /** Dùng trên nền cam/xanh đậm */
  variant?: 'default' | 'light';
  className?: string;
  size?: 'small' | 'middle' | 'large';
};

const BackButton: React.FC<BackButtonProps> = ({
  to,
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
    if (to) {
      navigate(to);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  const light = variant === 'light';

  return (
    <Button
      type={light ? 'default' : 'default'}
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
