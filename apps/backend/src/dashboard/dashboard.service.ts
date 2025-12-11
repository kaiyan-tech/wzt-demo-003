import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // 获取销售趋势数据（按月汇总）
  async getSalesTrend() {
    const data = await this.prisma.salesData.groupBy({
      by: ['date'],
      _sum: {
        amount: true,
        quantity: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // 按月聚合
    const monthlyData = new Map<string, { amount: number; quantity: number }>();

    for (const item of data) {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { amount: 0, quantity: 0 });
      }

      const current = monthlyData.get(monthKey)!;
      current.amount += item._sum.amount ?? 0;
      current.quantity += item._sum.quantity ?? 0;
    }

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      amount: Math.round(data.amount * 100) / 100,
      quantity: data.quantity,
    }));
  }

  // 获取按类别销售数据
  async getSalesByCategory() {
    const data = await this.prisma.salesData.groupBy({
      by: ['category'],
      _sum: {
        amount: true,
        quantity: true,
      },
    });

    return data.map((item) => ({
      category: item.category,
      amount: Math.round((item._sum.amount ?? 0) * 100) / 100,
      quantity: item._sum.quantity ?? 0,
    }));
  }

  // 获取按区域销售数据
  async getSalesByRegion() {
    const data = await this.prisma.salesData.groupBy({
      by: ['region'],
      _sum: {
        amount: true,
        quantity: true,
      },
    });

    return data.map((item) => ({
      region: item.region,
      amount: Math.round((item._sum.amount ?? 0) * 100) / 100,
      quantity: item._sum.quantity ?? 0,
    }));
  }

  // 获取汇总统计
  async getSummaryStats() {
    const [totalSales, categoryCount, regionCount, recordCount] = await Promise.all([
      this.prisma.salesData.aggregate({
        _sum: { amount: true, quantity: true },
      }),
      this.prisma.salesData.groupBy({ by: ['category'] }).then((r) => r.length),
      this.prisma.salesData.groupBy({ by: ['region'] }).then((r) => r.length),
      this.prisma.salesData.count(),
    ]);

    return {
      totalAmount: Math.round((totalSales._sum.amount ?? 0) * 100) / 100,
      totalQuantity: totalSales._sum.quantity ?? 0,
      categoryCount,
      regionCount,
      recordCount,
    };
  }

  // 获取区域-类别热力图数据
  async getRegionCategoryMatrix() {
    const data = await this.prisma.salesData.groupBy({
      by: ['region', 'category'],
      _sum: {
        amount: true,
      },
    });

    return data.map((item) => ({
      region: item.region,
      category: item.category,
      amount: Math.round((item._sum.amount ?? 0) * 100) / 100,
    }));
  }
}
