import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { jobApi } from '../../api/jobApi';
import { IPayment } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import { Receipt } from 'lucide-react';

export const WorkerChargesPage: React.FC = () => {
  const { language } = useLanguage();
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await jobApi.getPayments();
        if (res.success) setPayments(res.data.payments);
      } catch (err) {
        console.error('Error fetching payments:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const totalCollected = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="relative space-y-6 max-w-5xl mx-auto pb-12">
      <ThariWatermark variant="loom-watermark" position="top-right" opacity="opacity-[0.03]" />

      <PageHeader
        badge="EARNINGS • கட்டண பதிவேடு"
        title={language === 'ta' ? 'கட்டணம் & வருவாய் பதிவேடு' : 'Charges & Earnings Log'}
        subtitle={
          language === 'ta'
            ? 'முடிக்கப்பட்ட தறி பணிகளிலிருந்து பெறப்பட்ட கட்டண விவரங்கள்'
            : 'Track received payouts and recorded labor fees from handloom owners.'
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 border-stone-200/90 bg-emerald-50/50">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Total Paid Payouts
          </span>
          <p className="text-3xl font-black text-emerald-950 mt-1 font-mono">₹{totalCollected}</p>
          <span className="text-[11px] text-emerald-700 mt-1 block font-medium">Verified received on-site</span>
        </Card>

        <Card className="p-5 border-stone-200/90">
          <span className="text-xs font-bold text-stone-600 uppercase tracking-wider block">
            Total Completed Transactions
          </span>
          <p className="text-3xl font-black text-stone-900 mt-1 font-mono">{payments.length}</p>
          <span className="text-[11px] text-stone-500 mt-1 block">Recorded on platform</span>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader title="Payment Receipts" subtitle="All transaction history" />
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-stone-500">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Receipt}
                variant="seal"
                title={language === 'ta' ? 'பரிவர்த்தனைகள் ஏதுமில்லை' : 'No payment records found'}
                description={
                  language === 'ta'
                    ? 'முடிக்கப்பட்ட தறி பணிகளுக்கான கட்டண ரசீதுகள் இங்கு காண்பிக்கப்படும்.'
                    : 'Receipts for completed handloom jobs and artisan earnings will appear here.'
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {payments.map((p) => (
                <div key={p._id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-stone-900">{p.paymentId}</span>
                      <Badge status={p.status} size="sm" />
                    </div>
                    <p className="text-xs text-stone-700 font-medium">
                      Weaver: {p.weaverId?.businessName || p.weaverId?.name}
                    </p>
                    <span className="text-[11px] text-stone-400 block">
                      Method: {p.method} {p.transactionReference && `• Ref: ${p.transactionReference}`} •{' '}
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-emerald-900 block font-mono">₹{p.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
