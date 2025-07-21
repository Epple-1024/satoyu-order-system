// static/js/views/Dashboard.js
export const Dashboard = {
    render: async () => `
        <div class="dashboard-card" style="margin:auto;">
            <h3>外部ダッシュボード</h3>
            <p>売上: <span id="dash-sales">---</span>円</p>
            <p>利益: <span id="dash-profit">---</span>円</p>
        </div>
    `,
    after_render: async () => {
        const salesEl = document.getElementById('dash-sales');
        const profitEl = document.getElementById('dash-profit');
        const update = async () => {
            const data = await fetch('/api/status').then(res => res.json()); // VercelのAPIを呼ぶ
            if(data) {
                salesEl.textContent = data.sales.toLocaleString();
                profitEl.textContent = data.profit.toLocaleString();
            }
        };
        update();
        setInterval(update, 60000); // 1分ごとに更新
    }
};