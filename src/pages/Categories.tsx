import { useEffect, useState } from 'react';
import { db, type Category } from '../lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Edit, Trash2, X, Save, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    description: '',
    icon: '📦',
    color: '#D4A853',
    status: 'active',
    sortOrder: 1
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const allCategories = await db.categories.toArray();
    setCategories(allCategories);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      icon: '📦',
      color: '#D4A853',
      status: 'active',
      sortOrder: categories.length + 1
    });
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id!);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      status: category.status,
      sortOrder: category.sortOrder
    });
    setShowModal(true);
  };

  const handleView = (category: Category) => {
    setViewingCategory(category);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description) {
      toast.error('Name and description are required');
      return;
    }

    try {
      if (editingId) {
        await db.categories.update(editingId, {
          ...formData,
          updatedAt: new Date()
        });
        toast.success('Category updated successfully!');
      } else {
        await db.categories.add({
          ...formData as Category,
          createdAt: new Date()
        });
        toast.success('Category added successfully!');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({});
      loadCategories();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await db.categories.delete(id);
      toast.success('Category deleted successfully!');
      setDeleteConfirm(null);
      loadCategories();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({});
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold text-primary">Categories</h1>
        <Button className="btn-primary" onClick={handleAdd}>
          <Plus size={16} className="mr-2" />
          Add Category
        </Button>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Category' : 'Add Category'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input 
                  value={formData.name || ''} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter category name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description *</label>
                <Input 
                  value={formData.description || ''} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter description"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Icon (Emoji)</label>
                <Input 
                  value={formData.icon || ''} 
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  placeholder="Enter emoji icon"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <Input 
                  value={formData.color || ''} 
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  placeholder="Enter hex color"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select 
                  className="w-full mt-1 p-2 border rounded-lg bg-white"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="secondary" className="flex-1" onClick={handleCancel}>
                  <X size={16} className="mr-1" /> Cancel
                </Button>
                <Button className="flex-1 btn-primary" onClick={handleSave}>
                  <Save size={16} className="mr-1" /> Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Modal */}
      {viewingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-5xl">{viewingCategory.icon}</span>
                <div>
                  <CardTitle className="text-xl">{viewingCategory.name}</CardTitle>
                  <p className="text-sm text-text-secondary">{viewingCategory.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p><strong>Icon:</strong> {viewingCategory.icon}</p>
                <p><strong>Color:</strong> <span style={{color: viewingCategory.color}}>{viewingCategory.color}</span></p>
                <p><strong>Sort Order:</strong> {viewingCategory.sortOrder}</p>
                <p><strong>Status:</strong> <span className={viewingCategory.status === 'active' ? 'text-success' : 'text-danger'}>{viewingCategory.status}</span></p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setViewingCategory(null)}>
                  <X size={16} className="mr-1" /> Close
                </Button>
                <Button className="flex-1 btn-primary" onClick={() => {
                  setViewingCategory(null);
                  handleEdit(viewingCategory);
                }}>
                  <Edit size={16} className="mr-1" /> Edit
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
              <CardTitle className="text-danger">Delete Category?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                Are you sure you want to delete this category? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={handleCancel}>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map(category => (
          <Card key={category.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{category.icon}</span>
                <div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <p className="text-sm text-text-secondary">{category.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleView(category)}>
                  <Eye size={14} className="mr-1" /> View
                </Button>
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleEdit(category)}>
                  <Edit size={14} className="mr-1" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(category.id!)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
