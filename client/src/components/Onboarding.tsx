/**
 * Onboarding Component
 * 
 * Design: Warm Brew coffee theme - always light background for visibility
 * Multi-slide welcome screens for new users
 * Features: swipe navigation, progress dots, skip button
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Coffee, 
  MapPin, 
  QrCode, 
  Gift, 
  Heart,
  Bell,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface OnboardingSlide {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgGradient: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    icon: <Coffee className="w-16 h-16" />,
    title: 'Добро пожаловать в VendHub!',
    description: 'Заказывайте любимые напитки из вендинговых автоматов в пару кликов. Быстро, удобно, без очередей.',
    color: 'text-amber-600',
    bgGradient: 'from-amber-100 to-orange-100'
  },
  {
    id: 2,
    icon: <QrCode className="w-16 h-16" />,
    title: 'Сканируйте QR-код',
    description: 'Наведите камеру на QR-код автомата — меню загрузится автоматически. Выбирайте напиток и оплачивайте онлайн.',
    color: 'text-blue-600',
    bgGradient: 'from-blue-100 to-indigo-100'
  },
  {
    id: 3,
    icon: <MapPin className="w-16 h-16" />,
    title: 'Найдите ближайший автомат',
    description: 'Интерактивная карта покажет все автоматы рядом с вами. Постройте маршрут в один клик через любимый навигатор.',
    color: 'text-green-600',
    bgGradient: 'from-green-100 to-emerald-100'
  },
  {
    id: 4,
    icon: <Heart className="w-16 h-16" />,
    title: 'Сохраняйте избранное',
    description: 'Добавляйте любимые напитки в избранное для быстрого повторного заказа. Мы запомним ваши предпочтения.',
    color: 'text-rose-600',
    bgGradient: 'from-rose-100 to-pink-100'
  },
  {
    id: 5,
    icon: <Gift className="w-16 h-16" />,
    title: 'Копите бонусы',
    description: 'За каждый заказ начисляются бонусы. Повышайте уровень лояльности и получайте эксклюзивные скидки.',
    color: 'text-purple-600',
    bgGradient: 'from-purple-100 to-violet-100'
  },
  {
    id: 6,
    icon: <Bell className="w-16 h-16" />,
    title: 'Будьте в курсе акций',
    description: 'Включите уведомления, чтобы не пропустить скидки на любимые напитки и специальные предложения.',
    color: 'text-amber-600',
    bgGradient: 'from-amber-100 to-yellow-100'
  }
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  // Handle swipe gestures
  const handleDragEnd = (_event: unknown, info: { offset: { x: number } }) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      nextSlide();
    } else if (info.offset.x > swipeThreshold) {
      prevSlide();
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') onComplete();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, onComplete]);

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  // Force light theme for onboarding - always use cream background
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: '#FDF8F3' }}
    >
      {/* Skip button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onComplete}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          style={{ color: '#8B7355' }}
        >
          Пропустить
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="w-full px-6 cursor-grab active:cursor-grabbing"
          >
            <div className="max-w-sm mx-auto text-center">
              {/* Icon with gradient background */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className={`w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br ${slide.bgGradient} flex items-center justify-center shadow-lg`}
              >
                <div className={slide.color}>
                  {slide.icon}
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold mb-4 font-display"
                style={{ color: '#2C1810' }}
              >
                {slide.title}
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="leading-relaxed"
                style={{ color: '#5D4037' }}
              >
                {slide.description}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="rounded-full transition-all duration-300"
            style={{
              width: index === currentSlide ? '24px' : '8px',
              height: '8px',
              backgroundColor: index === currentSlide ? '#D4A574' : 'rgba(139, 115, 85, 0.3)'
            }}
            aria-label={`Перейти к слайду ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="px-6 pb-8 flex gap-3">
        {currentSlide > 0 && (
          <Button
            variant="outline"
            size="lg"
            onClick={prevSlide}
            className="flex-1"
            style={{ 
              borderColor: '#D4A574', 
              color: '#5D4037',
              backgroundColor: 'transparent'
            }}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Назад
          </Button>
        )}
        <Button
          size="lg"
          onClick={nextSlide}
          className={`flex-1 ${currentSlide === 0 ? 'w-full' : ''}`}
          style={{ 
            backgroundColor: '#D4A574', 
            color: 'white'
          }}
        >
          {isLastSlide ? (
            'Начать'
          ) : (
            <>
              Далее
              <ChevronRight className="w-5 h-5 ml-1" />
            </>
          )}
        </Button>
      </div>

      {/* Slide counter */}
      <div 
        className="text-center pb-4 text-sm"
        style={{ color: '#8B7355' }}
      >
        {currentSlide + 1} из {slides.length}
      </div>
    </div>
  );
}

export default Onboarding;
