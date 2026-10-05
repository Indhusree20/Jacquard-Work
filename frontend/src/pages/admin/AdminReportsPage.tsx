import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { adminApi } from '../../api/adminApi';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import { MapPin } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const { language } = useLanguage();
  const [reports, setReports] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await adminApi.getReports();
        if (res.success && res.data) {
          setReports(res.data);
        }
      } catch (err) {
        console.error('Error loading reports:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="relative space-y-6 max-w-6xl mx-auto pb-12">
      <ThariWatermark variant="loom-watermark" position="top-right" opacity="opacity-[0.03]" />

      <PageHeader
        badge="ANALYTICS • மண்டல பகுப்பாய்வு"
        title={language === 'ta' ? 'மண்டல பகுப்பாய்வு & அறிக்கைகள்' : 'Regional Analytics & Production Reports'}
        subtitle={
          language === 'ta'
            ? 'கைத்தறி மண்டல செயல்திறன், நெசவாளர் தேவைகள் மற்றும் கைவினைஞர் விநியோக புள்ளிவிவரங்கள்'
            : 'Handloom cluster performance, weaver demand, and master artisan distribution across Tamil Nadu.'
        }
      />

      {isLoading ? (
        <div className="p-12 text-center text-xs text-stone-500">Generating analytics...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* District Clusters Distribution */}
          <Card>
            <CardHeader
              title="Handloom Clusters Breakdown (Tamil Nadu)"
              subtitle="Registered Weavers and Jacquard Masters by District"
            />
            <CardContent className="p-0">
              <table className="w-full text-left text-xs text-stone-600">
                <thead className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-700 uppercase">
                  <tr>
                    <th className="p-4">District</th>
                    <th className="p-4">Weavers</th>
                    <th className="p-4">Jacquard Masters</th>
                    <th className="p-4 text-right">Total Artisans</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(reports?.districtStats || []).map((d: any) => (
                    <tr key={d._id} className="hover:bg-stone-50">
                      <td className="p-4 font-bold text-stone-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        <span>{d._id}</span>
                      </td>
                      <td className="p-4 font-semibold text-indigo-900">{d.weavers}</td>
                      <td className="p-4 font-semibold text-amber-800">{d.workers}</td>
                      <td className="p-4 text-right font-black text-stone-900 font-mono">{d.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Request Status Distribution */}
          <Card>
            <CardHeader
              title="Work Requests Status Distribution"
              subtitle="Demand lifecycle across the platform"
            />
            <CardContent className="p-0">
              <table className="w-full text-left text-xs text-stone-600">
                <thead className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-700 uppercase">
                  <tr>
                    <th className="p-4">Lifecycle Stage</th>
                    <th className="p-4">Requests Count</th>
                    <th className="p-4 text-right">Estimated Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(reports?.requestStatusStats || []).map((s: any) => (
                    <tr key={s._id} className="hover:bg-stone-50">
                      <td className="p-4 font-bold text-stone-900">{s._id}</td>
                      <td className="p-4 font-semibold text-stone-700">{s.count}</td>
                      <td className="p-4 text-right font-black text-indigo-950 font-mono">
                        ₹{s.totalEstimatedValue || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
