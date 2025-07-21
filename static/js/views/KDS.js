import { updateOrderStatus, fetchActiveOrders } from '../api.js';
import { socket } from '../socket.js';

export const KDS = {
    render: async () => `
        <div class="kds-container">
            <div class="kds-lane" id="pending"><div class="kds-header">受注</div><div class="kds-tickets"></div></div>
            <div class="kds-lane" id="cooking"><div class="kds-header">調理中</div><div class="kds-tickets"></div></div>
            <div class="kds-lane" id="ready"><div class="kds-header">完成</div><div class="kds-tickets"></div></div>
        </div>
    `,
    after_render: async () => {
        const createTicketElement = (order) => {
            const ticket = document.createElement('div');
            ticket.className = 'ticket';
            ticket.dataset.id = order.id;
            const itemsHtml = order.items.map(item => `<li>${item.name} x ${item.quantity}</li>`).join('');
            ticket.innerHTML = `<div class="ticket-header">注文 #${order.id}</div><ul>${itemsHtml}</ul><div class="ticket-action"></div>`;
            return ticket;
        };
        
        const moveTicket = (orderId, newStatus) => {
            const ticket = document.querySelector(`.ticket[data-id='${orderId}']`);
            if (!ticket) return;
            document.querySelector(`#${newStatus} .kds-tickets`).prepend(ticket);
            const actionDiv = ticket.querySelector('.ticket-action');
            if (newStatus === 'pending') actionDiv.innerHTML = '<button class="btn btn-primary btn-cook">調理開始</button>';
            else if (newStatus === 'cooking') actionDiv.innerHTML = '<button class="btn btn-primary btn-ready">完成</button>';
            else if (newStatus === 'ready') actionDiv.innerHTML = '<span>お渡し待ち</span>';
        };

        const initialOrders = await fetchActiveOrders();
        initialOrders.forEach(order => {
            const ticketEl = createTicketElement(order);
            document.querySelector(`#${order.status} .kds-tickets`).prepend(ticketEl);
            moveTicket(order.id, order.status);
        });

        socket.on('new_order', (order) => {
            const ticketEl = createTicketElement(order);
            document.querySelector('#pending .kds-tickets').prepend(ticketEl);
            moveTicket(order.id, 'pending');
        });
        socket.on('status_update', ({ order_id, status }) => moveTicket(order_id, status));

        document.querySelector('.kds-container').addEventListener('click', async (e) => {
            const ticket = e.target.closest('.ticket');
            if (!ticket) return;
            const orderId = ticket.dataset.id;
            let newStatus = '';
            if (e.target.classList.contains('btn-cook')) newStatus = 'cooking';
            else if (e.target.classList.contains('btn-ready')) newStatus = 'ready';
            if (newStatus) await updateOrderStatus(orderId, newStatus);
        });
    }
};