import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { formatCurrency } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ShoppingCart, Package, DollarSign, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    todaySales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStock: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sales = await db.sales
      .where('createdAt')
      .above(today)
      .toArray();
    
    const todaySales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalRevenue = (await db.sales.toArray()).reduce((sum, sale) => sum + sale.total, 0);
    const totalProducts = await db.products.count();
    const lowStock = await db.products.where('stock').below(10).count();

    setStats({
      todaySales,
      totalRevenue,
      totalProducts,
      lowStock,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-primary">Dashboard</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              Today's Sales
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(stats.todaySales)}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              +12% vs yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.totalProducts}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Items in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              Low Stock
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.lowStock}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Items need restock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <a href="/pos" className="btn-primary inline-block">New Sale</a>
            <a href="/products" className="btn-secondary inline-block">Add Product</a>
            <a href="/inventory" className="btn-secondary inline-block">Add Stock</a>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary">No recent sales yet. Start making sales to see activity here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
