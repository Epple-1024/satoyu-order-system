// static/js/main.js (最小構成テスト用)
import { Login } from './views/Login.js';

// ルートをログイン画面のみに限定
const routes = {
    '/': Login,
};

const router = async () => {
    const app = document.getElementById('app');
    const request = location.hash.slice(1).toLowerCase() || '/';
    const page = routes[request] || { render: () => `<h1>404 Not Found</h1>`, after_render: () => {} };

    try {
        app.innerHTML = await page.render();
        await page.after_render();
        console.log("Router successfully rendered page:", request);
    } catch (e) {
        console.error("Error during render:", e);
        app.innerHTML = `<h1>Application Error</h1><p>${e.message}</p>`;
    }
};

window.addEventListener('hashchange', router);
window.addEventListener('load', router);