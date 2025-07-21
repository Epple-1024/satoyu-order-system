import { fetchDailyResults } from '../api.js';

export const Results = {
    render: async () => `
        <div class="results-container">
            <h1 id="results-title" class="results-item results-hidden"></h1>
            <div id="results-summary" class="results-item results-hidden">
                <div class="summary-item">
                    <h2>総売上</h2>
                    <p><span id="summary-sales">0</span>円</p>
                </div>
                <div class="summary-item">
                    <h2>総利益</h2>
                    <p><span id="summary-profit">0</span>円</p>
                </div>
                <div class="summary-item">
                    <h2>総提供数</h2>
                    <p><span id="summary-orders">0</span></p>
                </div>
            </div>
            <div id="results-ranking" class="results-item results-hidden">
                <h2>人気商品ランキング</h2>
                <ol></ol>
            </div>
            <div id="results-message" class="results-item results-hidden">
                <p>本日もありがとうございました！</p>
            </div>
        </div>
    `,
    after_render: async () => {
        const titleEl = document.getElementById('results-title');
        const summaryEl = document.getElementById('results-summary');
        const rankingEl = document.getElementById('results-ranking');
        const messageEl = document.getElementById('results-message');
        const salesSpan = document.getElementById('summary-sales');
        const profitSpan = document.getElementById('summary-profit');
        const ordersSpan = document.getElementById('summary-orders');
        const rankingOl = rankingEl.querySelector('ol');

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const animateNumber = (element, endValue, duration = 1500) => {
            let start = 0;
            const stepTime = 20;
            const steps = duration / stepTime;
            const increment = endValue / steps;

            const timer = setInterval(() => {
                start += increment;
                if (start >= endValue) {
                    start = endValue;
                    clearInterval(timer);
                }
                element.textContent = Math.floor(start).toLocaleString();
            }, stepTime);
        };

        const reveal = (element) => {
            element.classList.remove('results-hidden');
        };

        try {
            const today = new Date().toISOString().split('T')[0];
            const data = await fetchDailyResults(today);

            titleEl.textContent = `${today} 営業結果`;

            await sleep(1000);
            reveal(titleEl);

            await sleep(1500);
            reveal(summaryEl);
            animateNumber(salesSpan, data.sales);
            animateNumber(profitSpan, data.profit);
            animateNumber(ordersSpan, data.total_orders);

            await sleep(2000);
            rankingOl.innerHTML = data.ranking.map(item => `<li>${item.name} (${item.count}個)</li>`).join('');
            reveal(rankingEl);

            await sleep(2500);
            reveal(messageEl);

        } catch (e) {
            console.error("Failed to load daily results:", e);
            titleEl.textContent = "結果の取得に失敗しました";
            reveal(titleEl);
        }
    }
};