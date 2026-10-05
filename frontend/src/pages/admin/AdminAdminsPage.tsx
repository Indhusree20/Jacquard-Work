import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { adminApi } from '../../api/adminApi';
import { IAdminUser } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import { PlusCircle } from 'lucide-react';

const ALL_PERMISSIONS = [
  { id: 'MANAGE_USERS', label: 'Manage All Users (Weavers & Workers)' },
  { id: 'MANAGE_WORKERS', label: 'Manage Jacquard Masters' },
  { id: 'MANAGE_WEAVERS', label: 'Manage Handloom Weavers' },
  { id: 'MANAGE_ADMINS', label: 'Invite & Manage Admins' },
  { id: 'MANAGE_WORK_TYPES', label: 'Manage Work Types Catalog' },
  { id: 'MANAGE_PRICING', label: 'Manage Base Pricing & Rates' },
  { id: 'MANAGE_JOBS', label: 'Oversee Jobs Lifecycle' },
  { id: 'MANAGE_QUOTES', label: 'Inspect Quotations' },
  { id: 'VIEW_REPORTS', label: 'View Regional Analytics & Reports' },
  { id: 'MANAGE_SETTINGS', label: 'Manage System Settings' }
];

export const AdminAdminsPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [admins, setAdmins] = useState<IAdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Regional Handloom Operations');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'MANAGE_USERS',
    'MANAGE_WORK_TYPES',
    'MANAGE_JOBS',
    'VIEW_REPORTS'
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.listAdmins();
      if (res.success) setAdmins(res.data.admins);
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleTogglePerm = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await adminApi.createAdmin({
        name,
        email,
        phone,
        password,
        department,
        permissions: selectedPermissions
      });
      if (res.success) {
        setModalOpen(false);
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        fetchAdmins();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create admin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAdminStatus = async (admin: IAdminUser) => {
    try {
      const res = await adminApi.toggleAdminStatus(admin._id);
      if (res.success) fetchAdmins();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating admin status.');
    }
  };

  return (
    <div className="relative space-y-6 max-w-6xl mx-auto pb-12">
      <ThariWatermark variant="loom-watermark" position="top-right" opacity="opacity-[0.03]" />

      <PageHeader
        badge="ACCESS CONTROL • நிர்வாகிகள்"
        title={language === 'ta' ? 'நிர்வாகிகள் & அனுமதிகள் மேலாண்மை' : 'Administrators & Granular RBAC'}
        subtitle={
          language === 'ta'
            ? 'நிர்வாக அனுமதிகள், மண்டல துறைகள் மற்றும் அணுகல் கட்டுப்பாடுகளை உள்ளமைக்கவும்'
            : 'Configure administrative permissions, regional handloom departments, and access controls.'
        }
        actions={
          user?.role === 'PRIMARY_ADMIN' ? (
            <Button size="sm" variant="primary" onClick={() => setModalOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span>Invite New Administrator</span>
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-stone-500">Loading administrators...</div>
          ) : admins.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500">No admin records found.</div>
          ) : (
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Administrator</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Assigned Permissions</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {admins.map((adm) => (
                  <tr key={adm._id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-950 text-amber-400 font-bold flex items-center justify-center text-xs border border-indigo-900 shadow-2xs">
                          {adm.userId?.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">{adm.userId?.name}</p>
                          <p className="text-[11px] text-stone-500">{adm.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-stone-800">{adm.department || 'General Admin'}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {adm.permissions.map((p) => (
                          <span
                            key={p}
                            className="bg-stone-100 text-stone-700 text-[10px] font-mono px-1.5 py-0.5 rounded border border-stone-200/60"
                          >
                            {p.replace('MANAGE_', '')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge status={adm.status} size="sm" />
                    </td>
                    <td className="p-4 text-right">
                      {user?.role === 'PRIMARY_ADMIN' && adm.userId?._id !== user._id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAdminStatus(adm)}
                          className="text-xs py-1"
                        >
                          {adm.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add Admin Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Invite / Create Administrator"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input label="Admin Name" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email Address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input label="Phone Number" required value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input
              label="Temporary Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Input
            label="Department / Handloom Division"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Granular Admin Permissions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
              {ALL_PERMISSIONS.map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm.id)}
                    onChange={() => handleTogglePerm(perm.id)}
                    className="rounded text-indigo-900 focus:ring-indigo-600"
                  />
                  <span className="font-medium text-stone-800">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" variant="primary" isLoading={isSubmitting}>
              Create Administrator
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
