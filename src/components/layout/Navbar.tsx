'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Image, Settings, Home, Sparkles, ChevronDown, FileText, Video, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const dropdownItems = {
    llm: [
      { href: '/chat', icon: MessageSquare, label: '文本对话' },
      { href: '/image', icon: Image, label: '图像生成' },
    ],
    prompt: [
      { href: '/prompt-library/image', icon: Wand2, label: '图片提示词' },
      { href: '/prompt-library/video', icon: Video, label: '视频提示词' },
    ],
  };

  const navItems = [
    { href: '/', icon: Home, label: '首页', id: 'home' },
    { id: 'llm', label: '大模型', icon: Sparkles },
    { id: 'prompt', label: '提示词', icon: FileText },
    { href: '/config', icon: Settings, label: '配置', id: 'config' },
  ];

  const renderNavItem = (item: { id: string; label: string; icon?: typeof MessageSquare; href?: string }) => {
    const Icon = item.icon;
    const items = dropdownItems[item.id as keyof typeof dropdownItems];

    if (items) {
      const isOpen = openDropdown === item.id;
      const isActive = 
        (item.id === 'llm' && (pathname === '/chat' || pathname === '/image')) ||
        (item.id === 'prompt' && pathname.startsWith('/prompt-library'));

      return (
        <div key={item.id} className="relative">
          <button
            onClick={() => setOpenDropdown(isOpen ? null : item.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:text-text hover:bg-surface-lighter'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{item.label}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 glass-card rounded-xl border border-border shadow-lg overflow-hidden z-50">
              {items.map((subItem) => {
                const SubIcon = subItem.icon;
                return (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-3 px-4 py-3 text-text-muted hover:text-text hover:bg-surface-lighter transition-colors"
                  >
                    <SubIcon className="w-4 h-4" />
                    <span>{subItem.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href || '/'}
        onClick={() => setOpenDropdown(null)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
          pathname === item.href
            ? 'bg-primary/10 text-primary'
            : 'text-text-muted hover:text-text hover:bg-surface-lighter'
        }`}
      >
        {Icon && <Icon className="w-4 h-4" />}
        <span>{item.label}</span>
      </Link>
    );
  };

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
            {navItems.map((item) => renderNavItem(item))}
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
