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

  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return new Response(JSON.stringify({ error: 'Kein Zugriff' }), { status: 403, headers: corsHeaders })
  }

  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  const result = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.user_metadata?.name ?? '',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
  }))

  return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
