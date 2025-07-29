// supabase/functions/handle-login/index.ts (本番用・最終版)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }); }
  try {
    const { role, pin } = await req.json();
    if (!role || !pin) {
      throw new Error('Role and PIN are required.');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // ★★★ PINのチェックを有効に戻した本番用のコード ★★★
    const { data, error } = await supabase
      .from('users')
      .select('id, role')
      .eq('role', role)
      .eq('pin', pin) // PINもチェックする
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: '役割またはPINが正しくありません。' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});