/**
 * Work Logs Page
 * Track employee work activities and sessions
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle, XCircle, Clock, TrendingUp, Activity } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function WorkLogs() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterWorkType, setFilterWorkType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Queries
  const { data: workLogs = [], refetch: refetchLogs } = trpc.admin.workLogs.list.useQuery();
  const { data: employees = [] } = trpc.admin.employees.list.useQuery();
  const { data: machines = [] } = trpc.admin.machines.list.useQuery();

  // Mutations
  const createMutation = trpc.admin.workLogs.create.useMutation({
    onSuccess: () => {
      toast.success("Рабочая сессия начата");
      refetchLogs();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const completeMutation = trpc.admin.workLogs.complete.useMutation({
    onSuccess: () => {
      toast.success("Работа завершена");
      refetchLogs();
      setIsCompleteDialogOpen(false);
      setSelectedLog(null);
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const cancelMutation = trpc.admin.workLogs.cancel.useMutation({
    onSuccess: () => {
      toast.success("Работа отменена");
      refetchLogs();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    employeeId: "",
    machineId: "",
    workType: "maintenance" as any,
    description: "",
    notes: "",
  });

  const [completeFormData, setCompleteFormData] = useState({
    notes: "",
    rating: 5,
  });

  const handleCreate = () => {
    if (!formData.employeeId) {
      toast.error("Выберите сотрудника");
      return;
    }

    createMutation.mutate({
      employeeId: parseInt(formData.employeeId),
      machineId: formData.machineId && formData.machineId !== 'none' ? parseInt(formData.machineId) : undefined,
      workType: formData.workType,
      description: formData.description || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleComplete = () => {
    if (!selectedLog) return;

    completeMutation.mutate({
      id: selectedLog.id,
      notes: completeFormData.notes || undefined,
      rating: completeFormData.rating,
    });
  };

  const handleCancel = (id: number) => {
    if (confirm("Отменить эту рабочую сессию?")) {
      cancelMutation.mutate({ id, notes: "Отменено администратором" });
    }
  };

  // Filter logs
  const filteredLogs = workLogs.filter((log) => {
    if (filterEmployee !== "all" && log.employeeId !== parseInt(filterEmployee)) return false;
    if (filterWorkType !== "all" && log.workType !== filterWorkType) return false;
    if (filterStatus !== "all" && log.status !== filterStatus) return false;
    return true;
  });

  // Calculate statistics
  const inProgressCount = workLogs.filter((l) => l.status === "in_progress").length;
  const completedToday = workLogs.filter((l) => {
    if (l.status !== "completed" || !l.endTime) return false;
    const today = new Date();
    const logDate = new Date(l.endTime);
    return logDate.toDateString() === today.toDateString();
  }).length;
  
  const totalHoursToday = workLogs
    .filter((l) => {
      if (l.status !== "completed" || !l.endTime) return false;
      const today = new Date();
      const logDate = new Date(l.endTime);
      return logDate.toDateString() === today.toDateString();
    })
    .reduce((sum, log) => sum + (log.duration || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge className="bg-blue-500">В процессе</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Завершено</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Отменено</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getWorkTypeName = (type: string) => {
    const types: Record<string, string> = {
      maintenance: "Обслуживание",
      refill: "Пополнение",
      cleaning: "Очистка",
      repair: "Ремонт",
      inspection: "Инспекция",
      installation: "Установка",
      other: "Другое",
    };
    return types[type] || type;
  };

  const getEmployeeName = (id: number) => {
    const employee = employees.find((e) => e.id === id);
    return employee?.fullName || `ID: ${id}`;
  };

  const getMachineName = (id: number | null) => {
    if (!id) return "-";
    const machine = machines.find((m) => m.id === id);
    return machine?.name || `ID: ${id}`;
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Журнал работ</h1>
          <p className="text-muted-foreground">Отслеживание рабочих активностей сотрудников</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Начать работу
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Новая рабочая сессия</DialogTitle>
              <DialogDescription>Начать отслеживание работы сотрудника</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="employee">Сотрудник *</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                >
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="Выберите сотрудника" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.fullName} ({emp.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="machine">Автомат (опционально)</Label>
                <Select
                  value={formData.machineId}
                  onValueChange={(value) => setFormData({ ...formData, machineId: value })}
                >
                  <SelectTrigger id="machine">
                    <SelectValue placeholder="Выберите автомат" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не указан</SelectItem>
                    {machines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id.toString()}>
                        {machine.name} - {machine.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="workType">Тип работы *</Label>
                <Select
                  value={formData.workType}
                  onValueChange={(value: any) => setFormData({ ...formData, workType: value })}
                >
                  <SelectTrigger id="workType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Обслуживание</SelectItem>
                    <SelectItem value="refill">Пополнение</SelectItem>
                    <SelectItem value="cleaning">Очистка</SelectItem>
                    <SelectItem value="repair">Ремонт</SelectItem>
                    <SelectItem value="inspection">Инспекция</SelectItem>
                    <SelectItem value="installation">Установка</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  placeholder="Опишите работу..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Примечания</Label>
                <Textarea
                  id="notes"
                  placeholder="Дополнительные примечания..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Создание..." : "Начать работу"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В процессе</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">Активные рабочие сессии</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Завершено сегодня</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedToday}</div>
            <p className="text-xs text-muted-foreground">Выполненных работ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Часов сегодня</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalHoursToday)}</div>
            <p className="text-xs text-muted-foreground">Общее время работы</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Сотрудник</Label>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Тип работы</Label>
              <Select value={filterWorkType} onValueChange={setFilterWorkType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="maintenance">Обслуживание</SelectItem>
                  <SelectItem value="refill">Пополнение</SelectItem>
                  <SelectItem value="cleaning">Очистка</SelectItem>
                  <SelectItem value="repair">Ремонт</SelectItem>
                  <SelectItem value="inspection">Инспекция</SelectItem>
                  <SelectItem value="installation">Установка</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Статус</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="in_progress">В процессе</SelectItem>
                  <SelectItem value="completed">Завершено</SelectItem>
                  <SelectItem value="cancelled">Отменено</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Журнал работ ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Сотрудник</TableHead>
                  <TableHead>Автомат</TableHead>
                  <TableHead>Тип работы</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Начало</TableHead>
                  <TableHead>Окончание</TableHead>
                  <TableHead>Длительность</TableHead>
                  <TableHead>Оценка</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Нет записей
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {getEmployeeName(log.employeeId)}
                      </TableCell>
                      <TableCell>{getMachineName(log.machineId)}</TableCell>
                      <TableCell>{getWorkTypeName(log.workType)}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        {format(new Date(log.startTime), "dd.MM.yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        {log.endTime ? format(new Date(log.endTime), "dd.MM.yyyy HH:mm") : "-"}
                      </TableCell>
                      <TableCell>{formatDuration(log.duration)}</TableCell>
                      <TableCell>
                        {log.rating ? (
                          <Badge className="bg-yellow-500">★ {log.rating}/5</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {log.status === "in_progress" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedLog(log);
                                  setIsCompleteDialogOpen(true);
                                }}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancel(log.id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Complete Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Завершить работу</DialogTitle>
            <DialogDescription>Добавьте примечания и оценку качества</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="completeNotes">Примечания</Label>
              <Textarea
                id="completeNotes"
                placeholder="Что было сделано..."
                value={completeFormData.notes}
                onChange={(e) => setCompleteFormData({ ...completeFormData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rating">Оценка качества (1-5)</Label>
              <Select
                value={completeFormData.rating.toString()}
                onValueChange={(value) =>
                  setCompleteFormData({ ...completeFormData, rating: parseInt(value) })
                }
              >
                <SelectTrigger id="rating">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">★★★★★ Отлично</SelectItem>
                  <SelectItem value="4">★★★★☆ Хорошо</SelectItem>
                  <SelectItem value="3">★★★☆☆ Удовлетворительно</SelectItem>
                  <SelectItem value="2">★★☆☆☆ Плохо</SelectItem>
                  <SelectItem value="1">★☆☆☆☆ Очень плохо</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleComplete} disabled={completeMutation.isPending}>
              {completeMutation.isPending ? "Завершение..." : "Завершить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
