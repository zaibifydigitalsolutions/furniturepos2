import { useEffect, useState } from 'react';
import { db, type Customer } from '../lib/db';
import { formatCurrency } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Edit, Phone, Trash2, X, Save, Eye, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    cnic: '',
    creditLimit: 0,
    notes: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const allCustomers = await db.customers.toArray();
    setCustomers(allCustomers);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      cnic: '',
      creditLimit: 0,
      creditBalance: 0,
      totalSpent: 0,
      visits: 0,
      notes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id!);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      cnic: customer.cnic,
      creditLimit: customer.creditLimit,
      notes: customer.notes
    });
    setShowModal(true);
  };

  const handleView = (customer: Customer) => {
    setViewingCustomer(customer);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('Name and phone are required');
      return;
    }

    try {
      if (editingId) {
        await db.customers.update(editingId, {
          ...formData,
          updatedAt: new Date()
        });
        toast.success('Customer updated successfully!');
      } else {
        await db.customers.add({
          ...formData as Customer,
          totalSpent: 0,
          creditBalance: 0,
          visits: 0,
          createdAt: new Date()
        });
        toast.success('Customer added successfully!');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({});
      loadCustomers();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await db.customers.delete(id);
      toast.success('Customer deleted successfully!');
      setDeleteConfirm(null);
      loadCustomers();
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

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold text-primary">Customers</h1>
        <Button className="btn-primary" onClick={handleAdd}>
          <Plus size={16} className="mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Customer' : 'Add Customer'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <Input 
                  value={formData.name || ''} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter full name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone *</label>
                <Input 
                  value={formData.phone || ''} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Enter phone number"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input 
                  type="email"
                  value={formData.email || ''} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter email"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">CNIC</label>
                <Input 
                  value={formData.cnic || ''} 
                  onChange={(e) => setFormData({...formData, cnic: e.target.value})}
                  placeholder="Enter CNIC number"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">City</label>
                <Input 
                  value={formData.city || ''} 
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="Enter city"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <Input 
                  value={formData.address || ''} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Enter address"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Credit Limit</label>
                <Input 
                  type="number"
                  value={formData.creditLimit || ''} 
                  onChange={(e) => setFormData({...formData, creditLimit: Number(e.target.value)})}
                  placeholder="Enter credit limit"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input 
                  value={formData.notes || ''} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Enter notes"
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
      {viewingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-xl">
                  {viewingCustomer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <CardTitle>{viewingCustomer.name}</CardTitle>
                  <p className="text-sm text-text-secondary flex items-center gap-1">
                    <Phone size={12} />
                    {viewingCustomer.phone}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-2 p-3 rounded-lg text-center">
                  <p className="text-xs text-text-secondary">Total Spent</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(viewingCustomer.totalSpent || 0)}</p>
                </div>
                <div className="bg-surface-2 p-3 rounded-lg text-center">
                  <p className="text-xs text-text-secondary">Visits</p>
                  <p className="text-lg font-bold text-primary">{viewingCustomer.visits || 0}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> {viewingCustomer.email || 'N/A'}</p>
                <p><strong>CNIC:</strong> {viewingCustomer.cnic || 'N/A'}</p>
                <p><strong>City:</strong> {viewingCustomer.city || 'N/A'}</p>
                <p><strong>Address:</strong> {viewingCustomer.address || 'N/A'}</p>
                <p><strong>Credit Limit:</strong> {formatCurrency(viewingCustomer.creditLimit || 0)}</p>
                <p><strong>Credit Balance:</strong> {formatCurrency(viewingCustomer.creditBalance || 0)}</p>
                {viewingCustomer.notes && <p><strong>Notes:</strong> {viewingCustomer.notes}</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setViewingCustomer(null)}>
                  <X size={16} className="mr-1" /> Close
                </Button>
                <Button className="flex-1 btn-primary" onClick={() => {
                  setViewingCustomer(null);
                  handleEdit(viewingCustomer);
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
              <CardTitle className="text-danger">Delete Customer?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                Are you sure you want to delete this customer? This action cannot be undone.
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-lg">
                  {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                  <p className="text-sm text-text-secondary flex items-center gap-1">
                    <Phone size={12} />
                    {customer.phone}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface-2 p-2 rounded text-center">
                  <p className="text-xs text-text-secondary">Spent</p>
                  <p className="font-bold text-sm">{formatCurrency(customer.totalSpent || 0)}</p>
                </div>
                <div className="bg-surface-2 p-2 rounded text-center">
                  <p className="text-xs text-text-secondary">Visits</p>
                  <p className="font-bold text-sm">{customer.visits || 0}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleView(customer)}>
                  <Eye size={14} className="mr-1" /> View
                </Button>
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleEdit(customer)}>
                  <Edit size={14} className="mr-1" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(customer.id!)}>
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
