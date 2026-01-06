/**
 * Employee Performance Page
 * View and analyze employee performance metrics
 */

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, Clock, Target, Star, AlertCircle } from "lucide-react";

export default function Performance() {
  // Queries
  const { data: performanceData = [] } = trpc.admin.employeePerformance.list.useQuery();
  const { data: employees = [] } = trpc.admin.employees.list.useQuery();

  const getEmployeeName = (id: number) => {
    const employee = employees.find((e) => e.id === id);
    return employee?.fullName || `ID: ${id}`;
  };

  const getEmployeeRole = (id: number) => {
    const employee = employees.find((e) => e.id === id);
    return employee?.role || "-";
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
  };

  const getRatingBadge = (rating: string | number) => {
    const ratingNum = typeof rating === "string" ? parseFloat(rating) : rating;
    if (ratingNum >= 4.5) {
      return <Badge className="bg-green-500">★ {ratingNum.toFixed(1)}</Badge>;
    } else if (ratingNum >= 3.5) {
      return <Badge className="bg-blue-500">★ {ratingNum.toFixed(1)}</Badge>;
    } else if (ratingNum >= 2.5) {
      return <Badge className="bg-yellow-500">★ {ratingNum.toFixed(1)}</Badge>;
    } else {
      return <Badge className="bg-red-500">★ {ratingNum.toFixed(1)}</Badge>;
    }
  };

  // Calculate overall statistics
  const totalWorkLogs = performanceData.reduce((sum, p) => sum + p.totalWorkLogs, 0);
  const totalWorkHours = performanceData.reduce((sum, p) => sum + p.totalWorkHours, 0);
  const totalCompleted = performanceData.reduce((sum, p) => sum + p.completedTasks, 0);
  const avgRating =
    performanceData.length > 0
      ? (
          performanceData.reduce((sum, p) => sum + parseFloat(p.averageRating || "0"), 0) /
          performanceData.length
        ).toFixed(2)
      : "0.00";

  // Top performers
  const topByHours = [...performanceData].sort((a, b) => b.totalWorkHours - a.totalWorkHours).slice(0, 5);
  const topByRating = [...performanceData]
    .filter((p) => parseFloat(p.averageRating || "0") > 0)
    .sort((a, b) => parseFloat(b.averageRating || "0") - parseFloat(a.averageRating || "0"))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Производительность сотрудников</h1>
        <p className="text-muted-foreground">Метрики и анализ работы сотрудников</p>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего работ</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkLogs}</div>
            <p className="text-xs text-muted-foreground">Выполнено: {totalCompleted}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общее время</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(totalWorkHours)}</div>
            <p className="text-xs text-muted-foreground">Рабочих часов</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средняя оценка</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">★ {avgRating}</div>
            <p className="text-xs text-muted-foreground">Качество работы</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные сотрудники</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.length}</div>
            <p className="text-xs text-muted-foreground">С записями работ</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Топ по времени работы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topByHours.length === 0 ? (
                <p className="text-center text-muted-foreground">Нет данных</p>
              ) : (
                topByHours.map((perf, index) => (
                  <div key={perf.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{getEmployeeName(perf.employeeId)}</p>
                        <p className="text-sm text-muted-foreground">
                          {getEmployeeRole(perf.employeeId)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatHours(perf.totalWorkHours)}</p>
                      <p className="text-xs text-muted-foreground">
                        {perf.completedTasks} работ
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Топ по качеству
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topByRating.length === 0 ? (
                <p className="text-center text-muted-foreground">Нет данных</p>
              ) : (
                topByRating.map((perf, index) => (
                  <div key={perf.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-600 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{getEmployeeName(perf.employeeId)}</p>
                        <p className="text-sm text-muted-foreground">
                          {getEmployeeRole(perf.employeeId)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getRatingBadge(perf.averageRating || "0")}
                      <p className="text-xs text-muted-foreground mt-1">
                        {perf.completedTasks} работ
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Детальная статистика ({performanceData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Сотрудник</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead className="text-right">Работ</TableHead>
                  <TableHead className="text-right">Завершено</TableHead>
                  <TableHead className="text-right">Отменено</TableHead>
                  <TableHead className="text-right">Время</TableHead>
                  <TableHead className="text-right">Оценка</TableHead>
                  <TableHead className="text-right">Автоматы</TableHead>
                  <TableHead className="text-right">Проблемы</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Нет данных о производительности
                    </TableCell>
                  </TableRow>
                ) : (
                  performanceData
                    .sort((a, b) => b.totalWorkHours - a.totalWorkHours)
                    .map((perf) => (
                      <TableRow key={perf.id}>
                        <TableCell className="font-medium">
                          {getEmployeeName(perf.employeeId)}
                        </TableCell>
                        <TableCell>{getEmployeeRole(perf.employeeId)}</TableCell>
                        <TableCell className="text-right">{perf.totalWorkLogs}</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-green-500">{perf.completedTasks}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {perf.cancelledTasks > 0 ? (
                            <Badge variant="secondary">{perf.cancelledTasks}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatHours(perf.totalWorkHours)}
                        </TableCell>
                        <TableCell className="text-right">
                          {parseFloat(perf.averageRating || "0") > 0
                            ? getRatingBadge(perf.averageRating || "0")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-blue-500">
                            {perf.activeMachines} / {perf.totalMachinesAssigned}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {perf.issuesReported > 0 ? (
                            <div className="flex items-center justify-end gap-1">
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                              <span>{perf.issuesReported}</span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
