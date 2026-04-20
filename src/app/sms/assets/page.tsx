"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Search, Plus, Edit, Eye, Loader2, AlertCircle, Trash2, Package } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface SmsAsset {
  id: string;
  name: string;
  itemCode: string | null;
  type: string;
  category: string | null;
  quantity: number | null;
  location: string | null;
  assignedTo: string | null;
  status: string;
  imageUrl: string | null;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  data: SmsAsset[];
  total: number;
}

export default function SmsAssetsPage() {
  const searchParams = useSearchParams();
  const [assets, setAssets] = useState<SmsAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchAssets = useCallback(async (pageNum: number = 1, q: string = search) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: pageSize.toString(),
        search: q,
      });
      const res = await fetch(`/api/sms/assets?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch assets');
      }
      const data: ApiResponse = await res.json();
      if (data.success) {
        setAssets(data.data);
        setTotal(data.total || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading assets');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchAssets(1, search);
  }, [fetchAssets]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAssets(1, search);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-emerald-100 text-emerald-800';
      case 'In Use': return 'bg-amber-100 text-amber-800';
      case 'Borrowed': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mr-3" />
          <span>Loading assets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-900">Assets</h1>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
            {total} total
          </span>
        </div>
        <Link
          href="/sms/assets/new"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          New Asset
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 text-red-600 flex-shrink-0" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
        <form onSubmit={handleSearch} className="p-6 border-b border-slate-200">
          <div className="max-w-md flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search assets by name, type, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all whitespace-nowrap"
            >
              Search
            </button>
          </div>
        </form>

        {assets.length === 0 ? (
          <div className="p-12 text-center">
            <Boxes className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No assets found</h3>
            <p className="text-slate-500 mb-6">Create your first asset to get started.</p>
            <Link
              href="/sms/assets/new"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create First Asset
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider hidden md:table-cell">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider hidden lg:table-cell">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider hidden md:table-cell">Quantity</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-900 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {asset.imageUrl ? (
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                              <img src={asset.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-slate-500">IMG</span>
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{asset.name}</div>
                            {asset.itemCode && (
                              <div className="text-sm text-slate-500">#{asset.itemCode}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{asset.type}</span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell font-medium text-slate-900">{asset.location || '-'}</td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">{asset.quantity || 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(asset.status)}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          href={`/sms/assets/${asset.id}`}
                          className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium text-sm p-2 -m-2 rounded-xl hover:bg-emerald-50 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">View</span>
                        </Link>
                        <Link
                          href={`/sms/assets/${asset.id}/edit`}
                          className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-3 py-2 rounded-xl shadow-sm hover:shadow-md transition-all"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} assets
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
