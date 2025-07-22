// js/views/Cashier.js (お客様画面連携・最終版)
import { fetchProducts, postOrder } from '../api.js';
import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';

const PRINT_SERVER_URL = 'https://fes-printer.local:5001/print';
const REALTIME_SERVER_URL = 'https://fes-realtime.local:5002';

export const Cashier = {
    render: async () => `
        <div class="page-container">
            <div class="main-panel">
                <div class="panel-header"><h3>商品選択</h3></div>
                <div id="product-grid" class="product-grid"></div>
            </div>
            <div class="side-panel">
                <div class="order-summary">
                    <h3>注文サマリー</h3>
                    <div id="order-items"><p class="empty-cart">商品はまだ追加されていません</p></div>
                    <div class="order-total">
                        <span>合計</span><span id="total-amount">¥ 0</span>
                    </div>
                    <button id="checkout-btn" class="btn btn-primary" disabled>会計・印刷</button>
                </div>
            </div>
        </div>
    `,
    after_render: async () => {
        const productGrid = document.getElementById('product-grid');
        const orderItemsContainer = document.getElementById('order-items');
        const totalAmountEl = document.getElementById('total-amount');
        const checkoutBtn = document.getElementById('checkout-btn');

        const socket = io(REALTIME_SERVER_URL);
        let products = [];
        let currentOrder = {}; // { productId: { ...productData, quantity: X } }

        const renderOrderSummary = () => {
            orderItemsContainer.innerHTML = '';
            let total = 0;
            const orderItems = Object.values(currentOrder);

            if (orderItems.length === 0) {
                orderItemsContainer.innerHTML = '<p class="empty-cart">商品はまだ追加されていません</p>';
                checkoutBtn.disabled = true;
            } else {
                orderItems.forEach(item => {
                    const subtotal = item.price * item.quantity;
                    total += subtotal;
                    const itemEl = document.createElement('div');
                    itemEl.className = 'order-item-display';
                    itemEl.innerHTML = `<span>${item.name} x ${item.quantity}</span><span>¥${subtotal.toLocaleString()}</span>`;
                    orderItemsContainer.appendChild(itemEl);
                });
                checkoutBtn.disabled = false;
            }
            totalAmountEl.textContent = `¥ ${total.toLocaleString()}`;
            
            // お客様用画面に現在の注文状況を送信
            socket.emit('order_update', { items: orderItems, total_amount: total });
        };
        
        products = await fetchProducts();
        productGrid.innerHTML = products.map(p => `<div class="product-card" data-product-id="${p.id}"><div class="name">${p.name}</div><div class="price">¥${p.price}</div></div>`).join('');

        productGrid.addEventListener('click', (e) => {
             const card = e.target.closest('.product-card');
             if (!card) return;
             const productId = card.dataset.productId;
             if (currentOrder[productId]) {
                 currentOrder[productId].quantity++;
             } else {
                 const product = products.find(p => p.id == productId);
                 currentOrder[productId] = { ...product, quantity: 1 };
             }
             renderOrderSummary();
        });

        checkoutBtn.addEventListener('click', async () => {
            checkoutBtn.disabled = true;
            const orderItems = Object.values(currentOrder);
            const orderData = {
                total_amount: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
                items: orderItems
            };

            try {
                const result = await postOrder(orderData);
                const printData = {
                    order_id: result.order_id,
                    items: orderData.items,
                    total: orderData.total_amount,
                    feedback_url: "https://forms.gle/271buFXnE24nMeFh9"
                };
                await fetch(PRINT_SERVER_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(printData)
                });
                alert(`会計が完了しました。(注文番号: ${result.order_id})`);
                currentOrder = {};
                renderOrderSummary();
            } catch (err) {
                alert(`会計処理に失敗しました: ${err.message}`);
            } finally {
                checkoutBtn.disabled = false;
            }
        });

        renderOrderSummary(); // 初期表示
    }
};