/**
 * VendHub TWA - Home Page Customization Settings
 * Allows users to customize their homepage sections
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTelegram } from "@/contexts/TelegramContext";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  GripVertical,
  Coffee,
  MapPin,
  QrCode,
  Percent,
  Gift,
  TrendingUp,
  Sparkles,
  Star,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  Loader2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";

// Section definitions
interface HomeSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  visible: boolean;
  size: 'compact' | 'normal' | 'large';
  order: number;
  canHide: boolean;
  canResize: boolean;
}

const defaultSections: HomeSection[] = [
  {
    id: 'quick_actions',
    title: 'Быстрые действия',
    description: 'Каталог и Автоматы',
    icon: Coffee,
    visible: true,
    size: 'normal',
    order: 1,
    canHide: false,
    canResize: false,
  },
  {
    id: 'secondary_actions',
    title: 'Дополнительные действия',
    description: 'QR Скан и Акции',
    icon: QrCode,
    visible: true,
    size: 'normal',
    order: 2,
    canHide: true,
    canResize: false,
  },
  {
    id: 'bonus_card',
    title: 'Бонусная карта',
    description: 'Баланс и уровень',
    icon: Gift,
    visible: true,
    size: 'normal',
    order: 3,
    canHide: true,
    canResize: true,
  },
  {
    id: 'stats',
    title: 'Статистика',
    description: 'Заказы и траты',
    icon: TrendingUp,
    visible: true,
    size: 'normal',
    order: 4,
    canHide: true,
    canResize: false,
  },
  {
    id: 'recommendations',
    title: 'Рекомендации',
    description: 'Персональные предложения',
    icon: Sparkles,
    visible: true,
    size: 'normal',
    order: 5,
    canHide: true,
    canResize: true,
  },
  {
    id: 'promo_banner',
    title: 'Промо баннер',
    description: 'Текущие акции',
    icon: Percent,
    visible: true,
    size: 'normal',
    order: 6,
    canHide: true,
    canResize: false,
  },
  {
    id: 'popular',
    title: 'Популярное',
    description: 'Популярные напитки',
    icon: Star,
    visible: true,
    size: 'normal',
    order: 7,
    canHide: true,
    canResize: true,
  },
];

const sizeLabels: Record<string, string> = {
  compact: 'Компактный',
  normal: 'Обычный',
  large: 'Большой',
};

export default function HomeSettings() {
  const { haptic } = useTelegram();
  const [, navigate] = useLocation();
  const [sections, setSections] = useState<HomeSection[]>(defaultSections);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch user preferences
  const { data: preferences, isLoading, refetch } = trpc.gamification.getPreferences.useQuery();
  
  // Save preferences mutation
  const savePreferencesMutation = trpc.gamification.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success('Настройки сохранены');
      setHasChanges(false);
      setIsSaving(false);
    },
    onError: () => {
      toast.error('Ошибка сохранения');
      setIsSaving(false);
    },
  });

  // Load saved preferences
  useEffect(() => {
    if (preferences?.homeSections) {
      const savedSections = preferences.homeSections as any[];
      const mergedSections = defaultSections.map(defaultSection => {
        const saved = savedSections.find(s => s.id === defaultSection.id);
        if (saved) {
          return {
            ...defaultSection,
            visible: saved.visible ?? defaultSection.visible,
            size: saved.size ?? defaultSection.size,
            order: saved.order ?? defaultSection.order,
          };
        }
        return defaultSection;
      });
      // Sort by order
      mergedSections.sort((a, b) => a.order - b.order);
      setSections(mergedSections);
    }
  }, [preferences]);

  const handleReorder = (newOrder: HomeSection[]) => {
    haptic.selection();
    const reordered = newOrder.map((section, index) => ({
      ...section,
      order: index + 1,
    }));
    setSections(reordered);
    setHasChanges(true);
  };

  const handleToggleVisibility = (sectionId: string) => {
    haptic.selection();
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, visible: !section.visible }
        : section
    ));
    setHasChanges(true);
  };

  const handleSizeChange = (sectionId: string, size: string) => {
    haptic.selection();
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, size: size as 'compact' | 'normal' | 'large' }
        : section
    ));
    setHasChanges(true);
  };

  const handleReset = () => {
    haptic.impact('medium');
    setSections(defaultSections);
    setHasChanges(true);
    toast.info('Настройки сброшены');
  };

  const handleSave = () => {
    haptic.impact('medium');
    setIsSaving(true);
    
    const homeSections = sections.map(section => ({
      id: section.id,
      visible: section.visible,
      size: section.size,
      order: section.order,
    }));
    
    savePreferencesMutation.mutate({ homeSections });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/profile/settings">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => haptic.selection()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold">Настройка главной</h1>
            <p className="text-xs text-muted-foreground">Перетащите для изменения порядка</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleReset}
            className="text-muted-foreground"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <main className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Instructions */}
            <Card className="p-3 mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Перетащите разделы для изменения порядка. Используйте переключатели для скрытия разделов.
              </p>
            </Card>

            {/* Sections list */}
            <Reorder.Group 
              axis="y" 
              values={sections} 
              onReorder={handleReorder}
              className="space-y-3"
            >
              {sections.map((section) => {
                const Icon = section.icon;
                
                return (
                  <Reorder.Item
                    key={section.id}
                    value={section}
                    className="touch-none"
                  >
                    <Card className={cn(
                      "p-4 transition-all",
                      !section.visible && "opacity-50"
                    )}>
                      <div className="flex items-start gap-3">
                        {/* Drag handle */}
                        <div className="pt-1 cursor-grab active:cursor-grabbing text-muted-foreground">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        
                        {/* Icon */}
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                          section.visible 
                            ? "bg-amber-100 dark:bg-amber-900/50" 
                            : "bg-gray-100 dark:bg-gray-800"
                        )}>
                          <Icon className={cn(
                            "w-5 h-5",
                            section.visible ? "text-amber-600" : "text-gray-400"
                          )} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {section.title}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {section.description}
                              </p>
                            </div>
                            
                            {/* Visibility toggle */}
                            {section.canHide ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                                onClick={() => handleToggleVisibility(section.id)}
                              >
                                {section.visible ? (
                                  <Eye className="w-5 h-5 text-green-600" />
                                ) : (
                                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                                )}
                              </Button>
                            ) : (
                              <div className="w-10 h-10 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">Обяз.</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Size selector */}
                          {section.canResize && section.visible && (
                            <div className="flex items-center gap-2 mt-2">
                              <Label className="text-xs text-muted-foreground">Размер:</Label>
                              <Select
                                value={section.size}
                                onValueChange={(value) => handleSizeChange(section.id, value)}
                              >
                                <SelectTrigger className="h-7 w-28 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="compact">Компактный</SelectItem>
                                  <SelectItem value="normal">Обычный</SelectItem>
                                  <SelectItem value="large">Большой</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </>
        )}
      </main>

      {/* Save button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 left-4 right-4"
        >
          <Button
            className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-lg"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Сохранить изменения
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
