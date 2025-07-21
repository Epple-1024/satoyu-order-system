import { fetchProducts, postOrder } from '../api.js';

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
                    itemEl.innerHTML = `<span>${item.name} x ${item.quantity}</span><span>¥${subtotal.toLocaleString()}</span>`;
                    orderItemsContainer.appendChild(itemEl);
                });
                checkoutBtn.disabled = false;
            }
            totalAmountEl.textContent = `¥ ${total.toLocaleString()}`;
        };
        
        products = await fetchProducts();
        productGrid.innerHTML = products.map(p => `
            <div class="product-card" data-product-id="${p.id}">
                <div class="name">${p.name}</div><div class="price">¥${p.price}</div>
            </div>`).join('');

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
            const orderData = {
                total_amount: Object.values(currentOrder).reduce((sum, item) => sum + item.price * item.quantity, 0),
                items: Object.values(currentOrder)
            };
            try {
                await postOrder(orderData);
                alert('会計が完了しました。');
                currentOrder = {};
                renderOrderSummary();
            } catch (err) {
                alert('会計処理に失敗しました。');
            }
        });
    }
};