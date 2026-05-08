
'use client';

import { MessageSquare, Image, Settings, Home, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: '首页', id: 'home' },
    { href: '/chat', icon: MessageSquare, label: '文本对话', id: 'chat' },
    { href: '/image', icon: Image, label: '图像生成', id: 'image' },
    { href: '/config', icon: Settings, label: '模型配置', id: 'config' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-primary to-secondary rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
            </div>
            <span className="text-xl font-bold gradient-text">AI Hub</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-muted hover:text-text hover:bg-surface-lighter'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-surface-lighter transition-colors">
              <Settings className="w-5 h-5 text-text-muted" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
