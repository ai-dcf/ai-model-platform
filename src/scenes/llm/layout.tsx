'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Image, Settings, Home, Sparkles } from 'lucide-react';

export default function LLMSceneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { href: '/scenes/llm/chat', icon: MessageSquare, label: '对话', id: 'chat' },
    { href: '/scenes/llm/image', icon: Image, label: '图像生成', id: 'image' },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] bg-surface flex w-full overflow-hidden">
      <aside className={`
        fixed md:relative top-0 bottom-0 left-0 z-40 md:z-auto flex flex-col h-full
        glass-card border-r border-border
        transform transition-all duration-300 ease-in-out flex-shrink-0
        ${sidebarOpen ? 'translate-x-0 w-64 md:w-72' : '-translate-x-full md:translate-x-0 md:w-0 overflow-hidden border-none opacity-0 md:opacity-100'}
      `}>
        <div className="p-4 border-b border-border w-64 md:w-72">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">大模型场景</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 w-64 md:w-72">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-muted hover:text-text hover:bg-surface-lighter'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] min-w-0 transition-all duration-300 relative">
        {children}
      </main>
    </div>
  );
}
