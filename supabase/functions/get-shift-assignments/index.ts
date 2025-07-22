// supabase/functions/get-shift-assignments/index.ts
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
    
    const url = new URL(req.url)
    const shiftDate = url.searchParams.get('date')

    const { data: assignments, error } = await supabase
      .from('shift_assignments')
      .select(`
        id,
        shift_date,
        users ( name ),
        shifts ( name, start_time, end_time )
      `)
      .eq('shift_date', shiftDate)
      
    if (error) throw error

    // フロントエンドが使いやすいようにデータを整形
    const formatted = assignments.map(a => ({
      id: a.id,
      shift_date: a.shift_date,
      user_name: a.users.name,
      shift_name: a.shifts.name,
      start_time: a.shifts.start_time,
      end_time: a.shifts.end_time,
    }))

    return new Response(JSON.stringify(formatted), {
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