// js/supabaseClient.js (新規作成)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://pdmghqnxsmriksutycwj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbWdocW54c21yaWtzdXR5Y3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNTUyNDcsImV4cCI6MjA2ODczMTI0N30.xofgRU_CeMrs5X784h9Tp2rueL88QBFEm0r6zCzDYfs';

export const supabase = createClient(supabaseUrl, supabaseKey);