import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useSalesTrendQuery,
  useSalesByCategoryQuery,
  useSalesByRegionQuery,
  useSummaryStatsQuery,
} from '@/hooks/api/useDashboard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// 配色方案
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// 格式化金额
function formatCurrency(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  return value.toLocaleString('zh-CN');
}

export default function BIDashboardPage() {
  const { data: summaryData, isLoading: summaryLoading } = useSummaryStatsQuery();
  const { data: trendData, isLoading: trendLoading } = useSalesTrendQuery();
  const { data: categoryData, isLoading: categoryLoading } = useSalesByCategoryQuery();
  const { data: regionData, isLoading: regionLoading } = useSalesByRegionQuery();

  const isLoading = summaryLoading || trendLoading || categoryLoading || regionLoading;

  // 转换区域数据为饼图兼容格式
  const pieRegionData = regionData?.map((item) => ({
    name: item.region,
    value: item.amount,
  }));

  return (
    <PageContainer title="BI 图表看板" description="销售数据可视化示例">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="总销售额"
              value={`¥${formatCurrency(summaryData?.totalAmount ?? 0)}`}
              description="累计销售金额"
            />
            <StatCard
              title="总销量"
              value={formatCurrency(summaryData?.totalQuantity ?? 0)}
              description="累计销售数量"
            />
            <StatCard
              title="产品类别"
              value={`${summaryData?.categoryCount ?? 0} 个`}
              description="产品分类数量"
            />
            <StatCard
              title="销售区域"
              value={`${summaryData?.regionCount ?? 0} 个`}
              description="覆盖区域数量"
            />
          </div>

          {/* 图表区域 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 销售趋势折线图 */}
            <Card>
              <CardHeader>
                <CardTitle>销售趋势</CardTitle>
                <CardDescription>最近 12 个月销售金额走势</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.slice(5)}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`¥${formatCurrency(value)}`, '销售额']}
                      labelFormatter={(label) => `${label} 月`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      name="销售额"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 数量趋势面积图 */}
            <Card>
              <CardHeader>
                <CardTitle>销量趋势</CardTitle>
                <CardDescription>最近 12 个月销售数量走势</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), '销量']}
                      labelFormatter={(label) => `${label} 月`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="quantity"
                      name="销量"
                      stroke="#10b981"
                      fill="#10b98133"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 类别销售柱状图 */}
            <Card>
              <CardHeader>
                <CardTitle>类别销售额</CardTitle>
                <CardDescription>各产品类别销售金额对比</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`}
                    />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} width={60} />
                    <Tooltip
                      formatter={(value: number) => [`¥${formatCurrency(value)}`, '销售额']}
                    />
                    <Bar dataKey="amount" name="销售额" radius={[0, 4, 4, 0]}>
                      {categoryData?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 区域销售饼图 */}
            <Card>
              <CardHeader>
                <CardTitle>区域销售占比</CardTitle>
                <CardDescription>各区域销售金额分布</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieRegionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieRegionData?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`¥${formatCurrency(value)}`, '销售额']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

// 统计卡片组件
function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
