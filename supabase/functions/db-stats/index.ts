import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ADMIN_EMAIL = 'alex.bandholt@web.de'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Nicht autorisiert' }), { status: 401, headers: corsHeaders })
  }

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
  if (authError || !user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return new Response(JSON.stringify({ error: 'Kein Zugriff' }), { status: 403, headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // DB-Größe
  const { data: sizeData } = await supabaseAdmin.rpc('get_db_size')

  // Zeilenzahlen
  const { count: monthCount } = await supabaseAdmin
    .from('month_data').select('*', { count: 'exact', head: true })
  const { count: stammdatenCount } = await supabaseAdmin
    .from('stammdaten').select('*', { count: 'exact', head: true })

  // Nutzeranzahl
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()

  return new Response(JSON.stringify({
    db_size_bytes: sizeData,
    db_size_mb: sizeData ? Math.round(sizeData / 1024 / 1024 * 10) / 10 : null,
    free_tier_limit_mb: 500,
    month_rows: monthCount ?? 0,
    stammdaten_rows: stammdatenCount ?? 0,
    user_count: users.length,
    mau_limit: 50000,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
