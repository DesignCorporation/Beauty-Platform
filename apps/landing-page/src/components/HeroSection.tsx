import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Crown } from "lucide-react";

export default function HeroSection() {
  return (
    <section id="hero" className="relative overflow-hidden pt-32 pb-20 bg-slate-50">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-pink-200/50 rounded-full blur-2xl"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-purple-200/50 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-amber-200/50 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 text-center relative">
        {/* Premium badge */}
        <div className="inline-flex items-center gap-2 bg-pink-100 rounded-full px-6 py-2 mb-8 border border-pink-200/50">
          <Crown className="w-4 h-4 text-pink-600" />
          <span className="text-pink-700 font-medium">Премиум CRM для салонов</span>
          <Sparkles className="w-4 h-4 text-pink-600" />
        </div>

        {/* Main headline */}
        <h1 className="text-6xl md:text-7xl font-serif font-bold leading-tight mb-8">
          <span className="text-pink-500">
            CRM для салонов красоты
          </span>
          <br />
          <span className="text-slate-800">Просто. Удобно.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-slate-600 leading-relaxed mb-12 max-w-4xl mx-auto font-light">
          Управляйте записями клиентов, расписанием мастеров и финансами салона 
          в одной элегантной системе. Увеличьте прибыль на 40% за первый месяц.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button 
            size="lg" 
            className="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-10 py-4 text-lg font-semibold shadow-lg shadow-pink-500/20 transform hover:scale-105 transition-all duration-200"
          >
            Начать бесплатно
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="rounded-full px-8 py-4 text-lg border-2 border-pink-200 hover:border-pink-300 hover:bg-pink-100 transition-all duration-200"
          >
            <Play className="w-5 h-5 mr-2" />
            Смотреть демо
          </Button>
        </div>

        {/* Social proof */}
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => (
                <div key={i} className={`w-8 h-8 bg-purple-300 rounded-full border-2 border-white`}></div>
              ))}
            </div>
            <span className="text-slate-500 text-sm">2000+ довольных салонов</span>
          </div>
          <div className="text-slate-300">•</div>
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-4 h-4 text-amber-400">⭐</div>
            ))}
            <span className="text-slate-500 text-sm ml-2">4.9/5 рейтинг</span>
          </div>
          <div className="text-slate-300">•</div>
          <span className="text-slate-500 text-sm">30-дневная гарантия возврата</span>
        </div>

        {/* Hero image placeholder */}
        <div className="mt-20 relative">
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-500/10 border border-slate-100 p-8 max-w-5xl mx-auto">
            <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center relative overflow-hidden">
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <p className="text-lg font-serif text-slate-600">Интерфейс SalonPro CRM</p>
                <p className="text-sm text-slate-500">Современный • Интуитивный • Красивый</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}