// supabase/functions/update-order-status/index.ts
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
    
    // URLからorder_idを取得 (例: .../update-order-status/123)
    const url = new URL(req.url)
    const orderId = parseInt(url.pathname.split('/').pop() || '0', 10)
    
    const { status } = await req.json()
    if (!['cooking', 'ready', 'completed'].includes(status)) {
      throw new Error('Invalid status provided')
    }

    const { error } = await supabase
      .from('orders')
      .update({ status: status })
      .eq('id', orderId)
      
    if (error) throw error

    // TODO: WebSocket(Supabase Realtime)経由で更新を通知する

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