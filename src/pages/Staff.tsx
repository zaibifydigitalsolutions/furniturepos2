import { useEffect, useState } from 'react';
import { db, type User } from '../lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Edit, Trash2, X, Save, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Staff() {
  const [staff, setStaff] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingMember, setViewingMember] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'cashier',
    status: 'active'
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    const allStaff = await db.users.toArray();
    setStaff(allStaff);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      email: '',
      phone: '',
      role: 'cashier',
      status: 'active',
      permissions: ['pos']
    });
    setShowModal(true);
  };

  const handleEdit = (member: User) => {
    setEditingId(member.id!);
    setFormData({
      name: member.name,
      username: member.username,
      email: member.email,
      phone: member.phone,
      role: member.role,
      status: member.status,
      permissions: member.permissions
    });
    setShowModal(true);
  };

  const handleView = (member: User) => {
    setViewingMember(member);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.username || (!editingId && !formData.password)) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      if (editingId) {
        await db.users.update(editingId, {
          ...formData,
          updatedAt: new Date()
        });
        toast.success('Staff member updated successfully!');
      } else {
        const bcrypt = await import('bcryptjs');
        await db.users.add({
          ...formData as User,
          password: bcrypt.hashSync(formData.password!, 10),
          createdAt: new Date()
        });
        toast.success('Staff member added successfully!');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({});
      loadStaff();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await db.users.delete(id);
      toast.success('Staff member deleted successfully!');
      setDeleteConfirm(null);
      loadStaff();
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
        <h1 className="text-3xl font-display font-bold text-primary">Staff Management</h1>
        <Button className="btn-primary" onClick={handleAdd}>
          <Plus size={16} className="mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Staff Member' : 'Add Staff Member'}</CardTitle>
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
                <label className="text-sm font-medium">Username *</label>
                <Input 
                  value={formData.username || ''} 
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="Enter username"
                  className="mt-1"
                  disabled={!!editingId}
                />
              </div>
              {!editingId && (
                <div>
                  <label className="text-sm font-medium">Password *</label>
                  <Input 
                    type="password"
                    value={formData.password || ''} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Enter password"
                    className="mt-1"
                  />
                </div>
              )}
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
                <label className="text-sm font-medium">Phone</label>
                <Input 
                  value={formData.phone || ''} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Enter phone number"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select 
                  className="w-full mt-1 p-2 border rounded-lg bg-white"
                  value={formData.role}
                  onChange={(e) => {
                    const role = e.target.value as User['role'];
                    let perms: string[] = [];
                    if (role === 'super_admin') perms = ['all'];
                    else if (role === 'admin') perms = ['dashboard', 'pos', 'products', 'inventory', 'reports', 'staff', 'customers'];
                    else if (role === 'cashier') perms = ['pos', 'customers'];
                    else perms = ['pos', 'products'];
                    setFormData({...formData, role, permissions: perms});
                  }}
                >
                  <option value="cashier">Cashier</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
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
      {viewingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-xl">
                  {viewingMember.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <CardTitle>{viewingMember.name}</CardTitle>
                  <p className="text-sm text-text-secondary capitalize">{viewingMember.role.replace('_', ' ')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Username:</strong> {viewingMember.username}</div>
                <div><strong>Email:</strong> {viewingMember.email}</div>
                <div><strong>Phone:</strong> {viewingMember.phone}</div>
                <div><strong>Status:</strong> <span className={viewingMember.status === 'active' ? 'text-success' : 'text-danger'}>{viewingMember.status}</span></div>
              </div>
              <div className="pt-2">
                <strong className="text-sm">Permissions:</strong>
                <div className="flex flex-wrap gap-2 mt-1">
                  {viewingMember.permissions?.map((perm, idx) => (
                    <span key={idx} className="px-2 py-1 bg-surface-2 rounded text-xs capitalize">{perm}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setViewingMember(null)}>
                  <X size={16} className="mr-1" /> Close
                </Button>
                <Button className="flex-1 btn-primary" onClick={() => {
                  setViewingMember(null);
                  handleEdit(viewingMember);
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
              <CardTitle className="text-danger">Delete Staff Member?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                Are you sure you want to delete this staff member? This action cannot be undone.
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

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map(member => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-lg">
                  {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <p className="text-sm text-text-secondary capitalize">{member.role.replace('_', ' ')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> {member.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {member.phone || 'N/A'}</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${member.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {member.status}
                  </span>
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleView(member)}>
                  <Eye size={14} className="mr-1" /> View
                </Button>
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleEdit(member)}>
                  <Edit size={14} className="mr-1" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(member.id!)}>
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
