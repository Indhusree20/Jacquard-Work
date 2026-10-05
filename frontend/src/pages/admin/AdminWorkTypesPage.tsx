import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { adminApi } from '../../api/adminApi';
import { workRequestApi } from '../../api/workRequestApi';
import { IWorkType } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import { PlusCircle, Edit3, Trash2 } from 'lucide-react';

export const AdminWorkTypesPage: React.FC = () => {
  const { language } = useLanguage();
  const [workTypes, setWorkTypes] = useState<IWorkType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameEn, setNameEn] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [code, setCode] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descTa, setDescTa] = useState('');
  const [basePrice, setBasePrice] = useState<number>(2500);
  const [unit, setUnit] = useState<'per_loom' | 'per_design' | 'per_day' | 'fixed'>('per_loom');
  const [estimatedHours, setEstimatedHours] = useState<number>(8);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWorkTypes = async () => {
    setIsLoading(true);
    try {
      const res = await workRequestApi.getWorkTypes();
      if (res.success) setWorkTypes(res.data.workTypes);
    } catch (err) {
      console.error('Error fetching work types:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkTypes();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setNameEn('');
    setNameTa('');
    setCode('');
    setDescEn('');
    setDescTa('');
    setBasePrice(2500);
    setUnit('per_loom');
    setEstimatedHours(8);
    setModalOpen(true);
  };

  const handleOpenEdit = (wt: IWorkType) => {
    setEditingId(wt._id);
    setNameEn(wt.name.en);
    setNameTa(wt.name.ta);
    setCode(wt.code);
    setDescEn(wt.description.en);
    setDescTa(wt.description.ta);
    setBasePrice(wt.basePrice);
    setUnit(wt.unit);
    setEstimatedHours(wt.estimatedHours);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: { en: nameEn, ta: nameTa },
        code: code.toUpperCase(),
        description: { en: descEn, ta: descTa },
        basePrice: Number(basePrice),
        unit,
        estimatedHours: Number(estimatedHours)
      };

      if (editingId) {
        await adminApi.updateWorkType(editingId, payload);
      } else {
        await adminApi.createWorkType(payload);
      }

      setModalOpen(false);
      fetchWorkTypes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving work type.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this work type?')) return;
    try {
      await adminApi.deleteWorkType(id);
      fetchWorkTypes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deleting work type.');
    }
  };

  return (
    <div className="relative space-y-6 max-w-6xl mx-auto pb-12">
      <ThariWatermark variant="loom-watermark" position="top-right" opacity="opacity-[0.03]" />

      <PageHeader
        badge="CATALOGUE • வேலை வகைகள்"
        title={language === 'ta' ? 'ஜாகார்ட் வேலை வகைகள் & அடிப்படை விலை' : 'Work Types & Pricing Matrix'}
        subtitle={
          language === 'ta'
            ? 'கைத்தறி ஜாகார்ட் சேவைகள், அடிப்படை கட்டணங்கள் மற்றும் இருமொழி விளக்கங்களை நிர்வகிக்கவும்'
            : 'Define handloom Jacquard services, base rates, time estimates, and bilingual descriptions.'
        }
        actions={
          <Button size="sm" variant="primary" onClick={handleOpenCreate}>
            <PlusCircle className="w-4 h-4 mr-1.5" />
            <span>Add New Service Type</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 p-12 text-center text-xs text-stone-500">Loading catalog...</div>
        ) : (
          workTypes.map((wt) => (
            <Card key={wt._id} hoverEffect className="border-stone-200/90 flex flex-col justify-between">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/60">
                    {wt.code}
                  </span>
                  <span className="text-base font-black text-indigo-950 font-mono">₹{wt.basePrice}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-stone-900">{wt.name[language] || wt.name.en}</h3>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-3">
                    {wt.description[language] || wt.description.en}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span>Unit: {wt.unit.replace('_', ' ')}</span>
                  <span>~{wt.estimatedHours} hrs</span>
                </div>
              </CardContent>

              <div className="p-3 bg-stone-50/80 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(wt)}
                  className="p-1.5 rounded-lg text-stone-600 hover:text-indigo-900 hover:bg-stone-200/60 transition-colors"
                  title="Edit Service"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(wt._id)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Deactivate"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Work Type' : 'Create Work Type'}
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Name (English)" required value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            <Input label="Name (தமிழ்)" required value={nameTa} onChange={(e) => setNameTa(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Service Code" required value={code} onChange={(e) => setCode(e.target.value)} />
            <Input
              label="Base Charge (₹)"
              type="number"
              min={0}
              required
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
            />
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Billing Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full rounded-xl border border-stone-200 p-2.5 text-xs bg-white shadow-2xs"
              >
                <option value="per_loom">Per Loom (தறி ஒன்றுக்கு)</option>
                <option value="per_design">Per Design (வடிவமைப்புக்கு)</option>
                <option value="per_day">Per Day (நாளுக்கு)</option>
                <option value="fixed">Fixed Price</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Description (English)</label>
            <textarea
              rows={2}
              required
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              className="w-full rounded-xl border border-stone-200 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Description (தமிழ்)</label>
            <textarea
              rows={2}
              required
              value={descTa}
              onChange={(e) => setDescTa(e.target.value)}
              className="w-full rounded-xl border border-stone-200 p-2 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" variant="primary" isLoading={isSubmitting}>
              Save Service Type
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
