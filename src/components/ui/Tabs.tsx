'use client';

import React from 'react';
import { clsx } from 'clsx';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'danger' | 'warning' | 'emerald' | 'default';
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={clsx('flex border-b border-slate-200 overflow-x-auto no-scrollbar', className)}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap cursor-pointer',
              isActive
                ? 'border-brand-primary text-brand-primary bg-emerald-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            )}
          >
            {tab.icon && <span className={isActive ? 'text-brand-primary' : 'text-slate-400'}>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={clsx(
                  'px-2 py-0.5 text-[11px] font-bold rounded-full ml-1',
                  tab.badgeVariant === 'danger'
                    ? 'bg-rose-100 text-rose-700 animate-pulse'
                    : tab.badgeVariant === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : tab.badgeVariant === 'emerald'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
