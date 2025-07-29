// js/api.js (最終修正版)
import { supabase } from './supabaseClient.js';

const PRINT_SERVER_URL = 'http://fes-printer.local:5001';

// ログイン
export const login = async (role, pin) => {
    const { data, error } = await supabase.functions.invoke('handle-login', {
        body: { role, pin },
    });
    if (error) throw error;
    return data;
};

// 全商品を取得
export const getProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('id');
    if (error) throw new Error(error.message);
    return data;
};

// 注文を作成
export const createOrder = async (orderData) => {
    const { data, error } = await supabase.functions.invoke('create-order', {
        body: orderData,
    });
    if (error) throw new Error(error.data.error);
    return data;
};

// レシートを印刷
export const printReceipt = async (printData) => {
    try {
        const response = await fetch(`${PRINT_SERVER_URL}/print`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(printData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '印刷サーバーでエラーが発生しました。');
        }
        return await response.json();
    } catch (error) {
        console.error('印刷エラー:', error);
        throw new Error('印刷サーバーに接続できませんでした。プリンターの電源とネットワークを確認してください。');
    }
};

// アクティブな注文を取得 (KDS用)
export const getActiveOrders = async () => {
    const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items(*, products(*))`)
        .in('status', ['pending', 'cooking', 'ready'])
        .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
};

// 注文ステータスを更新 (KDS用)
export const updateOrderStatus = async (orderId, newStatus) => {
    const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
    if (error) throw new Error(error.message);
    return data;
};

// 注文の変更をリアルタイムで購読 (KDS用)
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

// 営業結果を取得
export const getDailyResults = async () => {
    const { data, error } = await supabase.rpc('get_daily_summary');
    if (error) throw new Error(error.message);
    return data;
};


// ★★★ ここからが修正箇所です ★★★
// Admin.jsが必要とする関数に`export`を追加します

export const fetchFinancials = async () => {
    const { data: salesData, error: salesError } = await supabase.rpc('get_total_sales');
    if (salesError) throw new Error(salesError.message);

    const { data: expensesData, error: expensesError } = await supabase.rpc('get_total_expenses');
    if (expensesError) throw new Error(expensesError.message);

    return {
        sales: salesData,
        expenses: expensesData,
        profit: salesData - expensesData
    };
};

export const postExpense = async (expenseData) => {
    const { data, error } = await supabase.from('expenses').insert(expenseData);
    if (error) throw new Error(error.message);
    return data;
};

export const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
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