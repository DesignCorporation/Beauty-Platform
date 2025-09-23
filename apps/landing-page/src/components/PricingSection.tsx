import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: "€30",
    description: "Для начинающих салонов красоты.",
    features: ["До 3 мастеров", "500 клиентов", "Онлайн-запись", "Базовая аналитика", "Email поддержка"],
    isPopular: false,
  },
  {
    name: "Pro",
    price: "€75",
    description: "Идеально для растущих салонов.",
    features: ["До 10 мастеров", "2000 клиентов", "Все функции Basic", "SMS уведомления", "Программа лояльности", "Управление складом"],
    isPopular: true,
  },
  {
    name: "Enterprise",
    price: "€150",
    description: "Для крупных салонов и сетей.",
    features: ["Безлимит мастеров", "Безлимит клиентов", "Все функции Pro", "Углубленная аналитика", "API доступ", "Персональный менеджер"],
    isPopular: false,
  },
  {
    name: "Custom",
    price: "Индивидуально",
    description: "Полная кастомизация под ваши нужды.",
    features: ["Все функции Enterprise", "White Label решение", "Интеграция с любыми системами", "Обучение команды", "24/7 приоритетная поддержка"],
    isPopular: false,
  }
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-pink-100 rounded-full px-6 py-2 mb-6 border border-pink-200/50">
            <Crown className="w-4 h-4 text-pink-600" />
            <span className="text-pink-700 font-medium">Простые и гибкие тарифы</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-serif font-bold text-slate-800 mb-6">
            Выберите <span className="text-pink-500">свой идеальный план</span>
          </h2>
          <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Начните с малого и растите вместе с нами. Никаких скрытых платежей, 
            только прозрачные условия.
          </p>
        </div>

        {/* Pricing grid */}
        <div className="grid lg:grid-cols-4 gap-8 items-start">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`flex flex-col h-full border shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl ${
                plan.isPopular ? 'border-2 border-pink-400 shadow-pink-500/10' : 'border-slate-200 shadow-slate-500/5'
              }`}
            >
              {plan.isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-500 text-white border-0">
                  <Star className="w-3 h-3 mr-1" />
                  Популярный
                </Badge>
              )}
              <CardHeader className="text-center p-6">
                <CardTitle className="text-2xl font-serif font-bold text-slate-800 mb-2">{plan.name}</CardTitle>
                <p className="text-slate-500 h-10">{plan.description}</p>
                <div className="my-6">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  {plan.price !== 'Индивидуально' && <span className="text-slate-500">/мес</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-6">
                <ul className="space-y-4">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-6 mt-auto">
                <Button 
                  size="lg" 
                  className={`w-full rounded-full font-semibold ${
                    plan.isPopular 
                      ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {plan.price === 'Индивидуально' ? 'Связаться с нами' : 'Выбрать план'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}