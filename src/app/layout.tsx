import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '足球分析仪表盘',
  description: '专业足球赛事赔率分析与数据可视化平台',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-[#0f0f1a] text-gray-200 antialiased">
        {children}
      </body>
    </html>
  );
}
