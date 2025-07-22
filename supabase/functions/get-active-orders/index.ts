// supabase/functions/get-active-orders/index.ts
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

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        order_items (
          products ( name ),
          quantity
        )
      `)
      .in('status', ['pending', 'cooking', 'ready'])
    
    if (error) throw error

    // フロントエンドが使いやすいようにデータを整形
    const formattedOrders = orders.map(o => ({
      id: o.id,
      status: o.status,
      items_summary: o.order_items.map(oi => `${oi.products.name} x ${oi.quantity}`).join('; ')
    }))

    return new Response(JSON.stringify(formattedOrders), {
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