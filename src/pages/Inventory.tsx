import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { formatCurrency } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Minus, Package, AlertTriangle, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id?: number;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  maxStock: number;
  costPrice: number;
  sellPrice: number;
  categoryId: number;
  unit: string;
}

interface InventoryItem {
  id?: number;
  productId: number;
  productName: string;
  sku: string;
  type: 'stock_in' | 'stock_out' | 'damage' | 'adjustment';
  quantity: number;
  reason: string;
  date: Date;
  userId: number;
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [transactionType, setTransactionType] = useState<'stock_in' | 'stock_out'>('stock_in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allProducts = await db.products.toArray();
    const allInventory = await db.inventory.toArray();
    setProducts(allProducts);
    setInventory(allInventory);
    setTransactions(allInventory.slice().reverse());
  };

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
  const lowStockItems = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
  const outOfStockItems = products.filter(p => p.stock === 0).length;

  const handleStockTransaction = async () => {
    if (!selectedProduct || !quantity || !reason) {
      toast.error('Please fill all fields');
      return;
    }

    const qty = parseInt(quantity);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    let newStock = selectedProduct.stock;
    if (transactionType === 'stock_in') {
      newStock += qty;
    } else {
      newStock = Math.max(0, newStock - qty);
    }

    try {
      // Update product stock
      await db.products.update(selectedProduct.id!, { stock: newStock });
      
      // Add inventory transaction
      await db.inventory.add({
        productId: selectedProduct.id!,
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        type: transactionType,
        quantity: qty,
        reason: reason,
        date: new Date(),
        userId: currentUser.id || 1,
        notes: `${transactionType === 'stock_in' ? 'Added' : 'Removed'} ${qty} ${selectedProduct.unit}`
      });

      toast.success(`Stock ${transactionType === 'stock_in' ? 'added' : 'removed'} successfully!`);
      setShowModal(false);
      setSelectedProduct(null);
      setQuantity('');
      setReason('');
      loadData();
    } catch (error) {
      toast.error('Transaction failed');
    }
  };

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold text-primary">Inventory Management</h1>
        <Button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} className="mr-2" />
          Stock Adjustment
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-secondary flex items-center gap-2">
              <Package size={16} /> Total Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock.toLocaleString()} pcs</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-secondary">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-secondary flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning" /> Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockItems} Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-secondary flex items-center gap-2">
              <X size={16} className="text-danger" /> Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{outOfStockItems} Items</div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="text-warning flex items-center gap-2">
              <AlertTriangle size={18} /> Low Stock Alert ({lowStockProducts.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-text-secondary">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-danger font-bold">{product.stock}</p>
                    <p className="text-xs text-text-secondary">min: {product.minStock}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Stock Adjustment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Product</label>
                <select 
                  className="w-full mt-1 p-2 border rounded-lg"
                  onChange={(e) => {
                    const product = products.find(p => p.id === parseInt(e.target.value));
                    setSelectedProduct(product || null);
                  }}
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  type="button"
                  variant={transactionType === 'stock_in' ? 'default' : 'secondary'}
                  className={`flex-1 ${transactionType === 'stock_in' ? 'btn-primary' : ''}`}
                  onClick={() => setTransactionType('stock_in')}
                >
                  <Plus size={16} className="mr-1" /> Stock In
                </Button>
                <Button 
                  type="button"
                  variant={transactionType === 'stock_out' ? 'default' : 'secondary'}
                  className={`flex-1 ${transactionType === 'stock_out' ? 'btn-primary' : ''}`}
                  onClick={() => setTransactionType('stock_out')}
                >
                  <Minus size={16} className="mr-1" /> Stock Out
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Reason</label>
                <Input 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1"
                  placeholder="e.g., New shipment received"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 btn-primary" onClick={handleStockTransaction}>
                  <CheckCircle size={16} className="mr-1" /> Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-text-secondary text-center py-8">No inventory transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-sm font-medium text-text-secondary">Date</th>
                    <th className="text-left py-2 text-sm font-medium text-text-secondary">Product</th>
                    <th className="text-left py-2 text-sm font-medium text-text-secondary">Type</th>
                    <th className="text-right py-2 text-sm font-medium text-text-secondary">Quantity</th>
                    <th className="text-left py-2 text-sm font-medium text-text-secondary">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 20).map((t, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-2 text-sm">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="py-2 text-sm font-medium">{t.productName}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          t.type === 'stock_in' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                        }`}>
                          {t.type === 'stock_in' ? 'Stock In' : 'Stock Out'}
                        </span>
                      </td>
                      <td className="py-2 text-right text-sm font-bold">{t.quantity}</td>
                      <td className="py-2 text-sm text-text-secondary">{t.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
