import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  // Check DB connection
  const { error: dbError } = await supabase
    .from('profiles')
    .select('count', { count: 'exact', head: true })
    .limit(1);

  // Check Supabase Auth
  const { error: authError } = await supabase.auth.getUser();

  const healthy = !dbError && !authError;

  const healthData = {
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: {
        status: !dbError ? 'ok' : 'error',
        error: dbError?.message,
      },
      auth: {
        status: !authError ? 'ok' : 'error',
        error: authError?.message,
      },
    },
    version: process.env.npm_package_version || '1.0.0',
  };

  return new Response(JSON.stringify(healthData, null, 2), {
    status: healthy ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
