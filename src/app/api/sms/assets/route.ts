import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/services/SmsService';
import type { SmsAsset } from '@/lib/sms-types';

export async function GET(req: NextRequest) {\n  try {\n    const { searchParams } = new URL(req.url);\n    const page = parseInt(searchParams.get('page') || '1');\n    const pageSize = parseInt(searchParams.get('pageSize') || '20');\n    const search = searchParams.get('search') || undefined;\n    const status = searchParams.get('status') || undefined;\n    const assigned_to = searchParams.get('assigned_to') || undefined;\n\n    // Note: Service needs pagination - using BaseService getAll with limit/offset\n    const filters = { \n      search, \n      status, \n      assigned_to, \n      limit: pageSize, \n      offset: (page - 1) * pageSize \n    };\n    const result = await smsService.getAssets(filters as any);\n    \n    return NextResponse.json({ \n      success: true, \n      data: result.data || [], \n      total: result.meta?.total || 0,\n      page,\n      pageSize,\n      totalPages: Math.ceil((result.meta?.total || 0) / pageSize)\n    });\n  } catch (error) {\n    console.error('[SMS Assets GET]', error);\n    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });\n  }\n}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const asset = await smsService.createAsset(data);
    return NextResponse.json({ success: true, data: asset });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

