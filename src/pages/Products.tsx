import React, { useEffect, useState } from 'react';
import { db, type Product } from '../lib/db';
import { formatCurrency, generateSKU } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Edit, Eye, Trash2, X, Save, RotateCcw, Package, Tag, DollarSign, Boxes, Palette, Ruler, Image, Barcode, Truck, Shield, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    sku: '',
    categoryId: 0,
    brand: '',
    description: '',
    material: '',
    color: [],
    dimensions: { length: 0, width: 0, height: 0, weight: 0 },
    costPrice: 0,
    sellPrice: 0,
    discountable: true,
    taxable: true,
    stock: 0,
    minStock: 0,
    maxStock: 0,
    unit: 'pcs',
    images: [],
    barcode: '',
    supplier: '',
    warrantyMonths: 0,
    status: 'active',
    featured: false
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const allCategories = await db.categories.toArray();
    setCategories(allCategories);
  };

  const loadProducts = async () => {
    const allProducts = await db.products.toArray();
    setProducts(allProducts);
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return 'Unknown';
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Unknown';
  };

  const generateAutoSKU = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const newSKU = `FUR-${timestamp}-${random}`;
    setNewProduct({...newProduct, sku: newSKU});
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.sku || !newProduct.categoryId) {
      toast.error('Please fill all required fields (Name, SKU, Category)');
      return;
    }

    if (newProduct.sellPrice! <= 0 || newProduct.costPrice! <= 0) {
      toast.error('Please enter valid prices');
      return;
    }

    try {
      const productToAdd: Product = {
        ...newProduct as Product,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.products.add(productToAdd);
      toast.success('Product added successfully!');
      setShowAddModal(false);
      resetNewProduct();
      loadProducts();
    } catch (error) {
      toast.error('Failed to add product. SKU might already exist.');
    }
  };

  const resetNewProduct = () => {
    setNewProduct({
      name: '',
      sku: '',
      categoryId: 0,
      brand: '',
      description: '',
      material: '',
      color: [],
      dimensions: { length: 0, width: 0, height: 0, weight: 0 },
      costPrice: 0,
      sellPrice: 0,
      discountable: true,
      taxable: true,
      stock: 0,
      minStock: 0,
      maxStock: 0,
      unit: 'pcs',
      images: [],
      barcode: '',
      supplier: '',
      warrantyMonths: 0,
      status: 'active',
      featured: false
    });
  };

  const handleColorToggle = (color: string) => {
    const currentColors = newProduct.color || [];
    const updatedColors = currentColors.includes(color)
      ? currentColors.filter(c => c !== color)
      : [...currentColors, color];
    setNewProduct({...newProduct, color: updatedColors});
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id!);
    setEditForm({
      name: product.name,
      sellPrice: product.sellPrice,
      costPrice: product.costPrice,
      stock: product.stock,
      status: product.status
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
    setDeleteConfirm(null);
  };

  const handleSave = async (id: number) => {
    try {
      await db.products.update(id, {
        ...editForm,
        updatedAt: new Date()
      });
      toast.success('Product updated successfully!');
      setEditingId(null);
      loadProducts();
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await db.products.delete(id);
      toast.success('Product deleted successfully!');
      setDeleteConfirm(null);
      loadProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold text-primary">Products</h1>
        <Button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} className="mr-2" />
          Add Product
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package size={20} /> Add New Product
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Product Name *</label>
                  <Input value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g., Modern Sofa" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">SKU *</label>
                  <div className="flex gap-2">
                    <Input value={newProduct.sku} onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})} placeholder="e.g., FUR-001" className="mt-1 flex-1" />
                    <Button variant="secondary" size="sm" className="mt-1" onClick={generateAutoSKU}><RotateCcw size={14} /></Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category *</label>
                  <select className="w-full mt-1 p-2 border rounded-lg bg-white" value={newProduct.categoryId || ''} onChange={(e) => setNewProduct({...newProduct, categoryId: Number(e.target.value)})}>
                    <option value="">Select Category</option>
                    {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Brand</label>
                  <Input value={newProduct.brand} onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})} placeholder="e.g., IKEA" className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} placeholder="Product description..." className="w-full mt-1 p-2 border rounded-lg bg-white min-h-[80px]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Material</label>
                  <Input value={newProduct.material} onChange={(e) => setNewProduct({...newProduct, material: e.target.value})} placeholder="e.g., Leather, Wood" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Colors</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {['Red','Blue','Green','Black','White','Brown','Gray','Yellow'].map(color => (
                      <button key={color} onClick={() => handleColorToggle(color)} className={`px-3 py-1 rounded-full text-xs border ${(newProduct.color||[]).includes(color)?'bg-accent text-primary border-accent':'bg-white text-text-secondary border-border'}`}>{color}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Cost Price *</label>
                  <Input type="number" value={newProduct.costPrice||''} onChange={(e) => setNewProduct({...newProduct,costPrice:Number(e.target.value)})} placeholder="0.00" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Sell Price *</label>
                  <Input type="number" value={newProduct.sellPrice||''} onChange={(e) => setNewProduct({...newProduct,sellPrice:Number(e.target.value)})} placeholder="0.00" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Unit</label>
                  <select className="w-full mt-1 p-2 border rounded-lg bg-white" value={newProduct.unit} onChange={(e) => setNewProduct({...newProduct,unit:e.target.value})}>
                    <option value="pcs">Pieces</option>
                    <option value="set">Set</option>
                    <option value="pair">Pair</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Stock</label>
                  <Input type="number" value={newProduct.stock||''} onChange={(e) => setNewProduct({...newProduct,stock:Number(e.target.value)})} placeholder="0" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Min Stock</label>
                  <Input type="number" value={newProduct.minStock||''} onChange={(e) => setNewProduct({...newProduct,minStock:Number(e.target.value)})} placeholder="5" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Stock</label>
                  <Input type="number" value={newProduct.maxStock||''} onChange={(e) => setNewProduct({...newProduct,maxStock:Number(e.target.value)})} placeholder="100" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Barcode</label>
                  <Input value={newProduct.barcode||''} onChange={(e) => setNewProduct({...newProduct,barcode:e.target.value})} placeholder="Scan barcode" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Supplier</label>
                  <Input value={newProduct.supplier||''} onChange={(e) => setNewProduct({...newProduct,supplier:e.target.value})} placeholder="Supplier name" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Warranty (months)</label>
                  <Input type="number" value={newProduct.warrantyMonths||''} onChange={(e) => setNewProduct({...newProduct,warrantyMonths:Number(e.target.value)})} placeholder="12" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select className="w-full mt-1 p-2 border rounded-lg bg-white" value={newProduct.status} onChange={(e) => setNewProduct({...newProduct,status:e.target.value as 'active'|'inactive'|'discontinued'})}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={newProduct.discountable} onChange={(e) => setNewProduct({...newProduct,discountable:e.target.checked})} className="rounded" />
                  <span className="text-sm">Discountable</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={newProduct.taxable} onChange={(e) => setNewProduct({...newProduct,taxable:e.target.checked})} className="rounded" />
                  <span className="text-sm">Taxable</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={newProduct.featured} onChange={(e) => setNewProduct({...newProduct,featured:e.target.checked})} className="rounded" />
                  <span className="text-sm">Featured</span>
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => {setShowAddModal(false);resetNewProduct();}}><X size={16} className="mr-1" /> Cancel</Button>
                <Button className="flex-1 btn-primary" onClick={handleAddProduct}><Save size={16} className="mr-1" /> Save Product</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold">{viewingProduct.name}</h2>
                <Button variant="ghost" size="sm" onClick={() => setViewingProduct(null)}>
                  <X size={18} />
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>SKU:</strong> {viewingProduct.sku}</p>
                <p><strong>Category:</strong> {getCategoryName(viewingProduct.categoryId)}</p>
                <p><strong>Brand:</strong> {viewingProduct.brand}</p>
                <p><strong>Material:</strong> {viewingProduct.material}</p>
                <p><strong>Description:</strong> {viewingProduct.description}</p>
                <p><strong>Cost Price:</strong> {formatCurrency(viewingProduct.costPrice)}</p>
                <p><strong>Sell Price:</strong> {formatCurrency(viewingProduct.sellPrice)}</p>
                <p><strong>Stock:</strong> {viewingProduct.stock} {viewingProduct.unit}</p>
                <p><strong>Status:</strong> <span className={viewingProduct.status === 'active' ? 'text-success' : 'text-danger'}>{viewingProduct.status}</span></p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => {
                  setViewingProduct(null);
                  handleEdit(viewingProduct);
                }}>
                  <Edit size={14} className="mr-1" /> Edit
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setViewingProduct(null)}>
                  <X size={14} className="mr-1" /> Close
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
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-danger">Delete Product?</h2>
              <p className="text-sm text-text-secondary">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={handleCancel}>
                  <X size={14} className="mr-1" /> Cancel
                </Button>
                <Button className="flex-1 btn-danger" onClick={() => handleDelete(deleteConfirm)}>
                  <Trash2 size={14} className="mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <Card key={product.id} className={editingId === product.id ? 'ring-2 ring-accent' : ''}>
            <CardContent className="p-4">
              <div className="aspect-square bg-surface-2 rounded-lg mb-3 flex items-center justify-center text-4xl">
                🪑
              </div>
              
              {editingId === product.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-text-secondary">Name</label>
                    <Input 
                      value={editForm.name || ''} 
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary">Sell Price</label>
                    <Input 
                      type="number"
                      value={editForm.sellPrice || ''} 
                      onChange={(e) => setEditForm({...editForm, sellPrice: Number(e.target.value)})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary">Cost Price</label>
                    <Input 
                      type="number"
                      value={editForm.costPrice || ''} 
                      onChange={(e) => setEditForm({...editForm, costPrice: Number(e.target.value)})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary">Stock</label>
                    <Input 
                      type="number"
                      value={editForm.stock || ''} 
                      onChange={(e) => setEditForm({...editForm, stock: Number(e.target.value)})}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1 btn-primary" onClick={() => handleSave(product.id!)}>
                      <Save size={14} className="mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="secondary" className="flex-1" onClick={handleCancel}>
                      <RotateCcw size={14} className="mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="font-medium line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-text-secondary">{getCategoryName(product.categoryId)} • {product.sku}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Price:</span>
                      <span className="font-bold">{formatCurrency(product.sellPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cost:</span>
                      <span className="text-text-secondary">{formatCurrency(product.costPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Stock:</span>
                      <span className={product.stock <= product.minStock ? 'text-danger font-bold' : 'text-success'}>
                        {product.stock} {product.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleEdit(product)}>
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => setViewingProduct(product)}>
                      <Eye size={14} className="mr-1" />
                      View
                    </Button>
                    <Button variant="secondary" size="sm" className="px-2" onClick={() => setDeleteConfirm(product.id!)}>
                      <Trash2 size={14} className="text-danger" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
