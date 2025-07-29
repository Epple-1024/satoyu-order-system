// js/api.js (関数名・Admin機能 最終修正版)
import { supabase } from './supabaseClient.js';

const PRINT_SERVER_URL = 'https://fes-printer.local'; // ローカルでもHTTPSを想定

// --- 認証 ---
export const login = async (role, pin) => {
    const { data, error } = await supabase.functions.invoke('handle-login', {
        body: { role, pin },
    });
    if (error) throw error;
    return data;
};

// --- レジ・KDS・プロジェクター関連 ---
export const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('id');
    if (error) throw new Error(error.message);
    return data;
};

export const createOrder = async (orderData) => {
    const { data, error } = await supabase.functions.invoke('create-order', {
        body: orderData,
    });
    // エラーメッセージの形式を調整
    if (error) throw new Error(error.message || (error.data ? error.data.error : 'Unknown error'));
    return data;
};

export const fetchActiveOrders = async () => {
    const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items(*, products(*))`)
        .in('status', ['pending', 'cooking', 'ready'])
        .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
};

export const updateOrderStatus = async (orderId, newStatus) => {
    const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
    if (error) throw new Error(error.message);
    return data;
};

// --- リアルタイム ---
let orderSubscription = null;
export const subscribeToOrders = (callback) => {
    if (orderSubscription) {
        orderSubscription.unsubscribe();
    }
    orderSubscription = supabase
        .channel('public:orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
            callback(payload);
        })
        .subscribe();
    return orderSubscription;
};

export const unsubscribeFromOrders = () => {
    if (orderSubscription) {
        orderSubscription.unsubscribe();
        orderSubscription = null;
    }
};

// --- 結果・管理画面関連 ---
export const fetchDailyResults = async () => {
    const { data, error } = await supabase.rpc('get_daily_summary');
    if (error) throw new Error(error.message);
    return data;
};

export const fetchFinancials = async () => {
    // get_daily_summaryから流用
    const summary = await fetchDailyResults();
    return {
        sales: summary.total_sales,
        expenses: summary.total_cost, // 経費=原価として扱う
        profit: summary.total_profit
    };
};

export const postExpense = async (expenseData) => {
    const { data, error } = await supabase.from('expenses').insert(expenseData);
    if (error) throw new Error(error.message);
    return data;
};

export const postProduct = async (productData) => {
    const { data, error } = await supabase.from('products').insert(productData);
    if (error) throw new Error(error.message);
    return data;
};

export const updateProduct = async (id, productData) => {
    const { data, error } = await supabase.from('products').update(productData).eq('id', id);
    if (error) throw new Error(error.message);
    return data;
};

export const deleteProduct = async (id) => {
    const { data, error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return data;
};

// --- 印刷 ---
export const printReceipt = async (printData) => {
    try {
        const response = await fetch(`${PRINT_SERVER_URL}/print`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(printData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '印刷サーバーエラー');
        }
        return await response.json();
    } catch (error) {
        console.error('印刷エラー:', error);
        throw new Error('印刷サーバーに接続できません。');
    }
};