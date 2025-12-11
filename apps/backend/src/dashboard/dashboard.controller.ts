import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // 销售趋势（折线图/趋势图）
  @Get('sales-trend')
  getSalesTrend() {
    return this.dashboardService.getSalesTrend();
  }

  // 按类别销售（柱状图/饼状图）
  @Get('sales-by-category')
  getSalesByCategory() {
    return this.dashboardService.getSalesByCategory();
  }

  // 按区域销售（饼状图）
  @Get('sales-by-region')
  getSalesByRegion() {
    return this.dashboardService.getSalesByRegion();
  }

  // 汇总统计（卡片）
  @Get('summary')
  getSummaryStats() {
    return this.dashboardService.getSummaryStats();
  }

  // 区域-类别矩阵（热力图数据）
  @Get('region-category-matrix')
  getRegionCategoryMatrix() {
    return this.dashboardService.getRegionCategoryMatrix();
  }
}
