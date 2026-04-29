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
      const invoiceNo = generateInvoiceNumber();

      const sale = {
        invoiceNo,
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

      // Get customer details
      const customer = customers.find(c => c.id === selectedCustomer);
      
      // Print receipt
      printReceipt({
        invoiceNo,
        items,
        subtotal,
        discount,
        total,
        paymentMethod,
        amountReceived: paymentMethod === 'cash' ? amountReceived : total,
        change,
        customer,
        createdAt: new Date(),
      });

      toast.success('Sale completed successfully!');
      clearCart();
      setSelectedCustomer(undefined);
      setAmountReceived(0);
    } catch (error) {
      toast.error('Failed to complete sale');
      console.error(error);
    }
  };

  const printReceipt = (saleData: any) => {
    const customer = saleData.customer;
    const customerName = customer ? customer.name : 'Walk-in Customer';
    const customerAddress = customer ? (customer.address || 'N/A') : 'N/A';
    const customerPhone = customer ? (customer.phone || 'N/A') : 'N/A';
    
    const itemsHtml = saleData.items.map((item: any) => `
      <tr>
        <td style="text-align:left;padding:4px 0;">${item.name}</td>
        <td style="text-align:center;padding:4px 0;">${item.quantity}</td>
        <td style="text-align:right;padding:4px 0;">${formatCurrency(item.price)}</td>
        <td style="text-align:right;padding:4px 0;">${formatCurrency(item.total)}</td>
      </tr>
    `).join('');

    const receiptHtml = `
      <html>
      <head>
        <style>
          @media print {
            body { margin: 0; padding: 10px; font-family: Arial, sans-serif; font-size: 12px; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .shop-name { font-size: 16px; font-weight: bold; }
            .shop-address { font-size: 11px; color: #555; }
            .info-row { display: flex; justify-content: space-between; margin: 4px 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">Abduallah Furniture House</div>
          <div class="shop-address">Your Store Address Here</div>
          <div class="shop-address">Tel: +92-XXX-XXXXXXX</div>
        </div>
        
        <div class="info-row"><strong>Invoice:</strong> ${saleData.invoiceNo}</div>
        <div class="info-row"><strong>Date:</strong> ${new Date(saleData.createdAt).toLocaleString()}</div>
        <div class="info-row"><strong>Customer:</strong> ${customerName}</div>
        <div class="info-row"><strong>Address:</strong> ${customerAddress}</div>
        <div class="info-row"><strong>Phone:</strong> ${customerPhone}</div>
        <hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">
        
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left;">Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">
        
        <div class="info-row"><strong>Subtotal:</strong> ${formatCurrency(saleData.subtotal)}</div>
        <div class="info-row"><strong>Discount:</strong> -${formatCurrency(saleData.discount)}</div>
        <div class="info-row" style="font-size: 14px; font-weight: bold;"><strong>Total:</strong> ${formatCurrency(saleData.total)}</div>
        <div class="info-row"><strong>Payment:</strong> ${saleData.paymentMethod.toUpperCase()}</div>
        ${saleData.paymentMethod === 'cash' ? `
        <div class="info-row"><strong>Received:</strong> ${formatCurrency(saleData.amountReceived)}</div>
        <div class="info-row"><strong>Change:</strong> ${formatCurrency(saleData.change)}</div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">
        <div style="text-align: center; font-size: 11px; margin-top: 10px;">
          <p>Thank you for shopping with us!</p>
          <p>Abduallah Furniture House</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
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
