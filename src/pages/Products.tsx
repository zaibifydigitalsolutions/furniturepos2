import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { formatCurrency } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Edit, Eye, Trash2, X, Save, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id?: number;
  name: string;
  sku: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  status: string;
  categoryId: number;
  brand: string;
  description: string;
  material: string;
  unit: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

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

  const getCategoryName = (categoryId: number) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Unknown';
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
        <Button className="btn-primary">
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
