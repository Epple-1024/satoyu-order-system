// static/js/main.js (最終・完全版)
import { Login } from './views/Login.js';
import { Cashier } from './views/Cashier.js';
import { KDS } from './views/KDS.js';
import { Admin } from './views/Admin.js';
import { Shifts } from './views/Shifts.js';
import { Projector } from './views/Projector.js';
import { Results } from './views/Results.js';
import { Dashboard } from './views/Dashboard.js';

const routes = {
    '/': Login,
    '/cashier': Cashier,
    '/kitchen': KDS,
    '/admin': Admin,
    '/shifts': Shifts,
    '/projector': Projector,
    '/results': Results,
    '/dashboard': Dashboard
};

const router = async () => {
    const app = document.getElementById('app');
    // location.hashからパスを取得 (例: #/cashier -> /cashier)
    const request = location.hash.slice(1).toLowerCase() || '/';
    
    // パスに一致するページコンポーネントを取得
    const page = routes[request] || { 
        render: () => `<h1>404 Not Found</h1>`, 
        after_render: () => {} 
    };
    
    // HTMLを描画し、その後スクリプトを実行
    app.innerHTML = await page.render();
    await page.after_render();
};

// URLのハッシュが変わった時、またはページが読み込まれた時にルーターを実行
window.addEventListener('hashchange', router);
window.addEventListener('load', router);