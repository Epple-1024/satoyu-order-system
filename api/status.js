// api/status.js
import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method === 'POST') {
    // Raspberry Piからのデータ書き込み
    // 簡単な認証を追加（実際の運用ではより強固に）
    if (request.headers.get('x-auth-key') !== 'den4pro3') {
      return response.status(401).json({ error: 'Unauthorized' });
    }
    const data = await request.json();
    await kv.set('latest_status', data);
    return response.status(200).json({ success: true });
  } else {
    // 外部ダッシュボードからのデータ読み取り
    const data = await kv.get('latest_status');
    return response.status(200).json(data);
  }
}