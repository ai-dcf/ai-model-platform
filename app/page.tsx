'use client';

import { MessageSquare, Image, Settings, ArrowRight, Sparkles, Zap, Shield, Globe } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const features = [
    {
      icon: Zap,
      title: '极速响应',
      description: '基于LangChain实现多厂商模型统一调度，流式响应实时呈现',
      color: 'primary',
    },
    {
      icon: Shield,
      title: '隐私安全',
      description: '所有数据本地存储，后端不保存任何用户信息，API密钥安全加密',
      color: 'success',
    },
    {
      icon: Globe,
      title: '多厂商支持',
      description: '支持阿里云百炼、火山引擎等国内主流AI服务平台',
      color: 'secondary',
    },
  ];

  const quickActions = [
    {
      href: '/chat',
      icon: MessageSquare,
      title: '文本对话',
      description: '开启智能对话，支持多轮上下文',
      gradient: 'from-primary to-primary-dark',
      bgGradient: 'bg-gradient-to-br from-primary/20 to-primary-dark/20',
      iconBg: 'bg-gradient-to-br from-primary to-primary-dark',
      tag: '对话',
    },
    {
      href: '/image',
      icon: Image,
      title: '图像生成',
      description: '文生图创作，丰富参数配置',
      gradient: 'from-secondary to-secondary-dark',
      bgGradient: 'bg-gradient-to-br from-secondary/20 to-secondary-dark/20',
      iconBg: 'bg-gradient-to-br from-secondary to-secondary-dark',
      tag: '创作',
    },
    {
      href: '/config',
      icon: Settings,
      title: '模型配置',
      description: '管理您的AI模型配置',
      gradient: 'from-accent to-emerald-500',
      bgGradient: 'bg-gradient-to-br from-accent/20 to-emerald-500/20',
      iconBg: 'bg-gradient-to-br from-accent to-emerald-500',
      tag: '配置',
    },
  ];

  return (
    <div className="min-h-screen bg-surface overflow-hidden">
      {/* 动态背景光效 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-breathe" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] animate-breathe" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-accent/10 rounded-full blur-[150px] animate-pulse-soft" />
        
        {/* 网格背景 */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-32 pb-12 sm:pb-20">
        
        {/* Hero 区域 */}
        <header className={`text-center mb-12 sm:mb-16 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* 徽章标签 */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 mb-6 sm:mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs sm:text-sm text-primary font-medium">AI多模型统一管理平台</span>
          </div>

          {/* 主标题 */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
            <span className="gradient-text">智能对话</span>
            <br />
            <span className="text-text">触手可及</span>
          </h1>

          {/* 副标题 */}
          <p className="text-base sm:text-xl text-text-muted max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed">
            支持阿里云百炼、火山引擎等多家AI服务平台，一站式管理您的AI模型配置，体验流畅的文本对话与图像生成能力
          </p>

          {/* 特性标签 */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 max-w-3xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colorClass = feature.color === 'primary' ? 'text-primary' : 
                                feature.color === 'success' ? 'text-success' : 'text-secondary';
              const bgClass = feature.color === 'primary' ? 'bg-primary/10' : 
                             feature.color === 'success' ? 'bg-success/10' : 'bg-secondary/10';
              
              return (
                <div 
                  key={index} 
                  className="flex items-center gap-3 text-text-muted justify-center sm:justify-start"
                  style={{
                    transitionDelay: `${index * 100}ms`,
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'all 0.6s ease-out'
                  }}
                >
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${bgClass} backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${colorClass}`} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-text text-sm sm:text-base">{feature.title}</div>
                    <div className="text-xs sm:text-sm hidden sm:block">{feature.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </header>

        {/* 功能卡片区域 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                href={action.href}
                className={`group relative glass-card rounded-2xl p-6 sm:p-7 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 overflow-hidden ${
                  isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 150 + 300}ms` }}
              >
                {/* 悬浮渐变背景 */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-15 transition-opacity duration-300`} />
                
                {/* 边框光效 */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl`} />
                
                <div className="relative">
                  {/* 图标容器 */}
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${action.iconBg} flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300`}>
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>

                  {/* 标签 */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${action.gradient} text-white`}>
                      {action.tag}
                    </span>
                  </div>

                  {/* 标题和描述 */}
                  <h3 className="text-xl sm:text-2xl font-bold text-text mb-2 group-hover:text-white transition-colors duration-300">
                    {action.title}
                  </h3>

                  <p className="text-text-muted text-sm sm:text-base mb-4 group-hover:text-text/80 transition-colors">
                    {action.description}
                  </p>

                  {/* 底部链接 */}
                  <div className={`flex items-center gap-2 text-text-muted group-hover:text-primary transition-all duration-300 ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <span className="text-sm font-medium">立即体验</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        {/* 平台支持区域 */}
        <section 
          className={`text-center glass-card rounded-2xl p-6 sm:p-8 transition-all duration-700 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`} 
          style={{ transitionDelay: '700ms' }}
        >
          <h2 className="text-lg sm:text-xl font-bold text-text mb-4 sm:mb-5">支持的AI服务平台</h2>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {['阿里云百炼', '火山引擎', 'Kimi', 'GLM', 'MiniMax'].map((platform, index) => (
              <span
                key={platform}
                className="px-4 py-2 rounded-full bg-surface-lighter text-text-muted text-sm font-medium hover:text-text hover:bg-surface-light transition-all duration-200 cursor-default group"
                style={{
                  transitionDelay: `${index * 50 + 800}ms`,
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'scale(1)' : 'scale(0.9)',
                  transition: 'all 0.4s ease-out'
                }}
              >
                <span className="relative z-10">{platform}</span>
              </span>
            ))}
          </div>
        </section>

        {/* 底部品牌信息 */}
        <footer className={`text-center mt-12 sm:mt-16 transition-all duration-700 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`} style={{ transitionDelay: '900ms' }}>
          <div className="text-text-dim text-sm">
            <p className="mb-1">Powered by LangChain + Next.js</p>
            <p className="text-xs">Built with passion for AI</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
