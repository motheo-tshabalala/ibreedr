// src/components/VerificationBadge.jsx
import React from 'react';
import { CheckCircle, Shield, Phone, UserCheck } from 'lucide-react';

export default function VerificationBadge({ level, showLabel = true, size = 'sm' }) {
  const levels = {
    phone: {
      icon: Phone,
      label: 'Phone Verified',
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    identity: {
      icon: UserCheck,
      label: 'Identity Verified',
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    farm: {
      icon: Shield,
      label: 'Farm Verified',
      color: 'text-primary-green',
      bg: 'bg-primary-green/10'
    }
  };

  const config = levels[level] || levels.phone;
  const Icon = config.icon;

  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2'
  };

  return (
    <div className={`inline-flex items-center rounded-full ${config.bg} ${config.color} ${sizes[size]}`}>
      <Icon className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`} />
      {showLabel && <span className="font-medium">{config.label}</span>}
    </div>
  );
}