// static/js/api.js (商品管理対応・最終版)
const API_BASE_URL = 'http://fes-server.local:5000/api';

const request = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            // エラーの場合はレスポンスボディから詳細を取得
            const errorBody = await response.json();
            throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
        }
        // ステータスコード204 (No Content) など、ボディがない場合を考慮
        if (response.status === 204) return null;
        return response.json();
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
        alert(`サーバーとの通信に失敗しました: ${error.message}`);
        throw error;
    }
};

// --- Login ---
export const postLogin = (role, pin) => request('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, pin }),
});

// --- Products ---
export const fetchProducts = () => request('/products');
export const postProduct = (productData) => request('/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
});
export const updateProduct = (productId, productData) => request(`/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
});
export const deleteProduct = (productId) => request(`/products/${productId}`, {
    method: 'DELETE',
});

// --- Orders ---
export const postOrder = (orderData) => request('/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
});
export const updateOrderStatus = (orderId, status) => request(`/orders/${orderId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
});
export const fetchActiveOrders = () => request('/orders/active');

// --- Financials & Expenses ---
export const fetchFinancials = () => request('/financials/summary');
export const postExpense = (expenseData) => request('/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expenseData),
});

// --- Users & Shifts ---
export const fetchUsers = () => request('/users');
export const fetchShiftAssignments = (date) => request(`/shifts?date=${date}`);
export const fetchShiftTemplates = () => request('/shifts/templates');
export const postShiftAssignment = (assignmentData) => request('/shift_assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assignmentData),
});

// --- Results ---
export const fetchDailyResults = (date) => request(`/results/daily?date=${date}`);