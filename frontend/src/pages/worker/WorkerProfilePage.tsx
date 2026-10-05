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

export const WorkerProfilePage: React.FC = () => {
  const { user, updateUserData } = useAuth();
  const { language } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [experienceYears, setExperienceYears] = useState(user?.experienceYears || 15);
  const [specialization, setSpecialization] = useState(
    user?.specialization?.join(', ') || 'Jacquard Box Setup, Card Punching'
  );
  const [address, setAddress] = useState(user?.location?.address || '');
  const [city, setCity] = useState(user?.location?.city || 'Salem');
  const [district, setDistrict] = useState(user?.location?.district || 'Salem');
  const [pincode, setPincode] = useState(user?.location?.pincode || '636006');

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
        experienceYears: Number(experienceYears),
        specialization: specialization.split(',').map((s) => s.trim()),
        location: {
          address,
          city,
          district,
          pincode,
          state: 'Tamil Nadu',
          lat: user?.location?.lat || 11.644,
          lng: user?.location?.lng || 78.16
        }
      });
      if (res.success && res.data.user) {
        updateUserData(res.data.user);
        setSuccessMessage('Artisan profile updated successfully!');
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
        badge="ARTISAN • சுயவிவரம்"
        title={language === 'ta' ? 'கைவினைஞர் சுயவிவரம்' : 'Jacquard Master Profile'}
        subtitle={
          language === 'ta'
            ? 'உங்கள் கைவினை அனுபவம், சிறப்புத் திறன்கள் மற்றும் சேவை மாவட்டத்தை புதுப்பிக்கவும்'
            : 'Update your artisan experience, skill specializations, and service district.'
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
              <Input label="Full Name" required value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Phone Number" required value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Years of Experience"
                type="number"
                min={1}
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
              />
              <Input
                label="Specializations (comma separated)"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-stone-100">
              <h4 className="font-bold text-xs text-stone-700 uppercase tracking-wider">
                Home / Workshop Base Location
              </h4>
              <Input label="Street Address" value={address} onChange={(e) => setAddress(e.target.value)} />
              <div className="grid grid-cols-3 gap-3">
                <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
                <Input label="District" value={district} onChange={(e) => setDistrict(e.target.value)} />
                <Input label="PIN Code" value={pincode} onChange={(e) => setPincode(e.target.value)} />
              </div>
            </div>

            <Button type="submit" size="md" variant="secondary" className="mt-4" isLoading={isLoading}>
              Save Artisan Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
