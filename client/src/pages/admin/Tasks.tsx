/**
 * VendHub TWA - Admin Tasks Management Page
 * Manage gamification tasks and rewards
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  Gift,
  Star,
  MessageCircle,
  Mail,
  ShoppingBag,
  Award,
  Calendar,
  Share2,
  Users,
  Trophy,
  Zap,
  Check,
  X
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

// Icon mapping
const taskIcons: Record<string, React.ElementType> = {
  MessageCircle,
  Mail,
  ShoppingBag,
  Award,
  Calendar,
  Share2,
  Users,
  Gift,
  Star,
  Trophy,
  Zap,
};

const taskTypeLabels: Record<string, string> = {
  link_telegram: 'Привязка Telegram',
  link_email: 'Привязка Email',
  first_order: 'Первый заказ',
  order_count: 'Количество заказов',
  spend_amount: 'Сумма покупок',
  referral: 'Реферал',
  daily_login: 'Ежедневный вход',
  review: 'Отзыв',
  social_share: 'Поделиться',
  custom: 'Другое',
};

interface TaskFormData {
  slug: string;
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  taskType: string;
  pointsReward: number;
  requiredValue: number;
  isRepeatable: boolean;
  repeatCooldownHours: number | null;
  maxCompletions: number | null;
  iconName: string;
  sortOrder: number;
  isActive: boolean;
}

const defaultFormData: TaskFormData = {
  slug: '',
  title: '',
  titleRu: '',
  description: '',
  descriptionRu: '',
  taskType: 'custom',
  pointsReward: 100,
  requiredValue: 1,
  isRepeatable: false,
  repeatCooldownHours: null,
  maxCompletions: null,
  iconName: 'Gift',
  sortOrder: 0,
  isActive: true,
};

export default function AdminTasks() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [formData, setFormData] = useState<TaskFormData>(defaultFormData);
  
  // Fetch tasks
  const { data: tasks, isLoading, refetch } = trpc.gamification.adminTasks.useQuery({ 
    includeInactive: true 
  });
  
  // Mutations
  const createTaskMutation = trpc.gamification.adminCreateTask.useMutation({
    onSuccess: () => {
      toast.success('Задание создано');
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      refetch();
    },
    onError: (error) => {
      toast.error('Ошибка создания задания');
    },
  });
  
  const updateTaskMutation = trpc.gamification.adminUpdateTask.useMutation({
    onSuccess: () => {
      toast.success('Задание обновлено');
      setIsDialogOpen(false);
      setEditingTask(null);
      setFormData(defaultFormData);
      refetch();
    },
    onError: (error) => {
      toast.error('Ошибка обновления задания');
    },
  });
  
  const deleteTaskMutation = trpc.gamification.adminDeleteTask.useMutation({
    onSuccess: () => {
      toast.success('Задание удалено');
      refetch();
    },
    onError: (error) => {
      toast.error('Ошибка удаления задания');
    },
  });
  
  const seedTasksMutation = trpc.gamification.seedTasks.useMutation({
    onSuccess: () => {
      toast.success('Базовые задания созданы');
      refetch();
    },
    onError: (error) => {
      toast.error('Ошибка создания базовых заданий');
    },
  });

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (task: any) => {
    setEditingTask(task.id);
    setFormData({
      slug: task.slug,
      title: task.title,
      titleRu: task.titleRu || '',
      description: task.description || '',
      descriptionRu: task.descriptionRu || '',
      taskType: task.taskType,
      pointsReward: task.pointsReward,
      requiredValue: task.requiredValue || 1,
      isRepeatable: task.isRepeatable,
      repeatCooldownHours: task.repeatCooldownHours,
      maxCompletions: task.maxCompletions,
      iconName: task.iconName || 'Gift',
      sortOrder: task.sortOrder,
      isActive: task.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.slug || !formData.title || !formData.pointsReward) {
      toast.error('Заполните обязательные поля');
      return;
    }
    
    const data = {
      ...formData,
      taskType: formData.taskType as any,
      repeatCooldownHours: formData.isRepeatable ? formData.repeatCooldownHours || undefined : undefined,
      maxCompletions: formData.maxCompletions || undefined,
    };
    
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask, ...data });
    } else {
      createTaskMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Удалить задание?')) {
      deleteTaskMutation.mutate({ id });
    }
  };

  const handleToggleActive = (task: any) => {
    updateTaskMutation.mutate({ 
      id: task.id, 
      isActive: !task.isActive 
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold">Управление заданиями</h1>
            <p className="text-xs text-muted-foreground">Геймификация и награды</p>
          </div>
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Добавить
          </Button>
        </div>
      </div>

      <main className="px-4 py-4 space-y-4">
        {/* Seed button */}
        {(!tasks || tasks.length === 0) && (
          <Card className="p-4">
            <div className="text-center">
              <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold">Нет заданий</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Создайте базовые задания для начала
              </p>
              <Button 
                onClick={() => seedTasksMutation.mutate()}
                disabled={seedTasksMutation.isPending}
              >
                {seedTasksMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Создать базовые задания
              </Button>
            </div>
          </Card>
        )}

        {/* Tasks list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : tasks && tasks.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {tasks.map((task, index) => {
              const Icon = taskIcons[task.iconName || 'Gift'] || Gift;
              
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={cn(
                    "p-4",
                    !task.isActive && "opacity-60"
                  )}>
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        task.isActive 
                          ? "bg-amber-100 dark:bg-amber-900/50" 
                          : "bg-gray-100 dark:bg-gray-800"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          task.isActive ? "text-amber-600" : "text-gray-400"
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {task.titleRu || task.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {taskTypeLabels[task.taskType]} • {task.slug}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 shrink-0">
                            <Star className="w-3 h-3 text-amber-600" />
                            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                              +{task.pointsReward}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {task.isRepeatable && (
                            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                              Повторяемое
                            </span>
                          )}
                          {task.requiredValue && task.requiredValue > 1 && (
                            <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                              Требуется: {task.requiredValue}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            Порядок: {task.sortOrder}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(task)}
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Изменить
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(task)}
                          >
                            {task.isActive ? (
                              <>
                                <X className="w-3 h-3 mr-1" />
                                Отключить
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Включить
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(task.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : null}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Редактировать задание' : 'Новое задание'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="task_slug"
                  disabled={!!editingTask}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taskType">Тип *</Label>
                <Select
                  value={formData.taskType}
                  onValueChange={(value) => setFormData({ ...formData, taskType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(taskTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Название (EN) *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task Title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="titleRu">Название (RU)</Label>
              <Input
                id="titleRu"
                value={formData.titleRu}
                onChange={(e) => setFormData({ ...formData, titleRu: e.target.value })}
                placeholder="Название задания"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descriptionRu">Описание (RU)</Label>
              <Input
                id="descriptionRu"
                value={formData.descriptionRu}
                onChange={(e) => setFormData({ ...formData, descriptionRu: e.target.value })}
                placeholder="Описание задания"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pointsReward">Награда (баллы) *</Label>
                <Input
                  id="pointsReward"
                  type="number"
                  value={formData.pointsReward}
                  onChange={(e) => setFormData({ ...formData, pointsReward: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requiredValue">Требуется</Label>
                <Input
                  id="requiredValue"
                  type="number"
                  value={formData.requiredValue}
                  onChange={(e) => setFormData({ ...formData, requiredValue: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="iconName">Иконка</Label>
                <Select
                  value={formData.iconName}
                  onValueChange={(value) => setFormData({ ...formData, iconName: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(taskIcons).map((icon) => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Порядок</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="isRepeatable">Повторяемое</Label>
              <Switch
                id="isRepeatable"
                checked={formData.isRepeatable}
                onCheckedChange={(checked) => setFormData({ ...formData, isRepeatable: checked })}
              />
            </div>
            
            {formData.isRepeatable && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="repeatCooldownHours">Кулдаун (часы)</Label>
                  <Input
                    id="repeatCooldownHours"
                    type="number"
                    value={formData.repeatCooldownHours || ''}
                    onChange={(e) => setFormData({ ...formData, repeatCooldownHours: parseInt(e.target.value) || null })}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxCompletions">Макс. выполнений</Label>
                  <Input
                    id="maxCompletions"
                    type="number"
                    value={formData.maxCompletions || ''}
                    onChange={(e) => setFormData({ ...formData, maxCompletions: parseInt(e.target.value) || null })}
                    min={1}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Активно</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
              >
                {(createTaskMutation.isPending || updateTaskMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {editingTask ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
