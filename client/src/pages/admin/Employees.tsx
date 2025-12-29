import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import { Plus, Pencil, Trash2, Users, Phone, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type Employee = {
  id: number;
  fullName: string;
  phone: string | null;
  email: string | null;
  username: string | null;
  role: "platform_owner" | "platform_admin" | "org_owner" | "org_admin" | "manager" | "supervisor" | "operator" | "technician" | "collector" | "warehouse_manager" | "warehouse_worker" | "accountant" | "investor";
  status: "pending" | "active" | "inactive" | "suspended";
  telegramUserId: string | null;
  telegramUsername: string | null;
  hireDate: Date;
  salary: number;
  notes: string | null;
};

const roleLabels: Record<string, string> = {
  platform_owner: "Владелец платформы",
  platform_admin: "Админ платформы",
  org_owner: "Владелец организации",
  org_admin: "Админ организации",
  manager: "Менеджер",
  supervisor: "Супервайзер",
  operator: "Оператор",
  technician: "Техник",
  collector: "Инкассатор",
  warehouse_manager: "Менеджер склада",
  warehouse_worker: "Работник склада",
  accountant: "Бухгалтер",
  investor: "Инвестор",
};

const statusLabels: Record<string, string> = {
  pending: "Ожидание",
  active: "Активен",
  inactive: "Неактивен",
  suspended: "Заблокирован",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  active: "bg-green-500",
  inactive: "bg-gray-500",
  suspended: "bg-red-500",
};

export default function EmployeesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    username: "",
    role: "operator" as Employee["role"],
    status: "active" as Employee["status"],
    telegramUsername: "",
    salary: 0,
    notes: "",
  });

  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = trpc.admin.employees.list.useQuery();

  const createMutation = trpc.admin.employees.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["admin", "employees", "list"]] });
      toast.success("Сотрудник добавлен");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const updateMutation = trpc.admin.employees.update.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["admin", "employees", "list"]] });
      toast.success("Сотрудник обновлён");
      setIsDialogOpen(false);
      setEditingEmployee(null);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const deleteMutation = trpc.admin.employees.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["admin", "employees", "list"]] });
      toast.success("Сотрудник удалён");
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      username: "",
      role: "technician",
      status: "active",
      telegramUsername: "",
      salary: 0,
      notes: "",
    });
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      fullName: employee.fullName,
      phone: employee.phone || "",
      email: employee.email || "",
      username: employee.username || "",
      role: employee.role,
      status: employee.status,
      telegramUsername: employee.telegramUsername || "",
      salary: employee.salary,
      notes: employee.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Удалить сотрудника?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <AdminLayout title="Сотрудники" description="Управление персоналом">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div />
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingEmployee(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee ? "Редактировать сотрудника" : "Новый сотрудник"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>ФИО *</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Роль</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value as Employee["role"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Статус</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as Employee["status"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Телефон</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+998 90 123 45 67"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telegram</Label>
                  <Input
                    value={formData.telegramUsername}
                    onChange={(e) => setFormData({ ...formData, telegramUsername: e.target.value })}
                    placeholder="@username"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Зарплата (UZS)</Label>
                  <Input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Примечания</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingEmployee ? "Сохранить" : "Добавить"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
        ) : employees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Нет сотрудников</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {(employees as Employee[]).map((employee) => (
              <Card key={employee.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{employee.fullName}</h3>
                        <Badge variant="outline">{roleLabels[employee.role]}</Badge>
                        <Badge className={statusColors[employee.status]}>
                          {statusLabels[employee.status]}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {employee.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {employee.phone}
                          </span>
                        )}
                        {employee.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                          </span>
                        )}
                        {employee.telegramUsername && (
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            @{employee.telegramUsername}
                          </span>
                        )}
                      </div>
                      {employee.salary > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Зарплата: {employee.salary.toLocaleString()} UZS
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(employee.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
