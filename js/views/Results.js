import { fetchDailyResults } from '../api.js';

export const Results = {
    render: async () => `
        <div class="results-container">
            <div class="results-controls">
                <div class="date-selector">
                    <label for="day1-date">1日目:</label>
                    <input type="date" id="day1-date" class="form-control" value="2025-07-21">
                    <button id="day1-btn" class="btn">結果表示</button>
                </div>
                <div class="slideshow-controls">
                    <label for="day2-date">2日目:</label>
                    <input type="date" id="day2-date" class="form-control" value="2025-07-22">
                    <label for="interval-input">切替(秒):</label>
                    <input type="number" id="interval-input" class="form-control" value="10" min="3">
                    <button id="slideshow-btn" class="btn btn-primary">2日目/総合スライドショー開始</button>
                </div>
            </div>
            <div id="results-content">
                <h1>日付を選択して結果を表示してください</h1>
            </div>
        </div>
    `,
    after_render: async () => {
        const content = document.getElementById('results-content');
        const day1DateInput = document.getElementById('day1-date');
        const day2DateInput = document.getElementById('day2-date');
        const intervalInput = document.getElementById('interval-input');
        let slideshowInterval = null;

        const animateNumber = (element, endValue) => { /* (アニメーション関数は変更なし) */ };
        
        const renderResults = (title, data) => {
            // アニメーション表示のロジック
            content.innerHTML = `
                <h1 class="results-item results-hidden">${title}</h1>
                <div class="summary-item results-item results-hidden"><h2>総売上</h2><p>${data.sales.toLocaleString()}円</p></div>
                `;
            // フェードインなどの演出
        };

        const stopSlideshow = () => {
            if (slideshowInterval) {
                clearInterval(slideshowInterval);
                slideshowInterval = null;
                document.getElementById('slideshow-btn').textContent = 'スライドショー開始';
            }
        };

        document.getElementById('day1-btn').addEventListener('click', async () => {
            stopSlideshow();
            const day1 = day1DateInput.value;
            if (!day1) { alert('1日目の日付を選択してください。'); return; }
            const data = await fetchDailyResults(day1);
            renderResults(`【${day1}】1日目 営業結果`, data);
        });

        document.getElementById('slideshow-btn').addEventListener('click', async () => {
            if (slideshowInterval) {
                stopSlideshow();
                return;
            }
            
            const day1 = day1DateInput.value;
            const day2 = day2DateInput.value;
            if (!day1 || !day2) { alert('1日目と2日目の両方の日付を選択してください。'); return; }

            const intervalSeconds = parseInt(intervalInput.value, 10);
            document.getElementById('slideshow-btn').textContent = 'スライドショー停止';
            
            const dataDay1 = await fetchDailyResults(day1);
            const dataDay2 = await fetchDailyResults(day2);
            const totalData = {
                sales: dataDay1.sales + dataDay2.sales,
                profit: dataDay1.profit + dataDay2.profit,
                // ...
            };

            let isShowingDay2 = true;
            renderResults(`【${day2}】2日目 営業結果`, dataDay2);

            slideshowInterval = setInterval(() => {
                isShowingDay2 = !isShowingDay2;
                if (isShowingDay2) {
                    renderResults(`【${day2}】2日目 営業結果`, dataDay2);
                } else {
                    renderResults('総合結果 (2日間合計)', totalData);
                }
            }, intervalSeconds * 1000);
        });
    }
};