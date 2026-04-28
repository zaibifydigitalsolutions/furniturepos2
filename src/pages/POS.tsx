import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency, generateInvoiceNumber } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Plus, Minus, Trash2, Printer, Save, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function POS() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | undefined>();
  
  const {
    items,
    discount,
    discountType,
    paymentMethod,
    amountReceived,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setCustomerId,
    setDiscount,
    setDiscountType,
    setPaymentMethod,
    setAmountReceived,
    getSubtotal,
    getTotalDiscount,
    getTotal,
    getChange,
  } = useCartStore();
  
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allProducts = await db.products.where('status').equals('active').toArray();
    const allCategories = await db.categories.where('status').equals('active').toArray();
    const allCustomers = await db.customers.toArray();
    setProducts(allProducts);
    setCategories(allCategories);
    setCustomers(allCustomers);
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === null || product.categoryId === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: any) => {
    if (product.stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }
    addItem({
      productId: product.id!,
      name: product.name,
      price: product.sellPrice,
      quantity: 1,
      discount: 0,
      total: product.sellPrice,
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleCompleteSale = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      const subtotal = getSubtotal();
      const discount = getTotalDiscount();
      const total = getTotal();
      const change = getChange();

      const sale = {
        invoiceNo: generateInvoiceNumber(),
        customerId: selectedCustomer,
        userId: user!.id,
        items,
        subtotal,
        discount,
        total,
        paymentMethod,
        amountReceived: paymentMethod === 'cash' ? amountReceived : total,
        change,
        status: 'completed' as const,
        createdAt: new Date(),
      };

      const saleId = await db.sales.add(sale);
      
      // Add sale items
      for (const item of items) {
        await db.saleItems.add({
          saleId,
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          total: item.total,
        });

        // Update product stock
        await db.products.update(item.productId, {
          stock: (await db.products.get(item.productId))!.stock - item.quantity,
        });
      }

      toast.success('Sale completed successfully!');
      clearCart();
      setSelectedCustomer(undefined);
      setAmountReceived(0);
    } catch (error) {
      toast.error('Failed to complete sale');
      console.error(error);
    }
  };

  const subtotal = getSubtotal();
  const totalDiscount = getTotalDiscount();
  const total = getTotal();
  const change = getChange();

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col">
        {/* Search and Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedCategory || 'all'}
            onChange={(e) => setSelectedCategory(e.target.value === 'all' ? null : Number(e.target.value))}
            className="px-4 py-2 border border-border rounded-lg bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <Card 
              key={product.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleAddToCart(product)}
            >
              <CardContent className="p-4">
                <div className="aspect-square bg-surface-2 rounded-lg mb-3 flex items-center justify-center text-4xl">
                  🪑
                </div>
                <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                <p className="text-xs text-text-secondary">{product.sku}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="font-bold text-accent">{formatCurrency(product.sellPrice)}</span>
                  <span className={`text-xs ${product.stock <= product.minStock ? 'text-danger' : 'text-success'}`}>
                    Stock: {product.stock}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="w-96 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Current Sale</CardTitle>
            <Button variant="ghost" size="sm" onClick={clearCart}>
              Clear
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            {/* Customer Selection */}
            <select
              value={selectedCustomer || ''}
              onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : undefined)}
              className="mb-4 px-3 py-2 border border-border rounded-lg"
            >
              <option value="">Walk-in Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
              ))}
            </select>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {items.map(item => (
                <div key={item.productId} className="p-3 bg-surface-2 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm flex-1">{item.name}</h4>
                    <button onClick={() => removeItem(item.productId)} className="text-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="secondary" className="h-6 w-6" onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}>
                        <Minus size={14} />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button size="icon" variant="secondary" className="h-6 w-6" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                        <Plus size={14} />
                      </Button>
                    </div>
                    <span className="font-bold">{formatCurrency(item.total)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 space-y-2 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span className="text-danger">-{formatCurrency(totalDiscount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span>Total:</span>
                <span className="text-accent">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'secondary'}
                  className="flex-1"
                  onClick={() => setPaymentMethod('cash')}
                >
                  Cash
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'secondary'}
                  className="flex-1"
                  onClick={() => setPaymentMethod('card')}
                >
                  Card
                </Button>
                <Button
                  variant={paymentMethod === 'credit' ? 'default' : 'secondary'}
                  className="flex-1"
                  onClick={() => setPaymentMethod('credit')}
                >
                  Credit
                </Button>
              </div>

              {paymentMethod === 'cash' && (
                <div>
                  <label className="text-sm text-text-secondary">Amount Received</label>
                  <Input
                    type="number"
                    value={amountReceived || ''}
                    onChange={(e) => setAmountReceived(Number(e.target.value))}
                    placeholder="Enter amount"
                  />
                  {change > 0 && (
                    <p className="text-sm text-success mt-1">Change: {formatCurrency(change)}</p>
                  )}
                </div>
              )}

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCompleteSale}
                disabled={items.length === 0}
              >
                Complete Sale
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
