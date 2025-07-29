// supabase/functions/handle-login/index.ts (デバッグ版)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }); }
  try {
    const { role, pin } = await req.json();
    console.log(`Attempting login for role: ${role}`); // ログに役割を出力

    const supabase = createClient( Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization')! } } });

    // ★★★ デバッグのため、PINのチェックを一時的に無効化 ★★★
    const { data, error } = await supabase
      .from('users')
      .select('id, role')
      .eq('role', role) // 役割(role)だけでユーザーを検索
      .single();

    if (error || !data) {
      console.error('Login failed. No user found for role:', role, error);
      return new Response(JSON.stringify({ error: `役割'${role}'が見つかりません。` }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Login successful for role:', role, data);
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Critical error in handle-login:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});