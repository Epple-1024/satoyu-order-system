import AbstractView from "./AbstractView.js";
import { fetchActiveOrders } from '../api.js';

export class Projector extends AbstractView {
    async render() {
        return `
        <audio id="ready-sound" src="/assets/sounds/ready.mp3" preload="auto"></audio>
        <audio id="bgm-sound" src="/assets/sounds/bgm.mp3" preload="auto" loop></audio>
        
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
                <video src="/assets/videos/ad.mov" autoplay loop muted playsinline></video>
            </div>
        </div>
    `;
    }

    async after_render() {
        const preparingGrid = document.getElementById('preparing-grid');
        const readyGrid = document.getElementById('ready-grid');
        const readySound = document.getElementById('ready-sound');
        const bgmSound = document.getElementById('bgm-sound');

        let displayedReadyIds = new Set();

        document.body.addEventListener('click', () => {
            if (bgmSound.paused) {
                bgmSound.play().catch(e => console.warn("BGM play failed:", e));
            }
        }, { once: true });

        const createNumberTile = (orderId, isLucky = false) => {
            const tile = document.createElement('div');
            tile.classList.add('number-tile');
            if (isLucky) tile.classList.add('lucky');
            tile.textContent = orderId;
            tile.dataset.id = orderId;
            return tile;
        };
        
        const updateView = (orders) => {
            const preparingOrders = orders.filter(o => o.status === 'pending' || o.status === 'cooking');
            const readyOrders = orders.filter(o => o.status === 'ready');
            
            preparingGrid.innerHTML = '';
            preparingOrders.forEach(order => {
                const tile = createNumberTile(order.id, order.is_lucky);
                preparingGrid.appendChild(tile);
            });

            readyGrid.innerHTML = '';
            readyOrders.forEach(order => {
                const tile = createNumberTile(order.id, order.is_lucky);
                tile.classList.add('ready');
                readyGrid.appendChild(tile);
                // 新しくReadyになった注文かチェックし、サウンドを再生
                if (!displayedReadyIds.has(order.id)) {
                    readySound.currentTime = 0;
                    readySound.play().catch(e => console.warn("Sound play failed:", e));
                }
            });

            // 表示済みIDセットを更新
            displayedReadyIds = new Set(readyOrders.map(o => o.id));
        };
        
        const fetchAndUpdate = async () => {
            try {
                const activeOrders = await fetchActiveOrders();
                updateView(activeOrders);
            } catch (e) {
                console.error("Failed to fetch active orders:", e);
            }
        };

        // --- Initial Load & Polling ---
        await fetchAndUpdate();
        setInterval(fetchAndUpdate, 5000); // 5秒ごとに更新
    }
}