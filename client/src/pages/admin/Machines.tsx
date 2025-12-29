import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Coffee, MapPin, Wrench, User } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type Machine = {
  id: number;
  machineCode: string;
  name: string;
  model: string | null;
  serialNumber: string | null;
  manufacturer: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  groupId: number | null;
  status: "online" | "offline" | "maintenance" | "inactive";
  installationDate: string | null;
  lastMaintenanceDate: string | null;
  assignedEmployeeId: number | null;
  imageUrl: string | null;
};

const statusLabels: Record<string, string> = {
  online: "Онлайн",
  offline: "Офлайн",
  maintenance: "Обслуживание",
  inactive: "Неактивен",
};

const statusColors: Record<string, string> = {
  online: "bg-green-500",
  offline: "bg-red-500",
  maintenance: "bg-yellow-500",
  inactive: "bg-gray-500",
};

export default function MachinesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState({
    machineCode: "",
    name: "",
    model: "",
    serialNumber: "",
    manufacturer: "",
    address: "",
    latitude: "",
    longitude: "",
    status: "online" as Machine["status"],
    assignedEmployeeId: null as number | null,
  });

  const queryClient = useQueryClient();

  const { data: machines = [], isLoading } = trpc.admin.machines.list.useQuery();
  const { data: employees = [] } = trpc.admin.employees.list.useQuery();

  const createMutation = trpc.admin.machines.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["admin", "machines", "list"]] });
      toast.success("Автомат добавлен");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const updateMutation = trpc.admin.machines.update.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["admin", "machines", "list"]] });
      toast.success("Автомат обновлён");
      setIsDialogOpen(false);
      setEditingMachine(null);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const deleteMutation = trpc.admin.machines.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["admin", "machines", "list"]] });
      toast.success("Автомат удалён");
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      machineCode: "",
      name: "",
      model: "",
      serialNumber: "",
      manufacturer: "",
      address: "",
      latitude: "",
      longitude: "",
      status: "online",
      assignedEmployeeId: null,
    });
  };

  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setFormData({
      machineCode: machine.machineCode,
      name: machine.name,
      model: machine.model || "",
      serialNumber: machine.serialNumber || "",
      manufacturer: machine.manufacturer || "",
      address: machine.address || "",
      latitude: machine.latitude || "",
      longitude: machine.longitude || "",
      status: machine.status,
      assignedEmployeeId: machine.assignedEmployeeId,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMachine) {
      updateMutation.mutate({ id: editingMachine.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Удалить автомат?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <AdminLayout title="Автоматы" description="Управление вендинговыми автоматами">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div />
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingMachine(null);
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
                  {editingMachine ? "Редактировать автомат" : "Новый автомат"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Код *</Label>
                    <Input
                      value={formData.machineCode}
                      onChange={(e) => setFormData({ ...formData, machineCode: e.target.value })}
                      placeholder="VM001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Статус</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as Machine["status"] })}
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
                  <Label>Название *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Автомат в офисе"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Модель</Label>
                    <Input
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Necta Koro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Производитель</Label>
                    <Input
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      placeholder="Necta"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Серийный номер</Label>
                  <Input
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Адрес</Label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Широта</Label>
                    <Input
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="41.311081"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Долгота</Label>
                    <Input
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="69.240562"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ответственный сотрудник</Label>
                  <Select
                    value={formData.assignedEmployeeId?.toString() || "none"}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      assignedEmployeeId: value === "none" ? null : parseInt(value) 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Не назначен" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Не назначен</SelectItem>
                      {(employees as any[]).map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingMachine ? "Сохранить" : "Добавить"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
        ) : machines.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Coffee className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Нет автоматов</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(machines as Machine[]).map((machine) => (
              <Card key={machine.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{machine.machineCode}</Badge>
                        <Badge className={statusColors[machine.status]}>
                          {statusLabels[machine.status]}
                        </Badge>
                      </div>
                      <h3 className="font-semibold">{machine.name}</h3>
                      {machine.model && (
                        <p className="text-sm text-muted-foreground">
                          {machine.manufacturer} {machine.model}
                        </p>
                      )}
                      {machine.address && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {machine.address}
                        </p>
                      )}
                      {machine.lastMaintenanceDate && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          Обслуживание: {new Date(machine.lastMaintenanceDate).toLocaleDateString("ru")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(machine)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(machine.id)}>
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
