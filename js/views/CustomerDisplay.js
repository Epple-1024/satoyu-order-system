// js/views/CustomerDisplay.js (新規作成・完全版)
import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';

// Raspberry Pi 4Bのリアルタイム中継サーバーに接続
const REALTIME_SERVER_URL = 'http://fes-realtime.local:5002';

export const CustomerDisplay = {
    render: async () => `
        <div class="customer-display-container">
            <div class="order-details-panel">
                <div class="panel-header">
                    <h1>ご注文内容</h1>
                </div>
                <div id="customer-order-items" class="order-items-list">
                    <p class="no-order">ご注文をお待ちしております</p>
                </div>
                <div class="order-total-display">
                    <span>お会計</span>
                    <span id="customer-total-amount">¥ 0</span>
                </div>
            </div>
            <div class="side-ad-panel">
                <video src="/assets/videos/ad.mov" autoplay loop muted playsinline></video>
            </div>
        </div>
    `,
    after_render: async () => {
        const orderItemsContainer = document.getElementById('customer-order-items');
        const totalAmountEl = document.getElementById('customer-total-amount');

        const socket = io(REALTIME_SERVER_URL);

        socket.on('connect', () => {
            console.log('Connected to real-time server!');
        });

        const renderOrder = (orderData) => {
            if (!orderData || orderData.items.length === 0) {
                orderItemsContainer.innerHTML = '<p class="no-order">ご注文をお待ちしております</p>';
                totalAmountEl.textContent = '¥ 0';
                return;
            }

            orderItemsContainer.innerHTML = ''; // リストをクリア
            orderData.items.forEach(item => {
                const subtotal = item.price * item.quantity;
                const itemEl = document.createElement('div');
                itemEl.className = 'order-item-display';
                itemEl.innerHTML = `
                    <span class="name">${item.name}</span>
                    <span class="quantity">x ${item.quantity}</span>
                    <span class="price">¥${subtotal.toLocaleString()}</span>
                `;
                orderItemsContainer.appendChild(itemEl);
            });

            totalAmountEl.textContent = `¥ ${orderData.total_amount.toLocaleString()}`;
        };

        // サーバーから 'display_update' イベントを受け取った時の処理
        socket.on('display_update', (orderData) => {
            renderOrder(orderData);
        });
    }
};