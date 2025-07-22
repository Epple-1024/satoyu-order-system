// supabase/functions/create-order/index.ts
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
    
    const { total_amount, items } = await req.json()

    // 1. ordersテーブルに注文ヘッダを記録
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({ total_amount: total_amount, status: 'pending' })
      .select()
      .single()
    
    if (orderError) throw orderError
    
    // 2. order_itemsテーブルに明細を記録
    const orderItems = items.map(item => ({
      order_id: orderData.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      
    if (itemsError) throw itemsError

    // 3. 成功レスポンスを返す
    return new Response(JSON.stringify({ success: true, order_id: orderData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})