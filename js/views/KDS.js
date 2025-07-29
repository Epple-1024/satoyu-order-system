// js/views/KDS.js (最終確定版・完全版)
import AbstractView from "./AbstractView.js";

export class KDS extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("厨房モニター (KDS)");
        const urlParams = new URLSearchParams(window.location.search);
        this.view = urlParams.get('view') || 'all';
        this.orders = [];
        this.audio = new Audio('/assets/sounds/ready.mp3');
    }

    async getHtml() {
        // Your CSS uses kds-lane and kds-column
        // We will stick to kds-column as per the filtering CSS logic
        return `
            <div class="kds-container view-${this.view}">
                <div class="kds-column kds-lane" id="pending-column">
                    <div class="kds-header">📋 受注 (Pending)</div>
                    <div class="kds-tickets" id="pending-orders"></div>
                </div>
                <div class="kds-column kds-lane" id="cooking-column">
                    <div class="kds-header">🍳 調理中 (Cooking)</div>
                    <div class="kds-tickets" id="cooking-orders"></div>
                </div>
                <div class="kds-column kds-lane" id="ready-column">
                    <div class="kds-header">✅ 完成 (Ready)</div>
                    <div class="kds-tickets" id="ready-orders"></div>
                </div>
            </div>
        `;
    }

    afterRender() {
        this.fetchAndRenderOrders();
        this.subscribeToChanges();
    }
    
    subscribeToChanges() {
        window.api.subscribeToOrders((payload) => {
            console.log('Realtime change received!', payload);
            this.fetchAndRenderOrders();
            if (payload.eventType === 'INSERT') {
                this.audio.play();
            }
        });
    }
    
    async fetchAndRenderOrders() {
        this.orders = await window.api.getActiveOrders();
        this.renderColumns();
    }
    
    renderColumns() {
        const columns = {
            pending: document.getElementById('pending-orders'),
            cooking: document.getElementById('cooking-orders'),
            ready: document.getElementById('ready-orders'),
        };
        Object.values(columns).forEach(col => col.innerHTML = '');
        
        this.orders.forEach(order => {
            if (columns[order.status]) {
                columns[order.status].appendChild(this.createOrderCard(order));
            }
        });
    }

    createOrderCard(order) {
        const card = document.createElement('div');
        card.className = 'ticket'; // Use 'ticket' class from your new CSS
        card.dataset.orderId = order.id;
        
        const itemsHtml = order.order_items.map(item => 
            `<li>${item.products.name} x ${item.quantity}</li>`
        ).join('');

        card.innerHTML = `
            <div class="order-card-header">
                <span class="order-id">#${order.display_id}</span>
                <span class="order-time">${new Date(order.created_at).toLocaleTimeString('ja-JP')}</span>
            </div>
            <ul class="order-card-body">${itemsHtml}</ul>
            <div class="order-card-actions">
                ${this.createActionButtons(order.status)}
            </div>
        `;
        
        card.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const newStatus = e.target.dataset.nextStatus;
                await window.api.updateOrderStatus(order.id, newStatus);
                // No need to call fetchAndRenderOrders() here, as the realtime subscription will handle it.
            });
        });
        
        return card;
    }

    createActionButtons(status) {
        if (status === 'pending') {
            return `<button class="action-btn btn btn-primary" data-next-status="cooking">調理開始 →</button>`;
        }
        if (status === 'cooking') {
            return `<button class="action-btn btn btn-primary" data-next-status="ready">完成 →</button>`;
        }
        if (status === 'ready') {
            return `<button class="action-btn btn btn-secondary" data-next-status="completed">お渡し済 ✔</button>`;
        }
        return '';
    }

    destroy() {
        window.api.unsubscribeFromOrders();
    }
}