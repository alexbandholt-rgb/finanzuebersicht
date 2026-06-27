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

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Nicht eingeloggt' }), { status: 401, headers: corsHeaders })
  }

  const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  const url = new URL(req.url)
  const adminExport = isAdmin && url.searchParams.get('all') === '1'

  if (adminExport) {
    // Admin: alle Nutzerdaten + E-Mail-Mapping
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const emailMap: Record<string, string> = {}
    users.forEach(u => { emailMap[u.id] = u.email ?? u.id })

    const { data: rows, error } = await supabaseAdmin
      .from('month_data')
      .select('user_id, year, month, data')
      .order('user_id')
      .order('year')
      .order('month')

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
    }

    const byUser: Record<string, { email: string; months: unknown[] }> = {}
    for (const row of rows ?? []) {
      const email = emailMap[row.user_id] ?? row.user_id
      if (!byUser[row.user_id]) byUser[row.user_id] = { email, months: [] }
      byUser[row.user_id].months.push({ year: row.year, month: row.month, data: row.data })
    }

    const result = {
      exportedAt: new Date().toISOString(),
      users: Object.values(byUser),
    }
    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } else {
    // Normaler Nutzer: nur eigene Daten
    const { data: rows, error } = await supabaseUser
      .from('month_data')
      .select('year, month, data')
      .order('year')
      .order('month')

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
    }

    const result = {
      exportedAt: new Date().toISOString(),
      email: user.email,
      months: (rows ?? []).map(r => ({ year: r.year, month: r.month, data: r.data })),
    }
    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
