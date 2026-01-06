/**
 * Employee Assignments Page
 * Manage employee-machine assignments and track workload
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
import { Input } from "@/components/ui/input";
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
import { Plus, UserCheck, XCircle, Edit, Trash2, Users, Building2, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Assignments() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterMachine, setFilterMachine] = useState<string>("all");

  // Queries
  const { data: assignments = [], refetch: refetchAssignments } = trpc.admin.machineAssignments.list.useQuery();
  const { data: employees = [] } = trpc.admin.employees.list.useQuery();
  const { data: machines = [] } = trpc.admin.machines.list.useQuery();

  // Mutations
  const createMutation = trpc.admin.machineAssignments.create.useMutation({
    onSuccess: () => {
      toast.success("Назначение создано");
      refetchAssignments();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Ошибка создания назначения: " + error.message);
    },
  });

  const deactivateMutation = trpc.admin.machineAssignments.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Назначение деактивировано");
      refetchAssignments();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const deleteMutation = trpc.admin.machineAssignments.delete.useMutation({
    onSuccess: () => {
      toast.success("Назначение удалено");
      refetchAssignments();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    machineId: "",
    employeeId: "",
    assignmentType: "primary" as "primary" | "secondary" | "temporary",
    status: "active" as "active" | "inactive" | "pending",
    responsibilities: "",
    notes: "",
  });

  const handleCreate = () => {
    if (!formData.machineId || !formData.employeeId) {
      toast.error("Выберите сотрудника и автомат");
      return;
    }

    createMutation.mutate({
      machineId: parseInt(formData.machineId),
      employeeId: parseInt(formData.employeeId),
      assignmentType: formData.assignmentType,
      status: formData.status,
      responsibilities: formData.responsibilities || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleDeactivate = (id: number) => {
    if (confirm("Деактивировать это назначение?")) {
      deactivateMutation.mutate({ id });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Удалить это назначение? Это действие нельзя отменить.")) {
      deleteMutation.mutate({ id });
    }
  };

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment) => {
    if (filterStatus !== "all" && assignment.status !== filterStatus) return false;
    if (filterEmployee !== "all" && assignment.employeeId !== parseInt(filterEmployee)) return false;
    if (filterMachine !== "all" && assignment.machineId !== parseInt(filterMachine)) return false;
    return true;
  });

  // Calculate statistics
  const activeCount = assignments.filter((a) => a.status === "active").length;
  const employeeWorkload = employees.map((emp) => ({
    employee: emp,
    activeAssignments: assignments.filter(
      (a) => a.employeeId === emp.id && a.status === "active"
    ).length,
  }));

  const machinesWithoutAssignment = machines.filter(
    (machine) => !assignments.some((a) => a.machineId === machine.id && a.status === "active")
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Активно</Badge>;
      case "inactive":
        return <Badge variant="secondary">Неактивно</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Ожидание</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "primary":
        return <Badge className="bg-blue-500">Основной</Badge>;
      case "secondary":
        return <Badge className="bg-purple-500">Дополнительный</Badge>;
      case "temporary":
        return <Badge className="bg-orange-500">Временный</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getEmployeeName = (id: number) => {
    const employee = employees.find((e) => e.id === id);
    return employee?.fullName || `ID: ${id}`;
  };

  const getMachineName = (id: number) => {
    const machine = machines.find((m) => m.id === id);
    return machine?.name || `ID: ${id}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Назначения сотрудников</h1>
          <p className="text-muted-foreground">Управление назначениями сотрудников на автоматы</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Создать назначение
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Новое назначение</DialogTitle>
              <DialogDescription>Назначить сотрудника на автомат</DialogDescription>
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
                <Label htmlFor="machine">Автомат *</Label>
                <Select
                  value={formData.machineId}
                  onValueChange={(value) => setFormData({ ...formData, machineId: value })}
                >
                  <SelectTrigger id="machine">
                    <SelectValue placeholder="Выберите автомат" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id.toString()}>
                        {machine.name} - {machine.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Тип назначения</Label>
                  <Select
                    value={formData.assignmentType}
                    onValueChange={(value: any) => setFormData({ ...formData, assignmentType: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Основной</SelectItem>
                      <SelectItem value="secondary">Дополнительный</SelectItem>
                      <SelectItem value="temporary">Временный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Статус</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Активно</SelectItem>
                      <SelectItem value="pending">Ожидание</SelectItem>
                      <SelectItem value="inactive">Неактивно</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="responsibilities">Обязанности</Label>
                <Textarea
                  id="responsibilities"
                  placeholder="Опишите обязанности сотрудника..."
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
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
                {createMutation.isPending ? "Создание..." : "Создать"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные назначения</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Всего назначений: {assignments.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Автоматы без назначения</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{machinesWithoutAssignment.length}</div>
            <p className="text-xs text-muted-foreground">Требуют назначения сотрудника</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные сотрудники</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employeeWorkload.filter((e) => e.activeAssignments > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Всего сотрудников: {employees.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Статус</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="active">Активно</SelectItem>
                  <SelectItem value="inactive">Неактивно</SelectItem>
                  <SelectItem value="pending">Ожидание</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
              <Label>Автомат</Label>
              <Select value={filterMachine} onValueChange={setFilterMachine}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {machines.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id.toString()}>
                      {machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Список назначений ({filteredAssignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Сотрудник</TableHead>
                  <TableHead>Автомат</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата начала</TableHead>
                  <TableHead>Дата окончания</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Нет назначений
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {getEmployeeName(assignment.employeeId)}
                      </TableCell>
                      <TableCell>{getMachineName(assignment.machineId)}</TableCell>
                      <TableCell>{getTypeBadge(assignment.assignmentType)}</TableCell>
                      <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                      <TableCell>
                        {format(new Date(assignment.startDate), "dd.MM.yyyy")}
                      </TableCell>
                      <TableCell>
                        {assignment.endDate
                          ? format(new Date(assignment.endDate), "dd.MM.yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {assignment.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivate(assignment.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(assignment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* Employee Workload */}
      <Card>
        <CardHeader>
          <CardTitle>Загрузка сотрудников</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employeeWorkload
              .filter((e) => e.activeAssignments > 0)
              .sort((a, b) => b.activeAssignments - a.activeAssignments)
              .map((item) => (
                <div key={item.employee.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.employee.fullName}</p>
                    <p className="text-sm text-muted-foreground">{item.employee.role}</p>
                  </div>
                  <Badge className="bg-blue-500">
                    {item.activeAssignments} {item.activeAssignments === 1 ? "автомат" : "автоматов"}
                  </Badge>
                </div>
              ))}
            {employeeWorkload.filter((e) => e.activeAssignments > 0).length === 0 && (
              <p className="text-center text-muted-foreground">Нет активных назначений</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
