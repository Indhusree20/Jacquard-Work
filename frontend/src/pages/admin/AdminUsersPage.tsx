import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { adminApi } from '../../api/adminApi';
import { IUser } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import { Search, MapPin } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { language } = useLanguage();
  const [users, setUsers] = useState<IUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (search) params.search = search;

      const res = await adminApi.listUsers(params);
      if (res.success) setUsers(res.data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleToggleStatus = async (user: IUser) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await adminApi.toggleUserStatus(user._id, newStatus);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, status: newStatus as any } : u))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating status.');
    }
  };

  return (
    <div className="relative space-y-6 max-w-6xl mx-auto pb-12">
      <ThariWatermark variant="loom-watermark" position="top-right" opacity="opacity-[0.03]" />

      <PageHeader
        badge="DIRECTORY • பயனர் மேலாண்மை"
        title={language === 'ta' ? 'பயனர்கள் & கைவினைஞர்கள் மேலாண்மை' : 'Users & Artisans Directory'}
        subtitle={
          language === 'ta'
            ? 'தமிழ்நாடு முழுவதும் பதிவுசெய்யப்பட்ட நெசவாளர்கள் மற்றும் ஜாகார்ட் மாஸ்டர் கைவினைஞர்களின் பட்டியல்'
            : 'Directory of registered weavers and Jacquard master artisans across Tamil Nadu handloom clusters.'
        }
      />

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'WEAVER', 'JACQUARD_WORKER'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  roleFilter === r
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : r === 'WEAVER' ? 'Weavers' : 'Jacquard Masters'}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72 relative">
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              className="w-full rounded-xl border border-stone-200 py-1.5 pl-8 pr-3 text-xs focus:ring-indigo-600 focus:border-indigo-600 shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-stone-500">Loading directory...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500">No users found.</div>
          ) : (
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <tr>
                  <th className="p-4">User / Artisan</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Cluster / Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-950 font-bold flex items-center justify-center text-xs border border-indigo-200/60">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">{u.name}</p>
                          <p className="text-[11px] text-stone-500">{u.email} • {u.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-stone-800">
                      {u.role === 'WEAVER' ? (
                        <span className="text-indigo-900 font-bold">Weaver ({u.loomCount || 4} Looms)</span>
                      ) : u.role === 'JACQUARD_WORKER' ? (
                        <span className="text-amber-850 font-bold">Jacquard Master ({u.experienceYears || 10} yrs)</span>
                      ) : (
                        u.role
                      )}
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-stone-700">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        {u.location?.city || 'Salem'}, {u.location?.district || 'Salem'}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge status={u.status} size="sm" />
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'PRIMARY_ADMIN' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(u)}
                          className="text-xs py-1"
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
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
    </div>
  );
};
