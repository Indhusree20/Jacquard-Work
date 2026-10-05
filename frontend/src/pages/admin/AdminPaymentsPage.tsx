import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { jobApi } from '../../api/jobApi';
import { IPayment } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import { Receipt } from 'lucide-react';

export const AdminPaymentsPage: React.FC = () => {
  const { language } = useLanguage();
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await jobApi.getPayments({ limit: 100 });
        if (res.success) setPayments(res.data.payments);
      } catch (err) {
        console.error('Error fetching admin payments:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const totalVolume = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="relative space-y-6 max-w-6xl mx-auto pb-12">
      <ThariWatermark variant="loom-watermark" position="top-right" opacity="opacity-[0.03]" />

      <PageHeader
        badge="RECONCILIATION • பணப்பரிவர்த்தனைகள்"
        title={language === 'ta' ? 'கட்டணங்கள் & பணப்பரிவர்த்தனைகள்' : 'Payments & Transaction Reconciliation'}
        subtitle={
          language === 'ta'
            ? 'நெசவாளர்கள் மற்றும் ஜாகார்ட் மாஸ்டர் கைவினைஞர்களுக்கு இடையே பதிவு செய்யப்பட்ட சரிபார்க்கப்பட்ட கட்டணங்கள்'
            : 'Track verified payments recorded between weavers and Jacquard master artisans across Tamil Nadu.'
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-emerald-50/50 border-stone-200">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Total Completed Volume
          </span>
          <p className="text-2xl font-black text-emerald-950 mt-1 font-mono">₹{totalVolume}</p>
        </Card>
        <Card className="p-5 border-stone-200">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
            Total Records
          </span>
          <p className="text-2xl font-black text-stone-900 mt-1 font-mono">{payments.length}</p>
        </Card>
        <Card className="p-5 border-stone-200">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">
            Primary Method
          </span>
          <p className="text-2xl font-black text-indigo-950 mt-1">UPI / Direct Cash</p>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-stone-500">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Receipt}
                variant="seal"
                title="No payment records found"
                description="Recorded transactions will appear here for administrative oversight."
              />
            </div>
          ) : (
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Payment ID</th>
                  <th className="p-4">Weaver Payer</th>
                  <th className="p-4">Recipient Master</th>
                  <th className="p-4">Method & Ref</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-stone-50/80">
                    <td className="p-4 font-mono font-bold text-stone-900">{p.paymentId}</td>
                    <td className="p-4 font-semibold text-stone-800">
                      {p.weaverId?.businessName || p.weaverId?.name}
                    </td>
                    <td className="p-4 text-amber-900 font-medium">{p.workerId?.name}</td>
                    <td className="p-4">
                      <span className="font-semibold text-stone-700">{p.method}</span>
                      {p.transactionReference && (
                        <span className="block text-[10px] text-stone-400">{p.transactionReference}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge status={p.status} size="sm" />
                    </td>
                    <td className="p-4 text-right font-black text-emerald-900 text-sm font-mono">
                      ₹{p.amount}
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
