import { useEffect, useState } from 'react';
import { db, type Sale } from '../lib/db';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Printer, Eye, X, User, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customerNames, setCustomerNames] = useState<Map<number, string>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allSales = await db.sales.reverse().toArray();
    setSales(allSales);

    const allCustomers = await db.customers.toArray();
    const nameMap = new Map<number, string>();
    allCustomers.forEach(c => {
      if (c.id) nameMap.set(c.id, c.name);
    });
    setCustomerNames(nameMap);
  };

  const getCustomerName = (customerId?: number) => {
    if (!customerId) return 'Walk-in Customer';
    return customerNames.get(customerId) || 'Unknown';
  };

  const filteredSales = sales.filter(sale =>
    sale.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getCustomerName(sale.customerId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    try {
      await db.sales.delete(id);
      toast.success('Sale deleted successfully!');
      setDeleteConfirm(null);
      loadData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handlePrint = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const customerName = getCustomerName(sale.customerId);
    const itemsHtml = sale.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.total)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${sale.invoiceNo}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .info { margin-bottom: 20px; }
          .info p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .totals { margin-top: 20px; }
          .totals p { margin: 5px 0; display: flex; justify-content: space-between; }
          .totals .total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FurniCraft Furniture</h1>
          <p>Receipt</p>
        </div>
        <div class="info">
          <p><strong>Invoice:</strong> ${sale.invoiceNo}</p>
          <p><strong>Date:</strong> ${sale.createdAt ? formatDateTime(sale.createdAt) : 'N/A'}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Payment:</strong> ${sale.paymentMethod.toUpperCase()}</p>
        </div>
        <table>
          <thead>
            <tr style="border-bottom: 2px solid #333;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
              <th style="padding: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="totals">
          <p><span>Subtotal:</span> <span>${formatCurrency(sale.subtotal)}</span></p>
          <p><span>Discount:</span> <span>-${formatCurrency(sale.discount)}</span></p>
          <p class="total"><span>Total:</span> <span>${formatCurrency(sale.total)}</span></p>
          ${sale.amountReceived ? `<p><span>Amount Received:</span> <span>${formatCurrency(sale.amountReceived)}</span></p>` : ''}
          ${sale.change ? `<p><span>Change:</span> <span>${formatCurrency(sale.change)}</span></p>` : ''}
        </div>
        <div class="footer">
          <p>Thank you for shopping with us!</p>
          <p>Visit us at www.furnicraft.com</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    toast.success('Receipt printed successfully!');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-primary">Sales History</h1>

      <div className="flex gap-4">
        <Input
          placeholder="Search by invoice or customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* View Sale Modal */}
      {viewingSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Sale: {viewingSale.invoiceNo}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setViewingSale(null)}>
                  <X size={18} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <User size={16} />
                <span className="font-medium">{getCustomerName(viewingSale.customerId)}</span>
              </div>
              <p className="text-sm text-text-secondary">{formatDateTime(viewingSale.createdAt)}</p>
              
              <div className="border-t border-border pt-3">
                <p className="font-medium text-sm mb-2">Items ({viewingSale.items.length})</p>
                {viewingSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1 border-b border-border/50">
                    <span>{item.name} x {item.quantity}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(viewingSale.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>{formatCurrency(viewingSale.discount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(viewingSale.total)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setViewingSale(null)}>
                  <X size={16} className="mr-1" /> Close
                </Button>
                <Button className="flex-1 btn-primary" onClick={() => handlePrint(viewingSale)}>
                  <Printer size={16} className="mr-1" /> Print
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-danger">Delete Sale?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                Are you sure you want to delete this sale? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirm(null)}>
                  <X size={16} className="mr-1" /> Cancel
                </Button>
                <Button className="flex-1 bg-danger hover:bg-danger/90" onClick={() => handleDelete(deleteConfirm)}>
                  <Trash2 size={16} className="mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2">
                <tr>
                  <th className="text-left p-4 text-sm">Invoice</th>
                  <th className="text-left p-4 text-sm">Date</th>
                  <th className="text-left p-4 text-sm">Customer</th>
                  <th className="text-left p-4 text-sm">Items</th>
                  <th className="text-right p-4 text-sm">Total</th>
                  <th className="text-left p-4 text-sm">Payment</th>
                  <th className="text-left p-4 text-sm">Status</th>
                  <th className="text-left p-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="border-t border-border hover:bg-surface-2/50">
                    <td className="p-4 font-medium text-sm">{sale.invoiceNo}</td>
                    <td className="p-4 text-sm">{formatDateTime(sale.createdAt)}</td>
                    <td className="p-4 text-sm">{getCustomerName(sale.customerId)}</td>
                    <td className="p-4 text-sm">{sale.items.length}</td>
                    <td className="p-4 font-bold text-sm text-right">{formatCurrency(sale.total)}</td>
                    <td className="p-4 text-sm capitalize">{sale.paymentMethod}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        sale.status === 'completed' ? 'bg-success/10 text-success' :
                        sale.status === 'cancelled' ? 'bg-danger/10 text-danger' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setViewingSale(sale)}>
                          <Eye size={14} className="mr-1" /> View
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(sale.id!)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredSales.length === 0 && (
            <div className="p-8 text-center text-text-secondary">
              No sales found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
