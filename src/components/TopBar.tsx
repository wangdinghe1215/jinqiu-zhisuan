'use client';

import { useEffect, useState } from 'react';
import { Clock, Activity, Wifi } from 'lucide-react';

export function TopBar() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return {
      date: `${y}-${m}-${d}`,
      weekday: weekdays[date.getDay()],
      time: `${h}:${min}:${s}`,
    };
  };

  const dt = currentTime ? formatDate(currentTime) : null;

  return (
    <header className="h-16 bg-[#1a1a2e]/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Clock size={18} />
          {dt && (
            <span className="text-sm font-mono tabular-nums">
              {dt.date} {dt.weekday}
              <span className="text-cyan-400 ml-2">{dt.time}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Pipeline status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
          </div>
          <span className="text-xs text-gray-300 font-medium">
            流水线运行中
          </span>
        </div>

        {/* API status */}
        <div className="flex items-center gap-2 text-gray-400">
          <Activity size={16} />
          <span className="text-xs">API正常</span>
        </div>

        {/* DB status */}
        <div className="flex items-center gap-2 text-gray-400">
          <Wifi size={16} />
          <span className="text-xs">DB已连接</span>
        </div>
      </div>
    </header>
  );
}
