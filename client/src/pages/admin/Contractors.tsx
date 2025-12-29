import { useState } from "react";
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
import { 
  Plus, Pencil, Trash2, Building2, Phone, Mail, 
  MessageCircle, Search, Star, Package 
} from "lucide-react";
import { toast } from "sonner";

type Contractor = {
  id: number;
  name: string;
  type: "supplier" | "service" | "logistics" | "other";
  contactPerson: string;
  phone: string;
  email: string | null;
  telegramUsername: string | null;
  address: string | null;
  inn: string | null;
  bankAccount: string | null;
  categories: string[];
  rating: number;
  notes: string | null;
  isActive: boolean;
};

const typeLabels: Record<string, string> = {
  supplier: "Поставщик",
  service: "Сервис",
  logistics: "Логистика",
  other: "Другое",
};

const mockContractors: Contractor[] = [
  { 
    id: 1, 
    name: "CoffeeTrade Uzbekistan", 
    type: "supplier", 
    contactPerson: "Азиз Каримов",
    phone: "+998901234567",
    email: "info@coffeetrade.uz",
    telegramUsername: "coffeetrade_uz",
    address: "г. Ташкент, ул. Амира Темура, 45",
    inn: "123456789",
    bankAccount: "20208000123456789012",
    categories: ["Кофе", "Чай"],
    rating: 5,
    notes: "Основной поставщик кофе",
    isActive: true,
  },
  { 
    id: 2, 
    name: "TechParts Service", 
    type: "service", 
    contactPerson: "Рустам Алиев",
    phone: "+998909876543",
    email: "service@techparts.uz",
    telegramUsername: "techparts_service",
    address: "г. Ташкент, ул. Навои, 88",
    inn: "987654321",
    bankAccount: null,
    categories: ["Запчасти", "Ремонт"],
    rating: 4,
    notes: "Сервисное обслуживание автоматов",
    isActive: true,
  },
  { 
    id: 3, 
    name: "AquaFilter Pro", 
    type: "supplier", 
    contactPerson: "Дильшод Мирзаев",
    phone: "+998901112233",
    email: null,
    telegramUsername: "aquafilter",
    address: null,
    inn: null,
    bankAccount: null,
    categories: ["Фильтры", "Расходники"],
    rating: 4,
    notes: null,
    isActive: true,
  },
  { 
    id: 4, 
    name: "FastDelivery", 
    type: "logistics", 
    contactPerson: "Бахтиёр Усманов",
    phone: "+998905554433",
    email: "delivery@fast.uz",
    telegramUsername: null,
    address: "г. Ташкент",
    inn: "555666777",
    bankAccount: "20208000555666777888",
    categories: ["Доставка"],
    rating: 3,
    notes: "Доставка по городу",
    isActive: false,
  },
];

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>(mockContractors);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    name: "",
    type: "supplier" as Contractor["type"],
    contactPerson: "",
    phone: "",
    email: "",
    telegramUsername: "",
    address: "",
    inn: "",
    bankAccount: "",
    categories: "",
    rating: 5,
    notes: "",
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "supplier",
      contactPerson: "",
      phone: "",
      email: "",
      telegramUsername: "",
      address: "",
      inn: "",
      bankAccount: "",
      categories: "",
      rating: 5,
      notes: "",
      isActive: true,
    });
  };

  const handleEdit = (contractor: Contractor) => {
    setEditingContractor(contractor);
    setFormData({
      name: contractor.name,
      type: contractor.type,
      contactPerson: contractor.contactPerson,
      phone: contractor.phone,
      email: contractor.email || "",
      telegramUsername: contractor.telegramUsername || "",
      address: contractor.address || "",
      inn: contractor.inn || "",
      bankAccount: contractor.bankAccount || "",
      categories: contractor.categories.join(", "),
      rating: contractor.rating,
      notes: contractor.notes || "",
      isActive: contractor.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const contractorData = {
      ...formData,
      email: formData.email || null,
      telegramUsername: formData.telegramUsername || null,
      address: formData.address || null,
      inn: formData.inn || null,
      bankAccount: formData.bankAccount || null,
      categories: formData.categories.split(",").map(c => c.trim()).filter(Boolean),
      notes: formData.notes || null,
    };
    
    if (editingContractor) {
      setContractors(contractors.map(c => 
        c.id === editingContractor.id ? { ...c, ...contractorData } : c
      ));
      toast.success("Контрагент обновлён");
    } else {
      const newContractor: Contractor = {
        id: Math.max(...contractors.map(c => c.id)) + 1,
        ...contractorData,
      };
      setContractors([...contractors, newContractor]);
      toast.success("Контрагент добавлен");
    }
    setIsDialogOpen(false);
    setEditingContractor(null);
    resetForm();
  };

  const handleDelete = (id: number) => {
    if (confirm("Удалить контрагента?")) {
      setContractors(contractors.filter(c => c.id !== id));
      toast.success("Контрагент удалён");
    }
  };

  const filteredContractors = contractors.filter(c => {
    const matchesSearch = searchQuery === "" || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || c.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <AdminLayout title="Контрагенты" description="Управление поставщиками и партнёрами">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию или контакту..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Все типы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {Object.entries(typeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingContractor(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingContractor ? "Редактировать контрагента" : "Новый контрагент"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Название компании *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Тип</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as Contractor["type"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(typeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Рейтинг</Label>
                    <Select
                      value={formData.rating.toString()}
                      onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 4, 3, 2, 1].map((r) => (
                          <SelectItem key={r} value={r.toString()}>
                            {"★".repeat(r)}{"☆".repeat(5 - r)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Контактное лицо *</Label>
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Телефон *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
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
                  <Label>Адрес</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ИНН</Label>
                    <Input
                      value={formData.inn}
                      onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Расчётный счёт</Label>
                    <Input
                      value={formData.bankAccount}
                      onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Категории товаров/услуг</Label>
                  <Input
                    value={formData.categories}
                    onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                    placeholder="Кофе, Чай, Запчасти"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Заметки</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Активный контрагент</Label>
                </div>

                <Button type="submit" className="w-full">
                  {editingContractor ? "Сохранить" : "Добавить"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {filteredContractors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Нет контрагентов</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredContractors.map((contractor) => (
              <Card key={contractor.id} className={!contractor.isActive ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={contractor.isActive ? "default" : "secondary"}>
                          {typeLabels[contractor.type]}
                        </Badge>
                        <div className="flex items-center text-yellow-500">
                          {Array.from({ length: contractor.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <h3 className="font-semibold">{contractor.name}</h3>
                      <p className="text-sm text-muted-foreground">{contractor.contactPerson}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(contractor)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(contractor.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${contractor.phone}`} className="hover:underline">{contractor.phone}</a>
                    </div>
                    {contractor.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${contractor.email}`} className="hover:underline">{contractor.email}</a>
                      </div>
                    )}
                    {contractor.telegramUsername && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MessageCircle className="h-4 w-4" />
                        <a href={`https://t.me/${contractor.telegramUsername}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          @{contractor.telegramUsername}
                        </a>
                      </div>
                    )}
                  </div>

                  {contractor.categories.length > 0 && (
                    <div className="mt-3 pt-3 border-t flex flex-wrap gap-1">
                      {contractor.categories.map((cat, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <Package className="h-3 w-3 mr-1" />
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
