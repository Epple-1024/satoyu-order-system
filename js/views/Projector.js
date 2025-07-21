import { fetchActiveOrders } from '../api.js';
import { getSocket } from '../socket.js'; // socketからgetSocketに変更

export const Projector = {
    render: async () => `
        <audio id="ready-sound" src="/static/sounds/ready.mp3" preload="auto"></audio>
        <audio id="bgm-sound" src="/static/sounds/bgm.mp3" preload="auto" loop></audio>
        
        <div class="split-container">
            <div class="status-panel">
                <div class="main-container">
                    <div id="status-board" class="status-board">
                        <div id="preparing-section" class="status-section">
                            <div class="section-header">準備中 <span class="en">PREPARING</span></div>
                            <div id="preparing-grid" class="number-grid"></div>
                        </div>
                        <div id="ready-section" class="status-section">
                            <div class="section-header">お渡しできます <span class="en">READY</span></div>
                            <div id="ready-grid" class="number-grid"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="movie-panel">
                <video src="/static/videos/ad.mov" autoplay loop muted playsinline></video>
            </div>
        </div>
    `,
    after_render: async () => {
        const socket = getSocket(); // ここで初めてWebSocket接続を確立

        const preparingGrid = document.getElementById('preparing-grid');
        const readyGrid = document.getElementById('ready-grid');
        const readySound = document.getElementById('ready-sound');
        const bgmSound = document.getElementById('bgm-sound');

        document.body.addEventListener('click', () => {
            if (bgmSound.paused) {
                bgmSound.play().catch(e => console.warn("BGM play failed:", e));
            }
        }, { once: true });

        const createNumberTile = (orderId, isLucky = false) => {
            const tile = document.createElement('div');
            tile.classList.add('number-tile');
            if (isLucky) {
                tile.classList.add('lucky');
            }
            tile.textContent = orderId;
            tile.dataset.id = orderId;
            return tile;
        };
        
        const addTile = (grid, tile, animationClass) => {
            tile.classList.add(animationClass);
            grid.prepend(tile);
        };

        const removeTile = (tile, animationClass) => {
            tile.classList.add(animationClass);
            tile.addEventListener('animationend', () => tile.remove(), { once: true });
        };

        const moveToReady = (order) => {
            const tileToMove = preparingGrid.querySelector(`[data-id='${order.id}']`);
            if (!tileToMove) return;

            removeTile(tileToMove, 'slide-up-out');
            
            tileToMove.addEventListener('animationend', () => {
                const newTile = createNumberTile(order.id, order.is_lucky);
                newTile.classList.add('ready');
                addTile(readyGrid, newTile, 'slide-up-in');
                
                readySound.currentTime = 0;
                readySound.play().catch(e => console.warn("Sound play failed:", e));
            }, { once: true });
        };

        socket.on('new_order', (order) => {
            const existingTile = preparingGrid.querySelector(`[data-id='${order.id}']`);
            if (existingTile) return;
            const newTile = createNumberTile(order.id);
            addTile(preparingGrid, newTile, 'slide-up-in');
        });

        socket.on('status_update', (order) => {
            if (order.status === 'ready') {
                moveToReady(order);
            }
        });

        try {
            const activeOrders = await fetchActiveOrders();
            activeOrders.forEach(order => {
                const tile = createNumberTile(order.id, order.is_lucky);
                if (order.status === 'pending' || order.status === 'cooking') {
                    preparingGrid.appendChild(tile);
                } else if (order.status === 'ready') {
                    tile.classList.add('ready');
                    readyGrid.appendChild(tile);
                }
            });
        } catch (e) {
            console.error("Failed to load initial orders:", e);
        }
    }
};