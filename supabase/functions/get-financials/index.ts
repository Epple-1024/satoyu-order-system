// supabase/functions/get-financials/index.ts
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
    
    // rpc (Remote Procedure Call)を使って、データベース関数を呼び出す
    const { data: salesData, error: salesError } = await supabase.rpc('get_total_sales')
    if (salesError) throw salesError

    const { data: expensesData, error: expensesError } = await supabase.rpc('get_total_expenses')
    if (expensesError) throw expensesError
    
    const sales = salesData || 0
    const expenses = expensesData || 0

    return new Response(JSON.stringify({ sales, expenses, profit: sales - expenses }), {
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