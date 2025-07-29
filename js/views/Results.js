// js/views/Results.js (最終確定版・完全版)
import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("営業結果");
    }

    async getHtml() {
        // Use the new styles from your CSS
        return `
            <div class="results-container">
                <div class="results-content">
                    <h1 class="results-item results-hidden">本日の営業結果</h1>
                    <p class="results-item results-hidden" style="transition-delay: 0.2s;">SATOYU – Café & Puzzle Lounge</p>
                    <div id="summary-cards" class="summary-grid results-item results-hidden" style="transition-delay: 0.4s;">
                        </div>
                    <div id="ranking-section" class="ranking-section results-item results-hidden" style="transition-delay: 0.6s;">
                        </div>
                    <p class="results-item results-hidden" style="transition-delay: 0.8s; margin-top: 40px;">
                        文化祭にご来場いただき、誠にありがとうございました！
                    </p>
                </div>
            </div>
        `;
    }

    async afterRender() {
        try {
            const results = await window.api.getDailyResults();
            this.renderResults(results);
        } catch (error) {
            console.error("営業結果の取得に失敗しました:", error);
            const contentEl = document.querySelector('.results-content');
            contentEl.innerHTML = `<p class="error-message">結果の取得に失敗しました。管理者にご確認ください。</p>`;
        }
    }

    renderResults(data) {
        const summaryContainer = document.getElementById('summary-cards');
        const rankingContainer = document.getElementById('ranking-section');

        const rankingHtml = data.product_ranking.map((item, index) => `
            <tr>
                <td><span class="rank-badge rank-${index + 1}">${index + 1}</span></td>
                <td>${item.name}</td>
                <td>${item.total_quantity}個</td>
                <td>¥${item.total_revenue.toLocaleString()}</td>
            </tr>
        `).join('');

        summaryContainer.innerHTML = `
            <div class="summary-card primary">
                <div class="card-title">最終利益</div>
                <div class="card-value">¥${data.total_profit.toLocaleString()}</div>
            </div>
            <div class="summary-card">
                <div class="card-title">総売上</div>
                <div class="card-value">¥${data.total_sales.toLocaleString()}</div>
            </div>
            <div class="summary-card">
                <div class="card-title">総原価</div>
                <div class="card-value">¥${data.total_cost.toLocaleString()}</div>
            </div>
            <div class="summary-card">
                <div class="card-title">総注文数</div>
                <div class="card-value">${data.total_orders}<span>件</span></div>
            </div>
            <div class="summary-card">
                <div class="card-title">総提供品数</div>
                <div class="card-value">${data.total_items}<span>個</span></div>
            </div>
        `;

        rankingContainer.innerHTML = `
            <h2>🏆 人気商品ランキング</h2>
            <table>
                <thead>
                    <tr>
                        <th>順位</th>
                        <th>商品名</th>
                        <th>販売数</th>
                        <th>売上額</th>
                    </tr>
                </thead>
                <tbody>
                    ${rankingHtml || '<tr><td colspan="4">データがありません</td></tr>'}
                </tbody>
            </table>
        `;

        // Trigger animations
        document.querySelectorAll('.results-item').forEach(el => {
            el.classList.remove('results-hidden');
        });
    }
}