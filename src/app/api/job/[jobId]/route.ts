import { NextRequest, NextResponse } from 'next/server';
import { conversionQueue } from '@/lib/queue';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId;

  if (!jobId || !/^[a-zA-Z0-9_-]+$/.test(jobId)) {
    return NextResponse.json(
      { success: false, error: 'Invalid job ID' },
      { status: 400 }
    );
  }

  try {
    const job = await conversionQueue.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    const state = await job.getState(); // 'waiting', 'active', 'completed', 'failed', 'delayed'
    const progress = job.progress();
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    return NextResponse.json({
      success: true,
      data: {
        id: jobId,
        status: state,
        progress: progress,
        result: result,
        error: failedReason,
      },
    });
  } catch (error) {
    console.error('Job query error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to query job status' },
      { status: 500 }
    );
  }
}
