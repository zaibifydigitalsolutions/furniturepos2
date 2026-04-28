import { useState } from 'react';
import { db } from '../lib/db';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { BarChart3, TrendingUp, Users, DollarSign, Package, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const generateReport = async (type: string) => {
    setActiveReport(type);
    try {
      let data;
      switch (type) {
        case 'sales':
          const sales = await db.sales.toArray();
          data = {
            totalSales: sales.length,
            totalRevenue: sales.reduce((sum, s) => sum + s.total, 0),
            averageSale: sales.length ? sales.reduce((sum, s) => sum + s.total, 0) / sales.length : 0,
            salesByPayment: sales.reduce((acc, s) => {
              acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + 1;
              return acc;
            }, {} as any)
          };
          break;
        case 'products':
          const products = await db.products.toArray();
          const saleItems = await db.saleItems.toArray();
          const productSales = saleItems.reduce((acc, item) => {
            acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
            return acc;
          }, {} as any);
          data = {
            totalProducts: products.length,
            totalStock: products.reduce((sum, p) => sum + p.stock, 0),
            stockValue: products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0),
            topSelling: products.map(p => ({
              name: p.name,
              sold: productSales[p.id!] || 0
            })).sort((a, b) => b.sold - a.sold).slice(0, 10)
          };
          break;
        case 'staff':
          const allSales = await db.sales.toArray();
          const users = await db.users.toArray();
          data = {
            totalStaff: users.length,
            staffSales: users.map(u => ({
              name: u.name,
              sales: allSales.filter(s => s.userId === u.id).length,
              revenue: allSales.filter(s => s.userId === u.id).reduce((sum, s) => sum + s.total, 0)
            }))
          };
          break;
        case 'financial':
          const allSalesData = await db.sales.toArray();
          const expenses = await db.expenses.toArray();
          data = {
            totalRevenue: allSalesData.reduce((sum, s) => sum + s.total, 0),
            totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
            profit: allSalesData.reduce((sum, s) => sum + s.total, 0) - expenses.reduce((sum, e) => sum + e.amount, 0),
            expenseCount: expenses.length
          };
          break;
        case 'inventory':
          const inventoryProducts = await db.products.toArray();
          data = {
            totalItems: inventoryProducts.length,
            totalStock: inventoryProducts.reduce((sum, p) => sum + p.stock, 0),
            totalValue: inventoryProducts.reduce((sum, p) => sum + (p.stock * p.costPrice), 0),
            lowStock: inventoryProducts.filter(p => p.stock <= p.minStock),
            outOfStock: inventoryProducts.filter(p => p.stock === 0)
          };
          break;
        case 'customers':
          const customers = await db.customers.toArray();
          const customerSales = await db.sales.toArray();
          data = {
            totalCustomers: customers.length,
            totalSpent: customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
            topCustomers: customers.map(c => ({
              name: c.name,
              spent: c.totalSpent || 0,
              visits: c.visits || 0
            })).sort((a, b) => b.spent - a.spent).slice(0, 10)
          };
          break;
      }
      setReportData(data);
      toast.success('Report generated successfully!');
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  const exportReport = () => {
    if (!reportData) return;
    const csv = JSON.stringify(reportData, null, 2);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport}-report.csv`;
    a.click();
    toast.success('Report exported!');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-primary">Reports</h1>
      
      {!activeReport ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => generateReport('sales')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={20} className="text-accent" /> Sales Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">View sales performance over time</p>
              <Button className="w-full btn-primary">Generate Report</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => generateReport('products')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package size={20} className="text-accent" /> Product Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">Top selling and low performing products</p>
              <Button className="w-full btn-primary">Generate Report</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => generateReport('staff')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} className="text-accent" /> Staff Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">Staff sales and performance metrics</p>
              <Button className="w-full btn-primary">Generate Report</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => generateReport('financial')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign size={20} className="text-accent" /> Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">Revenue, expenses, and profit analysis</p>
              <Button className="w-full btn-primary">Generate Report</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => generateReport('inventory')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package size={20} className="text-accent" /> Inventory Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">Stock levels and valuation</p>
              <Button className="w-full btn-primary">Generate Report</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => generateReport('customers')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} className="text-accent" /> Customer Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary mb-4">Customer spending and behavior</p>
              <Button className="w-full btn-primary">Generate Report</Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="capitalize">{activeReport} Report</CardTitle>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { setActiveReport(null); setReportData(null); }}>
                  <X size={16} className="mr-1" /> Close
                </Button>
                <Button onClick={exportReport}>
                  <Download size={16} className="mr-1" /> Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeReport === 'sales' && reportData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-surface-2 p-4 rounded-lg">
                    <p className="text-text-secondary text-sm">Total Sales</p>
                    <p className="text-2xl font-bold">{reportData.totalSales}</p>
                  </div>
                  <div className="bg-surface-2 p-4 rounded-lg">
                    <p className="text-text-secondary text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.totalRevenue)}</p>
                  </div>
                  <div className="bg-surface-2 p-4 rounded-lg">
                    <p className="text-text-secondary text-sm">Average Sale</p>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.averageSale)}</p>
                  </div>
                  <div className="bg-surface-2 p-4 rounded-lg">
                    <p className="text-text-secondary text-sm">Payment Methods</p>
                    <div className="text-sm mt-1">
                      {Object.entries(reportData.salesByPayment).map(([method, count]: [string, any]) => (
                        <p key={method} className="capitalize">{method}: {count}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeReport === 'products' && reportData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-surface-2 p-4 rounded-lg">
                      <p className="text-text-secondary text-sm">Total Products</p>
                      <p className="text-2xl font-bold">{reportData.totalProducts}</p>
                    </div>
                    <div className="bg-surface-2 p-4 rounded-lg">
                      <p className="text-text-secondary text-sm">Total Stock</p>
                      <p className="text-2xl font-bold">{reportData.totalStock}</p>
                    </div>
                    <div className="bg-surface-2 p-4 rounded-lg">
                      <p className="text-text-secondary text-sm">Stock Value</p>
                      <p className="text-2xl font-bold">{formatCurrency(reportData.stockValue)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Top Selling Products</p>
                    <div className="space-y-2">
                      {reportData.topSelling.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between p-2 bg-surface-2 rounded">
                          <span>{item.name}</span>
                          <span className="font-bold">{item.sold} sold</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeReport === 'staff' && reportData && (
                <div className="space-y-4">
                  <div className="bg-surface-2 p-4 rounded-lg">
                    <p className="text-text-secondary text-sm">Total Staff</p>
                    <p className="text-2xl font-bold">{reportData.totalStaff}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Staff Performance</p>
                    <div className="space-y-2">
                      {reportData.staffSales.map((staff: any, idx: number) => (
                        <div key={idx} className="flex justify-between p-3 bg-surface-2 rounded">
                          <div>
                            <p className="font-medium">{staff.name}</p>
                            <p className="text-sm text-text-secondary">{staff.sales} sales</p>
                          </div>
                          <p className="font-bold">{formatCurrency(staff.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeReport === 'financial' && reportData && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-success/10 p-4 rounded-lg">
                    <p className="text-text-secondary text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(reportData.totalRevenue)}</p>
                  </div>
                  <div className="bg-danger/10 p-4 rounded-lg">
                    <p className="text-text-secondary text-sm">Total Expenses</p>
                    <p className="text-2xl font-bold text-danger">{formatCurrency(reportData.totalExpenses)}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${reportData.profit >= 0 ? 'bg-success/10' : 'bg-danger/10'}`}>
                    <p className="text-text-secondary text-sm">Profit</p>
                    <p className={`text-2xl font-bold ${reportData.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(reportData.profit)}
                    </p>
                  </div>
                </div>
              )}

              {activeReport === 'inventory' && reportData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-surface-2 p-4 rounded-lg">
                      <p className="text-text-secondary text-sm">Total Items</p>
                      <p className="text-2xl font-bold">{reportData.totalItems}</p>
                    </div>
                    <div className="bg-surface-2 p-4 rounded-lg">
                      <p className="text-text-secondary text-sm">Total Stock</p>
                      <p className="text-2xl font-bold">{reportData.totalStock}</p>
                    </div>
                    <div className="bg-surface-2 p-4 rounded-lg">
                      <p className="text-text-secondary text-sm">Stock Value</p>
                      <p className="text-2xl font-bold">{formatCurrency(reportData.totalValue)}</p>
                    </div>
                    <div className="bg-warning/10 p-4 rounded-lg">
                      <p className="text-text-secondary text-sm">Low Stock</p>
                      <p className="text-2xl font-bold text-warning">{reportData.lowStock.length}</p>
                    </div>
                  </div>
                  {reportData.outOfStock.length > 0 && (
                    <div className="bg-danger/10 p-4 rounded-lg">
                      <p className="text-danger font-bold">{reportData.outOfStock.length} items out of stock</p>
                    </div>
                  )}
                </div>
              )}

              {activeReport === 'customers' && reportData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-2 p-4 rounded-lg">
                      <p className="text-text-secondary text-sm">Total Customers</p>
                      <p className="text-2xl font-bold">{reportData.totalCustomers}</p>
                    </div>
                    <div className="bg-surface-2 p-4 rounded-lg">
                      <p className="text-text-secondary text-sm">Total Spent</p>
                      <p className="text-2xl font-bold">{formatCurrency(reportData.totalSpent)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Top Customers</p>
                    <div className="space-y-2">
                      {reportData.topCustomers.map((customer: any, idx: number) => (
                        <div key={idx} className="flex justify-between p-3 bg-surface-2 rounded">
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-text-secondary">{customer.visits} visits</p>
                          </div>
                          <p className="font-bold">{formatCurrency(customer.spent)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
