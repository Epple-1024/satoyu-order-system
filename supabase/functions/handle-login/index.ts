// supabase/functions/handle-login/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    
    const { role, pin } = await req.json()

    // usersテーブルから、役割とPINコードが一致するユーザーを検索
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('role', role)
      .eq('pin', pin)
      .single()

    if (error || !data) {
      // 一致するユーザーが見つからない場合はエラー
      return new Response(JSON.stringify({ success: false, error: 'Invalid role or PIN' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }
    
    // 認証成功
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})