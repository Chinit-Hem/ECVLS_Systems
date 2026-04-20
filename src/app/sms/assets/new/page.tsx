"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EditAssetPage from '../[id]/edit/page';

export default function NewAssetPage() {
  return (
    <>
      <Link 
        href="/sms/assets" 
        className="inline-flex items-center gap-2 p-2 -m-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 mb-8 font-medium transition-all shadow-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Assets
      </Link>
      <EditAssetPage />
    </>
  );
}
