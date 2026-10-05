import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Check, Clock, AlertCircle, PlayCircle, CalendarCheck, ShieldCheck, CheckCircle2, Sparkles, XCircle } from 'lucide-react';

export interface BadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'md', className = '', showIcon = true }) => {
  const { t } = useLanguage();

  const getStatusConfig = (st: string) => {
    switch (st?.toUpperCase()) {
      case 'REQUESTED':
        return {
          bg: 'bg-indigo-50/80 text-indigo-900 border-indigo-200/80',
          dot: 'bg-indigo-600',
          icon: Clock,
          label: t('statuses.REQUESTED', 'Requested')
        };
      case 'UNDER_REVIEW':
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          dot: 'bg-slate-500',
          icon: Clock,
          label: t('statuses.UNDER_REVIEW', 'Under Review')
        };
      case 'QUOTED':
        return {
          bg: 'bg-amber-50/80 text-amber-900 border-amber-200/80',
          dot: 'bg-amber-500',
          icon: Sparkles,
          label: t('statuses.QUOTED', 'Quotation Received')
        };
      case 'MASTER_ACCEPTED':
      case 'DATE_SELECTED':
        return {
          bg: 'bg-amber-50/90 text-amber-900 border-amber-300',
          dot: 'bg-amber-600 animate-pulse',
          icon: Clock,
          label: t('statuses.MASTER_ACCEPTED', 'Master Accepted')
        };
      case 'FINAL_CHARGES_PENDING_USER':
      case 'AWAITING_CONFIRMATION':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-300/90',
          dot: 'bg-amber-600',
          icon: AlertCircle,
          label: t('statuses.FINAL_CHARGES_PENDING_USER', 'Awaiting Weaver Approval')
        };
      case 'USER_FINAL_CONFIRMED':
      case 'CONFIRMED':
        return {
          bg: 'bg-indigo-50 text-indigo-950 border-indigo-300',
          dot: 'bg-indigo-700',
          icon: ShieldCheck,
          label: t('statuses.CONFIRMED', 'Work Confirmed')
        };
      case 'SCHEDULED':
        return {
          bg: 'bg-cyan-50/80 text-cyan-950 border-cyan-300',
          dot: 'bg-cyan-600',
          icon: CalendarCheck,
          label: t('statuses.SCHEDULED', 'Scheduled')
        };
      case 'IN_PROGRESS':
        return {
          bg: 'bg-orange-50 text-orange-950 border-orange-300',
          dot: 'bg-orange-500 animate-pulse',
          icon: PlayCircle,
          label: t('statuses.IN_PROGRESS', 'In Progress')
        };
      case 'COMPLETED':
        return {
          bg: 'bg-emerald-50 text-emerald-950 border-emerald-300',
          dot: 'bg-emerald-600',
          icon: CheckCircle2,
          label: t('statuses.COMPLETED', 'Completed')
        };
      case 'PAID':
        return {
          bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
          dot: 'bg-emerald-600',
          icon: Check,
          label: t('statuses.PAID', 'Paid')
        };
      case 'UNPAID':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-200',
          dot: 'bg-amber-500',
          icon: Clock,
          label: t('statuses.UNPAID', 'Unpaid')
        };
      case 'ACTIVE':
        return {
          bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: Check,
          label: t('statuses.ACTIVE', 'Active')
        };
      case 'INACTIVE':
        return {
          bg: 'bg-stone-100 text-stone-700 border-stone-200',
          dot: 'bg-stone-400',
          icon: Clock,
          label: t('statuses.INACTIVE', 'Inactive')
        };
      case 'REJECTED':
      case 'CANCELLED':
      case 'USER_CONFIRMATION_EXPIRED':
        return {
          bg: 'bg-stone-100 text-stone-800 border-stone-200',
          dot: 'bg-stone-500',
          icon: XCircle,
          label: t(`statuses.${st}`, st?.replace(/_/g, ' ') || 'Cancelled')
        };
      default:
        return {
          bg: 'bg-stone-100 text-stone-800 border-stone-200',
          dot: 'bg-stone-400',
          icon: Clock,
          label: st?.replace(/_/g, ' ') || 'Pending'
        };
    }
  };

  const config = getStatusConfig(status);

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-semibold',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-bold',
    lg: 'text-xs sm:text-sm px-3.5 py-1.5 gap-2 font-extrabold'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs select-none transition-colors ${config.bg} ${sizeStyles[size]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
