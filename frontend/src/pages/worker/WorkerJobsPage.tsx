import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { jobApi } from '../../api/jobApi';
import { IJob } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ThariWatermark } from '../../components/ui/ThariWatermark';
import {
  Briefcase,
  Calendar,
  MapPin,
  Phone
} from 'lucide-react';

export const WorkerJobsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const params: any = {};
        if (statusFilter !== 'ALL') params.status = statusFilter;
        const res = await jobApi.getJobs(params);
        if (res.success) setJobs(res.data.jobs);
      } catch (err) {
        console.error('Error fetching worker jobs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, [statusFilter]);

  return (
    <div className="relative space-y-6 max-w-7xl mx-auto pb-12">
      <ThariWatermark variant="loom-watermark" position="top-right" opacity="opacity-[0.03]" />

      <PageHeader
        badge="ARTISAN PORTAL • பணிகள் மேலாண்மை"
        title={t('nav.myJobs', 'My Jacquard Jobs')}
        subtitle={
          language === 'ta'
            ? 'உறுதிசெய்யப்பட்ட தறி பணிகள், வாடிக்கையாளர் முகவரி மற்றும் நேரலை நிலை மேலாண்மை'
            : 'Track confirmed loom jobs, customer location navigation, and mark on-site progress.'
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['ALL', 'CONFIRMED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === st
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {st === 'ALL' ? t('common.all', 'All Jobs') : t(`statuses.${st}`, st)}
          </button>
        ))}
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-stone-500">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          variant="loom"
          title={language === 'ta' ? 'பணிகள் ஏதுமில்லை' : 'No jobs found'}
          description={
            language === 'ta'
              ? 'நெசவாளர்கள் உங்கள் விலைப்புள்ளிகளை ஏற்றுக்கொள்ளும்போது, உங்கள் பணிகள் இங்கு பட்டியலிடப்படும்.'
              : 'When weavers accept your quotations, your assigned jobs will appear here.'
          }
          actionLabel={language === 'ta' ? 'கிடைக்கக்கூடிய கோரிக்கைகள்' : 'Browse Available Requests'}
          actionLink="/worker/requests"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <Card key={job._id} hoverEffect className="border-stone-200/90">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-stone-900">{job.jobId}</span>
                    <h3 className="text-sm font-bold text-stone-900 mt-0.5">
                      {job.workTypeId?.name ? (job.workTypeId.name[language] || job.workTypeId.name.en) : 'Jacquard Service'}
                    </h3>
                  </div>
                  <Badge status={job.status} />
                </div>

                {/* Weaver Details */}
                <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/70 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">
                      {job.weaverId?.businessName || job.weaverId?.name}
                    </span>
                    <a
                      href={`tel:${job.weaverId?.phone}`}
                      className="text-indigo-900 hover:text-indigo-950 font-semibold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{job.weaverId?.phone}</span>
                    </a>
                  </div>
                  <p className="text-stone-500 text-[11px] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                    <span>
                      {job.weaverId?.location?.address || 'Loom Site'}, {job.weaverId?.location?.city}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{new Date(job.scheduledDate).toLocaleDateString()}</span>
                  </span>
                  <span className="font-bold text-amber-900 text-sm font-mono">₹{job.totalAgreedAmount}</span>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <Link to={`/worker/jobs/${job._id}`} className="w-full">
                    <Button size="sm" variant="secondary" withArrow className="w-full text-xs">
                      <span>Manage & Update Progress</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
