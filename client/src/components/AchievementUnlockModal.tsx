/**
 * Achievement Unlock Modal
 * Shows animated celebration when a new achievement is unlocked
 */

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useConfetti } from "@/hooks/useConfetti";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface AchievementUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  } | null;
}

export default function AchievementUnlockModal({
  isOpen,
  onClose,
  achievement,
}: AchievementUnlockModalProps) {
  const { fireConfetti, fireEmoji } = useConfetti();

  useEffect(() => {
    if (isOpen && achievement) {
      // Fire confetti when modal opens
      setTimeout(() => {
        fireConfetti('achievement');
        fireEmoji('🏆', 20);
      }, 300);
    }
  }, [isOpen, achievement]);

  if (!achievement) return null;

  const Icon = achievement.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-0 bg-transparent shadow-none">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
          className="relative bg-background rounded-3xl p-6 shadow-2xl overflow-hidden"
        >
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-amber-500/10 to-orange-500/20 blur-xl" />
          
          {/* Animated rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              className="w-24 h-24 rounded-full border-2 border-yellow-400/50"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              className="absolute w-24 h-24 rounded-full border-2 border-amber-400/50"
            />
          </div>

          <div className="relative text-center">
            {/* Achievement unlocked text */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-4"
            >
              <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-sm font-semibold rounded-full shadow-lg">
                🎉 Новое достижение!
              </span>
            </motion.div>

            {/* Badge icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.2 }}
              className="flex justify-center mb-4"
            >
              <div className={cn(
                "w-24 h-24 rounded-2xl flex items-center justify-center shadow-xl",
                achievement.bgColor
              )}>
                <Icon className={cn("w-12 h-12", achievement.color)} />
              </div>
            </motion.div>

            {/* Achievement name */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-display text-2xl font-bold text-foreground mb-2"
            >
              {achievement.name}
            </motion.h2>

            {/* Achievement description */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-6"
            >
              {achievement.description}
            </motion.p>

            {/* Stars decoration */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center gap-1 mb-6"
            >
              {[...Array(5)].map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                  className="text-yellow-400 text-xl"
                >
                  ⭐
                </motion.span>
              ))}
            </motion.div>

            {/* Close button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={onClose}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-semibold shadow-lg"
              >
                Отлично! 🎊
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
