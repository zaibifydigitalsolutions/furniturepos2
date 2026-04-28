import { useEffect, useState } from 'react';
import { db, type Expense } from '../lib/db';
import { formatCurrency, formatDate } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, DollarSign, X, Save, Eye, Edit, Trash2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Expense>>({
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const allExpenses = await db.expenses.reverse().toArray();
    setExpenses(allExpenses);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      category: '',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id!);
    setFormData({
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      date: expense.date instanceof Date ? expense.date.toISOString().split('T')[0] : expense.date
    });
    setShowModal(true);
  };

  const handleView = (expense: Expense) => {
    setViewingExpense(expense);
  };

  const handleSave = async () => {
    if (!formData.category || !formData.amount || !formData.description) {
      toast.error('All fields are required');
      return;
    }

    try {
      if (editingId) {
        await db.expenses.update(editingId, {
          ...formData,
          date: new Date(formData.date!)
        });
        toast.success('Expense updated successfully!');
      } else {
        await db.expenses.add({
          ...formData as Expense,
          date: new Date(formData.date!),
          userId: 1
        });
        toast.success('Expense added successfully!');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({});
      loadExpenses();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await db.expenses.delete(id);
      toast.success('Expense deleted successfully!');
      setDeleteConfirm(null);
      loadExpenses();
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

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate.getMonth() === thisMonth && expDate.getFullYear() === thisYear;
  }).reduce((sum, exp) => sum + exp.amount, 0);

  const categories = [...new Set(expenses.map(e => e.category))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold text-primary">Expenses</h1>
        <Button className="btn-primary" onClick={handleAdd}>
          <Plus size={16} className="mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-sm text-text-secondary">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-sm text-text-secondary">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyExpenses)}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-sm text-text-secondary">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Expense' : 'Add Expense'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category *</label>
                <select 
                  className="w-full mt-1 p-2 border rounded-lg bg-white"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">Select category</option>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Amount *</label>
                <Input 
                  type="number"
                  value={formData.amount || ''} 
                  onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                  placeholder="Enter amount"
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
                <label className="text-sm font-medium">Date *</label>
                <Input 
                  type="date"
                  value={formData.date || ''} 
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="mt-1"
                />
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
      {viewingExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Expense Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setViewingExpense(null)}>
                  <X size={18} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center">
                  <DollarSign size={24} className="text-danger" />
                </div>
                <div>
                  <p className="font-bold text-2xl text-danger">{formatCurrency(viewingExpense.amount)}</p>
                  <p className="text-text-secondary">{viewingExpense.category}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Description:</strong> {viewingExpense.description}</p>
                <p><strong>Date:</strong> {formatDate(viewingExpense.date)}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setViewingExpense(null)}>
                  <X size={16} className="mr-1" /> Close
                </Button>
                <Button className="flex-1 btn-primary" onClick={() => {
                  setViewingExpense(null);
                  handleEdit(viewingExpense);
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
              <CardTitle className="text-danger">Delete Expense?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                Are you sure you want to delete this expense? This action cannot be undone.
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

      <Card>
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenses.length === 0 ? (
              <p className="text-text-secondary text-center py-8">No expenses recorded yet.</p>
            ) : (
              expenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-4 bg-surface-2 rounded-lg hover:bg-surface-2/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
                      <DollarSign size={20} className="text-danger" />
                    </div>
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-text-secondary flex items-center gap-1">
                        <Calendar size={12} />
                        {expense.category} • {formatDate(expense.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-danger">{formatCurrency(expense.amount)}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleView(expense)}>
                        <Eye size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}>
                        <Edit size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(expense.id!)}>
                        <Trash2 size={14} className="text-danger" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
