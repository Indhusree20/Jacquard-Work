import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { authApi } from '../../api/authApi';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import { CheckCircle2 } from 'lucide-react';

export const WeaverProfilePage: React.FC = () => {
  const { user, updateUserData } = useAuth();
  const { language } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [loomCount, setLoomCount] = useState(user?.loomCount || 4);
  const [address, setAddress] = useState(user?.location?.address || '');
  const [city, setCity] = useState(user?.location?.city || 'Salem');
  const [district, setDistrict] = useState(user?.location?.district || 'Salem');
  const [pincode, setPincode] = useState(user?.location?.pincode || '636001');

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');
    try {
      const res = await authApi.updateProfile({
        name,
        phone,
        businessName,
        loomCount: Number(loomCount),
        location: {
          address,
          city,
          district,
          pincode,
          state: 'Tamil Nadu',
          lat: user?.location?.lat || 11.6643,
          lng: user?.location?.lng || 78.146
        }
      });
      if (res.success && res.data.user) {
        updateUserData(res.data.user);
        setSuccessMessage('Profile updated successfully!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative max-w-2xl mx-auto space-y-6 pb-12">
      <ThariWatermark variant="loom-watermark" position="top-right" opacity="opacity-[0.03]" />

      <PageHeader
        badge="ACCOUNT • தறி பட்டறை"
        title={language === 'ta' ? 'சுயவிவரம் & தறி பட்டறை' : 'Profile & Weaving Unit'}
        subtitle={
          language === 'ta'
            ? 'உங்கள் தொடர்பு விவரங்கள் மற்றும் கைத்தறி பட்டறை தகவல்களை நிர்வகிக்கவும்'
            : 'Manage your contact information and handloom workshop details.'
        }
      />

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleUpdate} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Phone Number"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Weaving Unit Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <Input
                label="Number of Looms"
                type="number"
                min={1}
                value={loomCount}
                onChange={(e) => setLoomCount(Number(e.target.value))}
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-stone-100">
              <h4 className="font-bold text-xs text-stone-700 uppercase tracking-wider">
                Workshop Location
              </h4>
              <Input
                label="Street Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <div className="grid grid-cols-3 gap-3">
                <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
                <Input label="District" value={district} onChange={(e) => setDistrict(e.target.value)} />
                <Input label="PIN Code" value={pincode} onChange={(e) => setPincode(e.target.value)} />
              </div>
            </div>

            <Button type="submit" size="md" variant="primary" className="mt-4" isLoading={isLoading}>
              Save Profile Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
