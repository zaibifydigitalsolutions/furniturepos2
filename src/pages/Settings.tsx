import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { logout } from '../lib/auth';
import toast from 'react-hot-toast';

export default function Settings() {
  const { businessName, receiptHeader, receiptFooter, currency, lowStockAlert, autoPrint, updateSetting } = useSettingsStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('business');

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-primary">Settings</h1>

      <div className="flex gap-4 border-b border-border">
        {['business', 'pos', 'security', 'data'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize ${activeTab === tab ? 'border-b-2 border-accent text-accent' : 'text-text-secondary'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'business' && (
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Business Name</Label>
              <Input value={businessName} onChange={(e) => updateSetting('businessName', e.target.value)} />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={currency} onChange={(e) => updateSetting('currency', e.target.value)} />
            </div>
            <Button onClick={handleSave} className="btn-primary">Save Changes</Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'pos' && (
        <Card>
          <CardHeader>
            <CardTitle>POS Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Low Stock Alert</Label>
              <Input type="number" value={lowStockAlert} onChange={(e) => updateSetting('lowStockAlert', Number(e.target.value))} />
            </div>
            <div>
              <Label>Receipt Header</Label>
              <Input value={receiptHeader} onChange={(e) => updateSetting('receiptHeader', e.target.value)} />
            </div>
            <div>
              <Label>Receipt Footer</Label>
              <Input value={receiptFooter} onChange={(e) => updateSetting('receiptFooter', e.target.value)} />
            </div>
            <Button onClick={handleSave} className="btn-primary">Save Changes</Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <Input type="password" />
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" />
            </div>
            <Button onClick={handleSave} className="btn-primary">Update Password</Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'data' && (
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="secondary" className="w-full">Export All Data (JSON)</Button>
              <Button variant="secondary" className="w-full">Export Products (CSV)</Button>
              <Button variant="secondary" className="w-full">Export Sales (CSV)</Button>
              <Button variant="secondary" className="w-full">Import Products (CSV)</Button>
            </div>
            <div className="pt-4 border-t border-border">
              <Button variant="destructive" className="w-full">Reset to Factory Defaults</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 border-danger">
        <CardHeader>
          <CardTitle className="text-danger">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
