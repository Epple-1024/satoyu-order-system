import { updateOrderStatus, fetchActiveOrders } from '../api.js';

export const KDS = {
    render: async () => `
        <div class="kds-container">
            <div class="kds-lane" id="pending"><div class="kds-header">受注</div><div class="kds-tickets"></div></div>
            <div class="kds-lane" id="cooking"><div class="kds-header">調理中</div><div class="kds-tickets"></div></div>
            <div class="kds-lane" id="ready"><div class="kds-header">完成</div><div class="kds-tickets"></div></div>
        </div>
    `,
    after_render: async () => {
        const lanes = {
            pending: document.querySelector('#pending .kds-tickets'),
            cooking: document.querySelector('#cooking .kds-tickets'),
            ready: document.querySelector('#ready .kds-tickets'),
        };

        const createTicketElement = (order) => {
            const ticket = document.createElement('div');
            ticket.className = 'ticket';
            ticket.dataset.id = order.id;
            
            const itemsHtml = order.items_summary.split('; ').map(item => `<li>${item}</li>`).join('');
            
            let actionButton = '';
            if (order.status === 'pending') {
                actionButton = '<button class="btn btn-primary btn-sm btn-cook">調理開始</button>';
            } else if (order.status === 'cooking') {
                actionButton = '<button class="btn btn-primary btn-sm btn-ready">完成</button>';
            } else if (order.status === 'ready') {
                actionButton = '<span>お渡し待ち</span>';
            }

            ticket.innerHTML = `
                <div class="ticket-header">注文 #${order.id}</div>
                <ul>${itemsHtml}</ul>
                <div class="ticket-action">${actionButton}</div>`;
            return ticket;
        };

        const updateView = (orders) => {
            // 全てのレーンをクリア
            Object.values(lanes).forEach(lane => lane.innerHTML = '');

            // 注文を正しいレーンに配置
            orders.forEach(order => {
                const ticketEl = createTicketElement(order);
                lanes[order.status].prepend(ticketEl);
            });
        };

        const fetchAndUpdate = async () => {
            try {
                const activeOrders = await fetchActiveOrders();
                updateView(activeOrders);
            } catch (e) {
                console.error("Failed to fetch active orders:", e);
            }
        };

        // --- Event Listener for status changes ---
        document.querySelector('.kds-container').addEventListener('click', async (e) => {
            const ticket = e.target.closest('.ticket');
            if (!ticket) return;
            const orderId = ticket.dataset.id;
            let newStatus = '';
            if (e.target.classList.contains('btn-cook')) newStatus = 'cooking';
            else if (e.target.classList.contains('btn-ready')) newStatus = 'ready';

            if (newStatus) {
                await updateOrderStatus(orderId, newStatus);
                await fetchAndUpdate(); // 状態変更後、即座に画面を更新
            }
        });

        // --- Initial Load & Polling ---
        await fetchAndUpdate(); // 初回読み込み
        setInterval(fetchAndUpdate, 5000); // 5秒ごとに更新
    }
};