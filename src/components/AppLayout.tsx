'use client';

import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const HOME_PATHS = ['/', '/pipeline', '/history', '/overview'];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = HOME_PATHS.includes(pathname);
  const [zoom, setZoom] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return parseFloat(localStorage.getItem('pageZoom') || '100');
    }
    return 100;
  });

  useEffect(() => {
    localStorage.setItem('pageZoom', String(zoom));
  }, [zoom]);

  const zoomLevels = [100, 125, 150];

  const handleZoomOut = () => {
    const idx = zoomLevels.indexOf(zoom);
    if (idx > 0) setZoom(zoomLevels[idx - 1]);
  };

  const handleZoomIn = () => {
    const idx = zoomLevels.indexOf(zoom);
    if (idx < zoomLevels.length - 1) setZoom(zoomLevels[idx + 1]);
  };

  const handleZoomReset = () => setZoom(100);

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <Sidebar />
      <div className="lg:ml-64 transition-all duration-300">
        <TopBar />
        {/* 顶部操作栏：返回按钮 + 缩放控制 */}
        <div className="sticky top-14 z-30 bg-[#0f0f1a]/95 backdrop-blur-sm border-b border-white/5 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isHomePage && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a2e] border border-white/10 text-sm text-gray-300 hover:bg-[#252a3a] hover:text-white hover:border-white/20 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回首页</span>
              </button>
            )}
            {!isHomePage && (
              <span className="text-xs text-gray-500">
                {pathname === '/poisson' && '泊松分析'}
                {pathname === '/v42' && 'V4.2分析'}
                {pathname === '/bizhongge' && '必中哥分析'}
                {pathname === '/xiaofeng' && '小丰综合分析'}
                {pathname === '/radar' && '雷达预警'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 bg-[#1a1a2e] border border-white/10 rounded-lg p-0.5">
            <button
              onClick={handleZoomOut}
              disabled={zoom === 100}
              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="缩小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomReset}
              className="px-2.5 py-1 rounded text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors tabular-nums"
              title="重置缩放"
            >
              {zoom}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom === 150}
              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <div className="flex gap-0.5 pr-1">
              {zoomLevels.map((z) => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  className={`px-1.5 py-0.5 text-[10px] rounded transition-colors tabular-nums ${
                    zoom === z
                      ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* 主内容区 - 带缩放和更大间距 */}
        <main
          className="p-8 transition-transform origin-top"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            width: `${10000 / zoom}%`,
          }}
        >
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
