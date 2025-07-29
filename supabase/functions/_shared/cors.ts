// supabase/functions/_shared/cors.ts (統合・最終確定版)

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // 念のため、一般的なメソッドをすべて許可します
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}