import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '../components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Hub - 多模型统一管理平台',
  description: '支持阿里云百炼、火山引擎等多家AI服务平台，一站式管理您的AI模型配置',
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={`${inter.className} bg-surface text-text min-h-screen w-full`}>
        <Navbar />
        <main className="pt-16 w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
