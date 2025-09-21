'use client'
import HeroSection from '@/components/HeroSection'
import FeaturesSection from '@/components/FeaturesSection'
import HowItWorksSection from '@/components/HowItWorksSection'
import ScreenshotsSection from '@/components/ScreenshotsSection'
import TestimonialsSection from '@/components/TestimonialsSection'
import PricingSection from '@/components/PricingSection'
import FinalCTASection from '@/components/FinalCTASection'
import { MenuIcon } from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { href: '#features', label: 'Функции' },
  { href: '#how-it-works', label: 'Как работает' },
  { href: '#screenshots', label: 'Интерфейс' },
  { href: '#testimonials', label: 'Отзывы' },
  { href: '#pricing', label: 'Тарифы' }
]

function Header() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold">
            BP
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-slate-900">Beauty Platform</span>
            <span className="text-xs uppercase tracking-wide text-pink-500">SalonPro CRM</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-pink-500 transition-colors">
              {item.label}
            </a>
          ))}
          <a
            href="#cta"
            className="bg-pink-500 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-md shadow-pink-500/20 hover:bg-pink-600 transition-colors"
          >
            Начать бесплатно
          </a>
        </nav>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-600"
          aria-label="Открыть меню"
        >
          <MenuIcon className="w-5 h-5" />
        </button>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <nav className="flex flex-col px-6 py-4 gap-4 text-sm">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-slate-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="#cta"
              className="mt-2 inline-flex justify-center rounded-full bg-pink-500 px-5 py-2 text-white font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              Начать бесплатно
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-200 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold">
                BP
              </div>
              <div>
                <p className="text-lg font-semibold">Beauty Platform</p>
                <p className="text-sm text-pink-200">SalonPro CRM</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-xs">
              Полная CRM система для салонов красоты, которая помогает управлять клиентами, мастерами и прибылью.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Платформа</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#features" className="hover:text-pink-300">Функции</a></li>
              <li><a href="#screenshots" className="hover:text-pink-300">Интерфейс</a></li>
              <li><a href="#pricing" className="hover:text-pink-300">Тарифы</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Ресурсы</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#how-it-works" className="hover:text-pink-300">Как начать</a></li>
              <li><a href="#testimonials" className="hover:text-pink-300">Отзывы</a></li>
              <li><a href="#cta" className="hover:text-pink-300">Запросить демо</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Контакты</h4>
            <p className="text-sm text-slate-400">
              support@beauty-platform.com
              <br />
              +7 (495) 123-45-67
            </p>
            <p className="text-xs text-slate-500">© {new Date().getFullYear()} Beauty Platform. Все права защищены.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ScreenshotsSection />
        <TestimonialsSection />
        <PricingSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  )
}
