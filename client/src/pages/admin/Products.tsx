/**
 * Admin Products Management Page
 * CRUD operations for products catalog
 */

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Coffee,
  Filter,
  MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Product {
  id: number;
  slug: string;
  name: string;
  nameRu?: string | null;
  nameUz?: string | null;
  description?: string | null;
  descriptionRu?: string | null;
  descriptionUz?: string | null;
  price: number;
  category: string;
  imageUrl?: string | null;
  isAvailable: boolean;
  isPopular: boolean;
  sortOrder?: number;
}

type ProductCategory = 'coffee' | 'tea' | 'cold_drinks' | 'snacks' | 'other';

interface ProductFormData {
  name: string;
  nameRu: string;
  nameUz: string;
  description: string;
  descriptionRu: string;
  descriptionUz: string;
  price: number;
  category: ProductCategory;
  imageUrl: string;
  isAvailable: boolean;
  isPopular: boolean;
}

const categories: { value: ProductCategory; label: string }[] = [
  { value: "coffee", label: "Кофе" },
  { value: "tea", label: "Чай" },
  { value: "cold_drinks", label: "Холодные напитки" },
  { value: "snacks", label: "Снеки" },
  { value: "other", label: "Другое" },
];

const defaultFormData: ProductFormData = {
  name: "",
  nameRu: "",
  nameUz: "",
  description: "",
  descriptionRu: "",
  descriptionUz: "",
  price: 0,
  category: "coffee",
  imageUrl: "",
  isAvailable: true,
  isPopular: false,
};

export default function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);

  const { data: products, refetch } = trpc.products.list.useQuery();
  const utils = trpc.useUtils();

  // Mutations
  const createMutation = trpc.admin.products.create.useMutation({
    onSuccess: () => {
      toast.success("Продукт создан");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const updateMutation = trpc.admin.products.update.useMutation({
    onSuccess: () => {
      toast.success("Продукт обновлён");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const deleteMutation = trpc.admin.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Продукт удалён");
      refetch();
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingProduct(null);
  };

  const handleCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      nameRu: product.nameRu || "",
      nameUz: product.nameUz || "",
      description: product.description || "",
      descriptionRu: product.descriptionRu || "",
      descriptionUz: product.descriptionUz || "",
      price: product.price,
      category: product.category as ProductCategory,
      imageUrl: product.imageUrl || "",
      isAvailable: product.isAvailable,
      isPopular: product.isPopular,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || formData.price <= 0) {
      toast.error("Заполните обязательные поля");
      return;
    }

    const slug = formData.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    if (editingProduct) {
      updateMutation.mutate({
        id: editingProduct.id,
        ...formData,
        slug,
      });
    } else {
      createMutation.mutate({
        ...formData,
        slug,
      });
    }
  };

  const confirmDelete = () => {
    if (deletingProduct) {
      deleteMutation.mutate({ id: deletingProduct.id });
    }
  };

  // Filter products
  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.nameRu?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU').format(value) + ' UZS';
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  return (
    <AdminLayout title="Продукты" description="Управление каталогом продуктов">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Поиск по названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleCreate} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Добавить продукт
        </Button>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Фото</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead className="text-right">Цена</TableHead>
                <TableHead className="text-center">Статус</TableHead>
                <TableHead className="text-center">Популярный</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                        <Coffee className="w-5 h-5 text-amber-600" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.nameRu || product.name}</p>
                      <p className="text-xs text-gray-500">{product.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {getCategoryLabel(product.category)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(product.price)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      product.isAvailable 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {product.isAvailable ? "Доступен" : "Недоступен"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {product.isPopular && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        ⭐ Топ
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Продукты не найдены
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Редактировать продукт" : "Добавить продукт"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "Измените данные продукта" : "Заполните данные нового продукта"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название (EN) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Cappuccino"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameRu">Название (RU)</Label>
                <Input
                  id="nameRu"
                  value={formData.nameRu}
                  onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                  placeholder="Капучино"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameUz">Название (UZ)</Label>
              <Input
                id="nameUz"
                value={formData.nameUz}
                onChange={(e) => setFormData({ ...formData, nameUz: e.target.value })}
                placeholder="Kapuchino"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionRu">Описание (RU)</Label>
              <Textarea
                id="descriptionRu"
                value={formData.descriptionRu}
                onChange={(e) => setFormData({ ...formData, descriptionRu: e.target.value })}
                placeholder="Классический итальянский напиток..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Цена (UZS) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  placeholder="20000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Категория</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value as ProductCategory })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL изображения</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
                />
                <Label htmlFor="isAvailable">Доступен для заказа</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isPopular"
                  checked={formData.isPopular}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                />
                <Label htmlFor="isPopular">Популярный продукт</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {createMutation.isPending || updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить продукт?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить "{deletingProduct?.nameRu || deletingProduct?.name}"? 
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Удаление..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
