// js/views/Cashier.js (最終確定版・完全版)
import AbstractView from "./AbstractView.js";

// シンプルなカートクラス
class Cart {
    constructor() {
        this.items = [];
    }
    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.items.push({ ...product, quantity: 1 });
        }
    }
    removeItem(productId) {
        const itemIndex = this.items.findIndex(item => item.id === productId);
        if (itemIndex > -1) {
            const item = this.items[itemIndex];
            if (item.quantity > 1) {
                item.quantity--;
            } else {
                this.items.splice(itemIndex, 1);
            }
        }
    }
    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    clear() {
        this.items = [];
    }
}

export class Cashier extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("レジ");
        this.cart = new Cart();
        this.products = [];
        this.registerId = params.id || 1;
    }

    async getHtml() {
        // Your new CSS uses .page-container and panels, so we adapt the HTML structure
        return `
            <div class="page-container cashier-container">
                <div class="main-panel product-grid-container">
                    <div class="product-grid" id="product-grid">
                        </div>
                </div>
                <div class="side-panel order-sidebar">
                    <div class="order-summary">
                        <h2>注文内容 (レジ #${this.registerId})</h2>
                        <ul id="cart-items" class="item-list"></ul>
                        <div class="order-total">
                            <span>合計</span>
                            <span id="total-price">¥0</span>
                        </div>
                    </div>
                    <div class="customer-attributes">
                        <h3>顧客属性</h3>
                        <div class="attribute-group">
                            <button class="customer-btn gender" data-value="male">男性</button>
                            <button class="customer-btn gender" data-value="female">女性</button>
                            <button class="customer-btn gender" data-value="other">その他</button>
                        </div>
                        <div class="attribute-group">
                            <button class="customer-btn age" data-value="child">~12</button>
                            <button class="customer-btn age" data-value="teen">13-19</button>
                            <button class="customer-btn age" data-value="adult">20-59</button>
                            <button class="customer-btn age" data-value="senior">60~</button>
                        </div>
                         <div class="attribute-group">
                            <button class="customer-btn group" data-value="1">1名</button>
                            <button class="customer-btn group" data-value="2">2名</button>
                            <button class="customer-btn group" data-value="3">3名</button>
                            <button class="customer-btn group" data-value="4">4名~</button>
                        </div>
                    </div>
                    <div class="coupon-section">
                        <h3>クーポン</h3>
                        <input type="text" id="coupon-code-input" class="form-control" placeholder="クーポンコードを入力">
                    </div>
                    <div class="checkout-actions">
                        <button id="clear-cart-btn" class="btn btn-secondary">クリア</button>
                        <button id="checkout-btn" class="btn btn-primary">会計</button>
                    </div>
                </div>
            </div>
            <div id="loading-overlay" class="modal-backdrop" style="display: none;">
                <div class="spinner">処理中...</div>
            </div>
        `;
    }

    afterRender() {
        this.loadProducts();
        this.setupEventListeners();
    }

    async loadProducts() {
        this.products = await window.api.getProducts();
        const productGrid = document.getElementById('product-grid');
        productGrid.innerHTML = this.products.map(p => `
            <div class="product-card" data-product-id="${p.id}">
                <div class="product-name">${p.name}</div>
                <div class="product-price">¥${p.price}</div>
            </div>
        `).join('');

        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => {
                const product = this.products.find(p => p.id == card.dataset.productId);
                this.cart.addItem(product);
                this.updateCartView();
            });
        });
    }

    updateCartView() {
        const cartItemsEl = document.getElementById('cart-items');
        const totalPriceEl = document.getElementById('total-price');

        cartItemsEl.innerHTML = this.cart.items.map(item => `
            <li class="list-item">
                <span class="item-name">${item.name} x${item.quantity}</span>
                <span class="item-price">¥${item.price * item.quantity}</span>
                <button class="remove-item-btn btn btn-sm btn-delete" data-product-id="${item.id}">&times;</button>
            </li>
        `).join('');

        totalPriceEl.textContent = `¥${this.cart.getTotal().toLocaleString()}`;

        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.cart.removeItem(Number(e.target.dataset.productId));
                this.updateCartView();
            });
        });
    }
    
    setupEventListeners() {
        document.querySelectorAll('.attribute-group').forEach(group => {
            group.addEventListener('click', e => {
                if (e.target.classList.contains('customer-btn')) {
                    group.querySelectorAll('.customer-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        });

        document.getElementById('clear-cart-btn').addEventListener('click', () => {
            if (confirm('現在の注文内容をすべてクリアしますか？')) {
                this.resetCashier();
            }
        });
        
        document.getElementById('checkout-btn').addEventListener('click', async () => {
            if (this.cart.items.length === 0) {
                alert("カートが空です。");
                return;
            }

            document.getElementById('loading-overlay').style.display = 'flex';

            const customerInfo = {
                gender: document.querySelector('.customer-btn.gender.active')?.dataset.value || null,
                age_group: document.querySelector('.customer-btn.age.active')?.dataset.value || null,
                group_size: document.querySelector('.customer-btn.group.active')?.dataset.value || null
            };
            
            const couponCode = document.getElementById('coupon-code-input').value.trim();

            const orderPayload = {
                items: this.cart.items.map(item => ({ product_id: item.id, quantity: item.quantity })),
                customer_info: customerInfo,
                coupon_code: couponCode || null
            };

            try {
                const newOrder = await window.api.createOrder(orderPayload);
                
                const printData = {
                    order_id: newOrder.display_id,
                    items: this.cart.items.map(i => ({name: i.name, quantity: i.quantity, price: i.price})),
                    total: newOrder.total_amount,
                    discount: newOrder.discount_amount,
                    final_total: newOrder.final_amount,
                    coupon_code: couponCode || null,
                    feedback_url: `https://satoyu-order-system.vercel.app/feedback/${newOrder.id}`
                };

                await window.api.printReceipt(printData);
                alert(`注文 #${newOrder.display_id} を受け付けました。`);
                this.resetCashier();

            } catch (error) {
                console.error('会計処理に失敗しました:', error);
                alert(`会計処理に失敗しました: ${error.message}`);
            } finally {
                document.getElementById('loading-overlay').style.display = 'none';
            }
        });
    }
    
    resetCashier() {
        this.cart.clear();
        this.updateCartView();
        document.getElementById('coupon-code-input').value = '';
        document.querySelectorAll('.customer-btn.active').forEach(b => b.classList.remove('active'));
    }
}