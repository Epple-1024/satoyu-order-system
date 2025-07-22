// static/js/api.js (Supabase接続対応・最終版)

// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// 以下の2行を、あなたのSupabaseプロジェクトの情報に書き換えてください
const SUPABASE_URL = 'https://pdmghqnxsmriksutycwj.supabase.co'; // あなたのProject URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbWdocW54c21yaWtzdXR5Y3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNTUyNDcsImV4cCI6MjA2ODczMTI0N30.xofgRU_CeMrs5X784h9Tp2rueL88QBFEm0r6zCzDYfs'; // あなたのanon public API Key
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

const request = async (functionName, options = {}) => {
    const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
    const defaultHeaders = {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
    };
    
    const finalOptions = {
        ...options,
        headers: { ...defaultHeaders, ...options.headers }
    };

    try {
        const response = await fetch(url, finalOptions);
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
        }
        if (response.status === 204) return null;
        return response.json();
    } catch (error) {
        console.error(`API Error on ${functionName}:`, error);
        alert(`サーバーとの通信に失敗しました: ${error.message}`);
        throw error;
    }
};

// --- API Functions ---
// エンドポイント名をEdge Function名に合わせる
export const postLogin = (role, pin) => request('handle-login', { method: 'POST', body: JSON.stringify({ role, pin }) });
export const fetchProducts = () => request('get-products');
export const postOrder = (orderData) => request('create-order', { method: 'POST', body: JSON.stringify(orderData) });
export const updateOrderStatus = (orderId, status) => request(`update-order-status/${orderId}`, { method: 'POST', body: JSON.stringify({ status }) });
export const fetchActiveOrders = () => request('get-active-orders');
export const fetchFinancials = () => request('get-financials');
export const postExpense = (expenseData) => request('create-expense', { method: 'POST', body: JSON.stringify(expenseData) });
export const fetchUsers = () => request('get-users');
export const fetchShiftAssignments = (date) => request(`get-shift-assignments?date=${date}`);
export const fetchShiftTemplates = () => request('get-shift-templates');
export const postShiftAssignment = (assignmentData) => request('create-shift-assignment', { method: 'POST', body: JSON.stringify(assignmentData) });
export const fetchDailyResults = (date) => request(`get-daily-results?date=${date}`);
export const postProduct = (productData) => request('create-product', { method: 'POST', body: JSON.stringify(productData) }); // create-productを想定
export const updateProduct = (productId, productData) => request(`update-product/${productId}`, { method: 'PUT', body: JSON.stringify(productData) }); // update-productを想定
export const deleteProduct = (productId) => request(`delete-product/${productId}`, { method: 'DELETE' }); // delete-productを想定