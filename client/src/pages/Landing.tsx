import { Coffee, MapPin, Gift, Smartphone, Settings, ExternalLink, QrCode, Star, Zap, Shield, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Landing() {
  const appLinks = {
    telegram: "https://t.me/vendhubbot",
    ios: "https://apps.apple.com/app/vendhub",
    android: "https://play.google.com/store/apps/details?id=com.vendhub",
    admin: "/admin",
    cabinet: "https://cabinet.vendhub.uz",
    maps: "https://maps.vendhub.uz",
  };

  const features = [
    {
      icon: Coffee,
      title: "Кофе и напитки",
      description: "Более 35 видов напитков: эспрессо, латте, капучино, матча и холодные напитки",
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      icon: MapPin,
      title: "15+ автоматов",
      description: "Автоматы в больницах, бизнес-центрах и общественных местах Ташкента",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: Gift,
      title: "Программа лояльности",
      description: "Накапливайте баллы, получайте скидки до 10% и эксклюзивные бонусы",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      icon: Zap,
      title: "Быстрый заказ",
      description: "Закажите напиток заранее и заберите без очереди",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  const stats = [
    { value: "15+", label: "Автоматов" },
    { value: "35+", label: "Напитков" },
    { value: "10K+", label: "Заказов" },
    { value: "4.8", label: "Рейтинг" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-orange-500/5 to-transparent" />
        <div className="container mx-auto px-4 py-12 relative">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Logo */}
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl">
              <Coffee className="w-12 h-12 text-white" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Vend<span className="text-amber-600">Hub</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-md">
                Кофе из вендинговых автоматов в пару кликов
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-8 py-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <Button 
                asChild
                size="lg" 
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg"
              >
                <a href={appLinks.telegram} target="_blank" rel="noopener noreferrer">
                  <Smartphone className="w-5 h-5 mr-2" />
                  Открыть в Telegram
                </a>
              </Button>
              <Button 
                asChild
                size="lg" 
                variant="outline"
                className="flex-1 border-amber-300 hover:bg-amber-50"
              >
                <Link href="/">
                  <QrCode className="w-5 h-5 mr-2" />
                  Веб-приложение
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
            Почему VendHub?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-3`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Apps Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
            Скачайте приложение
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {/* Telegram */}
            <Card className="border-2 border-blue-200 hover:border-blue-400 transition-colors">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.66-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.02-.74 3.98-1.73 6.64-2.87 7.97-3.43 3.79-1.58 4.58-1.86 5.09-1.87.11 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .38z"/>
                  </svg>
                </div>
                <CardTitle>Telegram Bot</CardTitle>
                <Badge variant="secondary" className="mt-2">Рекомендуем</Badge>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Уведомления о заказах и акциях
                </p>
                <Button asChild className="w-full bg-blue-500 hover:bg-blue-600">
                  <a href={appLinks.telegram} target="_blank" rel="noopener noreferrer">
                    Открыть бота
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* iOS */}
            <Card className="border-2 border-gray-200 hover:border-gray-400 transition-colors">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </div>
                <CardTitle>iOS App</CardTitle>
                <Badge variant="outline" className="mt-2">Скоро</Badge>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Нативное приложение для iPhone
                </p>
                <Button asChild variant="outline" className="w-full" disabled>
                  <span>
                    App Store
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </span>
                </Button>
              </CardContent>
            </Card>

            {/* Android */}
            <Card className="border-2 border-green-200 hover:border-green-400 transition-colors">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-1.4-.59-2.96-.92-4.47-.92s-3.07.33-4.47.92L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
                  </svg>
                </div>
                <CardTitle>Android App</CardTitle>
                <Badge variant="outline" className="mt-2">Скоро</Badge>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Нативное приложение для Android
                </p>
                <Button asChild variant="outline" className="w-full" disabled>
                  <span>
                    Google Play
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Admin & Business Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
            Для бизнеса
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Admin Panel */}
            <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Админ-панель</CardTitle>
                    <CardDescription>Управление автоматами</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    Аналитика продаж
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    Управление меню
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-500" />
                    Промокоды и акции
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full border-purple-300 hover:bg-purple-50">
                  <Link href="/admin">
                    Открыть панель
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Maps */}
            <Card className="border-2 border-teal-200 hover:border-teal-400 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <CardTitle>Карта автоматов</CardTitle>
                    <CardDescription>Все локации на карте</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-500" />
                    15+ автоматов в Ташкенте
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-teal-500" />
                    Рейтинги и отзывы
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-teal-500" />
                    Статус в реальном времени
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full border-teal-300 hover:bg-teal-50">
                  <a href={appLinks.maps} target="_blank" rel="noopener noreferrer">
                    Открыть карту
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-white">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Coffee className="w-6 h-6 text-amber-500" />
            <span className="text-xl font-bold">VendHub</span>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Кофе из вендинговых автоматов в пару кликов
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <a href="tel:+998712003999" className="hover:text-white transition-colors">
              +998 71 200 39 99
            </a>
            <a href="mailto:info@vendhub.uz" className="hover:text-white transition-colors">
              info@vendhub.uz
            </a>
          </div>
          <p className="text-gray-500 text-xs mt-6">
            © 2024 VendHub. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
}
