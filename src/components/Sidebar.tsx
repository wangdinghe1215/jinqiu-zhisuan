'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  PlayCircle,
  History,
  Database,
  Trophy,
  Menu,
  X,
  Activity,
  Target,
  Search,
  Brain,
  Radar,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '今日分析', icon: LayoutDashboard, section: 'base' },
  { href: '/pipeline', label: '流水线状态', icon: PlayCircle, section: 'base' },
  { href: '/history', label: '历史战绩', icon: History, section: 'base' },
  { href: '/overview', label: '数据概览', icon: Database, section: 'base' },
  { href: '/poisson', label: '泊松分析', icon: Activity, section: 'analysis' },
  { href: '/v42', label: 'V4.2分析', icon: Target, section: 'analysis' },
  { href: '/bizhongge', label: '必中哥分析', icon: Search, section: 'analysis' },
  { href: '/xiaofeng', label: '小丰综合分析', icon: Brain, section: 'analysis' },
  { href: '/radar', label: '雷达预警', icon: Radar, section: 'analysis' },
  { href: '/plans', label: '投注方案', icon: Wallet, section: 'analysis' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-[#1a1a2e] border border-gray-700"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-[#0a0a14] border-r border-gray-800 z-40 transition-all duration-300',
          'w-64',
          collapsed && 'w-16',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Trophy size={22} className="text-white" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-sm text-white whitespace-nowrap">
                  足球分析
                </h1>
                <p className="text-xs text-gray-500 whitespace-nowrap">
                  Odds Analytics
                </p>
              </div>
            )}
          </div>
          <button
            className="ml-auto p-1.5 rounded hover:bg-gray-800 hidden lg:block"
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="p-3 space-y-1">
          {/* 基础面板 */}
          {navItems
            .filter((item) => item.section === 'base')
            .map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    'hover:bg-gray-800/60',
                    isActive &&
                      'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-400 border-l-2 border-cyan-400',
                    !isActive && 'text-gray-400'
                  )}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}

          {/* 分隔线 */}
          <div className="my-3 border-t border-gray-800" />

          {/* 分析体系 */}
          {!collapsed && (
            <div className="px-3 py-1.5 text-[10px] text-gray-600 font-medium uppercase tracking-wider">
              分析体系
            </div>
          )}

          {navItems
            .filter((item) => item.section === 'analysis')
            .map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    'hover:bg-gray-800/60',
                    isActive &&
                      'bg-gradient-to-r from-purple-500/20 to-transparent text-purple-400 border-l-2 border-purple-400',
                    !isActive && 'text-gray-400'
                  )}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
        </nav>

        {/* Bottom info */}
        {!collapsed && (
          <div className="absolute bottom-4 left-3 right-3">
            <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-400">系统运行中</span>
              </div>
              <p className="text-xs text-gray-500">v1.0.0 · 数据每日更新</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
