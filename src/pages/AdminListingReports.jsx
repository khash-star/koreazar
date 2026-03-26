import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Flag } from 'lucide-react';
import * as entities from '@/api/entities';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function AdminListingReports() {
  const { user, userData, loading } = useAuth();
  const isAdmin = userData?.role === 'admin' || user?.role === 'admin';
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['listingReports'],
    queryFn: () => entities.ListingReport.list(),
    enabled: isAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => entities.ListingReport.update(id, { status, reviewed_at: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listingReports'] }),
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Уншиж байна...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-3">Зөвхөн админ хэрэглэгч үзэх боломжтой</p>
          <Link to={createPageUrl('Home')}><Button>Нүүр рүү буцах</Button></Link>
        </div>
      </div>
    );
  }

  const pending = reports.filter((r) => r.status === 'pending');
  const handled = reports.filter((r) => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to={createPageUrl('AdminPanel')}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-xl font-bold">Зарын гомдол</h1>
          <span className="text-sm text-gray-500">Нийт: {reports.length}</span>
        </div>

        {isLoading ? (
          <div>Уншиж байна...</div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="font-semibold mb-3 text-red-700">Шинэ гомдол ({pending.length})</h2>
              <div className="space-y-3">
                {pending.length === 0 && <div className="bg-white rounded-lg p-4 text-gray-500">Шинэ гомдол алга</div>}
                {pending.map((r) => (
                  <div key={r.id} className="bg-white rounded-xl p-4 border border-red-100">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{r.listing_title || 'Гарчиггүй зар'}</div>
                        <div className="text-sm text-gray-500">Гомдол: {r.reason}</div>
                        {r.details && <p className="text-sm mt-2 whitespace-pre-wrap">{r.details}</p>}
                        <div className="text-xs text-gray-500 mt-2">
                          {r.reporter_email || 'unknown'} · {r.created_date?.toDate ? r.created_date.toDate().toLocaleString('mn-MN') : ''}
                        </div>
                      </div>
                      <Flag className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => updateMutation.mutate({ id: r.id, status: 'reviewed' })}>
                        Хянаж дууссан
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: r.id, status: 'rejected' })}>
                        Хүчингүй
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-semibold mb-3 text-gray-700">Шийдвэрлэсэн ({handled.length})</h2>
              <div className="space-y-3">
                {handled.length === 0 && <div className="bg-white rounded-lg p-4 text-gray-500">Одоогоор байхгүй</div>}
                {handled.map((r) => (
                  <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100 opacity-80">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{r.listing_title || 'Гарчиггүй зар'}</div>
                        <div className="text-sm text-gray-500">{r.reason}</div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded bg-gray-100">{r.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

