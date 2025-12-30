/**
 * Tasks Management Admin Page
 * Kanban-style task management for employees
 */

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Clock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Task {
  id: number;
  title: string;
  description?: string;
  taskType: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: number;
  dueDate?: string;
  createdAt: string;
}

const TASK_TYPES = [
  { value: 'maintenance', label: 'Обслуживание' },
  { value: 'refill', label: 'Пополнение' },
  { value: 'cleaning', label: 'Чистка' },
  { value: 'repair', label: 'Ремонт' },
  { value: 'inspection', label: 'Проверка' },
  { value: 'inventory', label: 'Инвентаризация' },
  { value: 'other', label: 'Другое' },
];

const TASK_STATUSES = [
  { value: 'pending', label: 'Ожидание', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'В процессе', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Завершено', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Отменено', color: 'bg-red-100 text-red-800' },
];

const PRIORITIES = [
  { value: 'low', label: 'Низкий', color: 'bg-blue-100 text-blue-700' },
  { value: 'medium', label: 'Средний', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'Высокий', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Срочный', color: 'bg-red-100 text-red-700' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");

  // Mock data
  useEffect(() => {
    const mockTasks: Task[] = [
      {
        id: 1,
        title: "Пополнить бункер Арабики на Parus F4",
        description: "Уровень упал до 23%, требуется пополнение",
        taskType: "refill",
        priority: "high",
        status: "pending",
        assignedTo: 1,
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Обслуживание кофемолки #2 на Mega Planet",
        description: "Циклы: 9,800/10,000 (98%) - требуется замена щеток",
        taskType: "maintenance",
        priority: "urgent",
        status: "in_progress",
        assignedTo: 2,
        dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        title: "Инвентаризация ингредиентов",
        description: "INV-2025-002 - Выборочная проверка",
        taskType: "inventory",
        priority: "medium",
        status: "in_progress",
        assignedTo: 3,
        dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 4,
        title: "Чистка фильтров на всех автоматах",
        description: "Еженедельная процедура",
        taskType: "cleaning",
        priority: "low",
        status: "pending",
        assignedTo: 1,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 5,
        title: "Проверка датчика уровня молока",
        description: "Parus F4 - датчик показывает неправильные значения",
        taskType: "inspection",
        priority: "high",
        status: "completed",
        assignedTo: 2,
        dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    setTasks(mockTasks);
    setLoading(false);
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const tasksByStatus = {
    pending: filteredTasks.filter(t => t.status === 'pending'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
    cancelled: filteredTasks.filter(t => t.status === 'cancelled'),
  };

  const getPriorityColor = (priority: TaskPriority) => {
    return PRIORITIES.find(p => p.value === priority)?.color || '';
  };

  const getStatusColor = (status: TaskStatus) => {
    return TASK_STATUSES.find(s => s.value === status)?.color || '';
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const taskDate = new Date(date);
    const diffMs = taskDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) return "Просрочено";
    if (diffHours < 1) return "< 1 часа";
    if (diffHours < 24) return `${diffHours}ч`;
    return `${Math.floor(diffHours / 24)}д`;
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm text-gray-900 dark:text-white flex-1">
          {task.title}
        </h4>
        <Badge className={getPriorityColor(task.priority)}>
          {PRIORITIES.find(p => p.value === task.priority)?.label}
        </Badge>
      </div>
      
      {task.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">
          {TASK_TYPES.find(t => t.value === task.taskType)?.label}
        </span>
        {task.dueDate && (
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{formatTime(task.dueDate)}</span>
          </div>
        )}
      </div>
    </Card>
  );

  const KanbanColumn = ({ status, title, tasks }: { status: TaskStatus; title: string; tasks: Task[] }) => (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex-1 min-h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {title}
          <Badge variant="secondary">{tasks.length}</Badge>
        </h3>
      </div>
      
      <div className="flex-1 space-y-2 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">Нет задач</p>
          </div>
        ) : (
          tasks.map(task => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );

  return (
    <AdminLayout title="Управление задачами" description="Kanban доска для управления рабочими задачами">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {tasks.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Всего задач</p>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {tasksByStatus.pending.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Ожидание</p>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {tasksByStatus.in_progress.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">В процессе</p>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {tasksByStatus.completed.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Завершено</p>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Поиск задач..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {TASK_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Приоритет" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все приоритеты</SelectItem>
              {PRIORITIES.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            Новая задача
          </Button>
        </div>

        {/* Kanban Board */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            <KanbanColumn status="pending" title="📋 Ожидание" tasks={tasksByStatus.pending} />
            <KanbanColumn status="in_progress" title="⚙️ В процессе" tasks={tasksByStatus.in_progress} />
            <KanbanColumn status="completed" title="✅ Завершено" tasks={tasksByStatus.completed} />
            <KanbanColumn status="cancelled" title="❌ Отменено" tasks={tasksByStatus.cancelled} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
