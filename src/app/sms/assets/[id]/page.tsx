"use client";

import { notFound } from 'next/navigation';
import { smsService } from '@/services/SmsService';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import Image from 'next/image';

interface SmsAsset {
  id: string;
  name: string;
  itemCode?: string;
  type: string;
  category?: string;
  quantity?: number;
  location?: string;
  assignedTo?: string;
  status: string;
  imageUrl?: string;
  description?: string;
}

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await smsService.getAsset(id);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const asset = result.data;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <Link 
          href="/sms/assets" 
          className="inline-flex items-center gap-2 p-2 -m-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-medium transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          Assets
        </Link>
        <Link
          href={`/sms/assets/${id}/edit`}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg transition-all"
        >
          <Edit className="w-5 h-5" />
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">{asset.name}</h1>
          {asset.itemCode && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-800 rounded-xl mb-6">
              <span className="font-mono font-bold text-lg">#{asset.itemCode}</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <span className="block text-sm font-medium text-slate-500 mb-1">Type</span>
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl font-bold">{asset.type}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-slate-500 mb-1">Status</span>
              <span className={`px-4 py-2 rounded-xl font-bold text-sm ${
                asset.status === 'Available' ? 'bg-emerald-100 text-emerald-800' :
                asset.status === 'In Use' ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              }`}>
                {asset.status}
              </span>
            </div>
            {asset.quantity && (
              <div>
                <span className="block text-sm font-medium text-slate-500 mb-1">Quantity</span>
                <span className="font-mono text-2xl font-bold text-slate-900">{asset.quantity}</span>
              </div>
            )}
            {asset.category && (
              <div>
                <span className="block text-sm font-medium text-slate-500 mb-1">Category</span>
                <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-xl font-medium">{asset.category}</span>
              </div>
            )}
          </div>

          {asset.assignedTo && (
            <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="block text-sm font-medium text-slate-500 mb-2">Assigned To</span>
              <span className="font-bold text-slate-900">{asset.assignedTo}</span>
            </div>
          )}

          {asset.location && (
            <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="block text-sm font-medium text-slate-500 mb-2">Location</span>
              <span className="font-bold text-slate-900">{asset.location}</span>
            </div>
          )}
        </div>

        <div>
          {asset.imageUrl ? (
            <div className="relative w-full h-96 bg-slate-100 rounded-2xl overflow-hidden mb-8 shadow-lg">
              <Image
                src={asset.imageUrl}
                alt={asset.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : (
            <div className="w-full h-96 bg-slate-200 rounded-2xl flex items-center justify-center mb-8 shadow-lg">
              <span className="text-4xl font-bold text-slate-400">No Image</span>
            </div>
          )}

          {asset.description && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="block text-sm font-medium text-slate-500 mb-4">Description</span>
              <p className="text-slate-800 whitespace-pre-wrap">{asset.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
