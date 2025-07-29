// supabase/functions/create-order/index.ts (最終確定版)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { items, customer_info, coupon_code } = await req.json();

    if (!items || items.length === 0) {
      throw new Error('注文商品がありません。');
    }

    // 1. 商品情報の整合性チェックと合計金額の計算
    let total_amount = 0;
    const productPromises = items.map(item =>
      supabase.from('products').select('id, name, price, current_stock, initial_stock').eq('id', item.product_id).single()
    );
    const productResults = await Promise.all(productPromises);
    const orderItemsForInsert = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const { data: product, error } = productResults[i];

      if (error || !product) throw new Error(`商品ID ${item.product_id} が見つかりません。`);
      if (product.initial_stock > 0 && product.current_stock < item.quantity) {
        throw new Error(`「${product.name}」の在庫が不足しています。`);
      }
      total_amount += product.price * item.quantity;
      orderItemsForInsert.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // 2. 【デュアルクーポン対応】クーポン情報の検証と割引額の計算
    let coupon_id = null;
    let discount_amount = 0;
    if (coupon_code) {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('id, is_used, discount_type, discount_value')
        .eq('code', coupon_code)
        .single();

      if (couponError) throw new Error('無効なクーポンコードです。');
      if (coupon.is_used) throw new Error('このクーポンは既に使用されています。');
      
      coupon_id = coupon.id;

      // クーポンの種類に応じて割引額を計算
      if (coupon.discount_type === 'PERCENT') {
        discount_amount = Math.floor(total_amount * (coupon.discount_value / 100));
      } else if (coupon.discount_type === 'FIXED') {
        discount_amount = coupon.discount_value;
      }
    }
    
    // 割引額が合計金額を超える場合は、合計金額を割引額とする（支払い額がマイナスにならないように）
    if (discount_amount > total_amount) {
        discount_amount = total_amount;
    }
    const final_amount = total_amount - discount_amount;

    // 3. 新しい表示IDを決定
    const { data: lastOrder } = await supabase.from('orders').select('display_id').order('id', { ascending: false }).limit(1).maybeSingle();
    const new_display_id = (lastOrder?.display_id || 0) + 1;

    // 4. ordersテーブルに注文レコードを作成
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        display_id: new_display_id,
        status: 'pending',
        total_amount: total_amount,
        final_amount: final_amount,
        discount_amount: discount_amount,
        coupon_id: coupon_id,
        customer_gender: customer_info.gender,
        customer_age_group: customer_info.age_group,
        customer_group_size: customer_info.group_size,
      })
      .select('id, display_id, total_amount, discount_amount, final_amount') // レシート印刷に必要な情報を返す
      .single();
    if (orderError) throw orderError;

    // 5. order_itemsテーブルに注文明細を記録
    const finalOrderItems = orderItemsForInsert.map(item => ({ ...item, order_id: newOrder.id }));
    const { error: itemsError } = await supabase.from('order_items').insert(finalOrderItems);
    if (itemsError) throw itemsError;

    // 6. 在庫を減算
    for (const item of orderItemsForInsert) {
      await supabase.rpc('decrement_stock', { product_id_to_update: item.product_id, quantity_to_decrement: item.quantity });
    }

    // 7. クーポンを使用済みに更新
    if (coupon_id) {
      await supabase.from('coupons').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', coupon_id);
    }

    // 8. 成功レスポンスを返す
    return new Response(JSON.stringify(newOrder), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});