/**
 * VendHub TWA - QR Scanner Page
 * Modern centered QR scanner with animations
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/contexts/TelegramContext';
import { QrCode, Flashlight, Image, MapPin, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

export default function Scan() {
  const [, navigate] = useLocation();
  const { haptic } = useTelegram();
  const [isScanning, setIsScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  const handleStartScan = () => {
    haptic.impact('medium');
    setIsScanning(true);
    
    // Simulate QR scan after 2 seconds (demo)
    setTimeout(() => {
      haptic.notification('success');
      setIsScanning(false);
      // Navigate to menu with scanned machine
      navigate('/menu/1');
    }, 2500);
  };

  const handleFlash = () => {
    haptic.selection();
    setFlashOn(!flashOn);
  };

  const handleGallery = () => {
    haptic.selection();
    // In real app, open gallery to select QR image
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-espresso to-espresso/90 flex flex-col safe-top pb-24">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full text-white/80 hover:text-white hover:bg-white/10">
            <X className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="font-display text-lg font-semibold text-white">Сканировать QR</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Main Scanner Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Scanner Frame */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          {/* Outer glow */}
          <div className="absolute inset-0 bg-caramel/20 rounded-3xl blur-xl scale-110" />
          
          {/* Scanner container */}
          <div 
            className="relative w-72 h-72 rounded-3xl overflow-hidden bg-black/40 backdrop-blur-sm border-2 border-white/20"
            onClick={!isScanning ? handleStartScan : undefined}
          >
            {/* Corner markers */}
            <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-caramel rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-caramel rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-caramel rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-caramel rounded-br-lg" />

            {/* Scanning animation */}
            <AnimatePresence>
              {isScanning && (
                <motion.div
                  initial={{ top: '10%' }}
                  animate={{ top: '80%' }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    repeatType: 'reverse',
                    ease: 'easeInOut'
                  }}
                  className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-caramel to-transparent"
                />
              )}
            </AnimatePresence>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {!isScanning ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-white/80 text-sm">Нажмите для сканирования</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-3 border-4 border-caramel border-t-transparent rounded-full animate-spin" />
                  <p className="text-white text-sm font-medium">Сканирование...</p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-white/60 text-center text-sm max-w-xs"
        >
          Наведите камеру на QR-код на вендинговом автомате
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-4 mt-8"
        >
          <Button
            variant="ghost"
            size="icon"
            className={`w-14 h-14 rounded-2xl ${
              flashOn 
                ? 'bg-caramel text-white' 
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
            onClick={handleFlash}
          >
            <Flashlight className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-2xl bg-white/10 text-white/80 hover:bg-white/20"
            onClick={handleGallery}
          >
            <Image className="w-6 h-6" />
          </Button>
        </motion.div>
      </main>

      {/* Alternative: Select from list */}
      <div className="px-6 pb-4">
        <Link href="/locations">
          <Button 
            variant="outline" 
            className="w-full h-14 rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={() => haptic.selection()}
          >
            <MapPin className="w-5 h-5 mr-2" />
            Выбрать из списка
          </Button>
        </Link>
      </div>
    </div>
  );
}
