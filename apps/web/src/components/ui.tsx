'use client';

import { cn } from '@/utils/cn';
import { ReactNode } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  hint?: string;
}

export function Input({ label, error, icon, hint, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-slate-800">
          {label}
          {props.required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl',
            'text-slate-900 placeholder-slate-600 text-sm',
            'transition-all duration-150',
            'focus:outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10',
            'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : '',
            icon ? 'pl-10' : '',
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-700 font-medium">{error}</span>}
      {hint && !error && <span className="text-xs text-slate-700">{hint}</span>}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 select-none';

  const variants = {
    primary:
      'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-400 hover:to-emerald-400 focus:ring-teal-400 shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 active:scale-[0.98]',
    secondary:
      'bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-400 active:bg-slate-400',
    outline:
      'border-2 border-slate-300 text-slate-800 hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50 focus:ring-teal-400 active:bg-teal-50',
    ghost:
      'text-teal-700 hover:bg-teal-50 focus:ring-teal-400 active:bg-teal-100',
    danger:
      'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 shadow-sm hover:shadow-md active:bg-red-700 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  };

  const iconEl = icon && <span className="flex items-center shrink-0">{icon}</span>;

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {iconPosition === 'left' && iconEl}
      <span>{isLoading ? '···' : children}</span>
      {iconPosition === 'right' && iconEl}
    </button>
  );
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'flat';
}

export function Card({
  children,
  padding = 'md',
  variant = 'default',
  className = '',
  ...props
}: CardProps) {
  const paddings = { sm: 'p-4', md: 'p-6', lg: 'p-7' };

  const variants = {
    default: 'bg-white border border-slate-200/80 rounded-2xl shadow-card',
    elevated: 'bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow duration-300',
    flat: 'bg-slate-50 border border-slate-200/60 rounded-2xl',
  };

  return (
    <div className={cn(paddings[padding], variants[variant], className)} {...props}>
      {children}
    </div>
  );
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'teal';
  size?: 'sm' | 'md';
}

export function Badge({
  variant = 'default',
  size = 'sm',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 ring-1 ring-slate-300',
    success: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300',
    warning: 'bg-amber-50 text-amber-800 ring-1 ring-amber-300',
    error: 'bg-red-50 text-red-700 ring-1 ring-red-300',
    info: 'bg-blue-50 text-blue-800 ring-1 ring-blue-300',
    teal: 'bg-teal-50 text-teal-800 ring-1 ring-teal-300',
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs font-semibold rounded-full',
    md: 'px-3 py-1 text-sm font-semibold rounded-full',
  };

  return (
    <span className={cn(variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}

interface TabsProps {
  tabs: { label: string; value: string }[];
  activeTab: string;
  onChange: (value: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150',
            activeTab === tab.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('skeleton rounded-xl', className)}
      {...props}
    />
  );
}
