import { Login } from './views/Login.js';
import { Cashier } from './views/Cashier.js';
import { KDS } from './views/KDS.js';
import { Admin } from './views/Admin.js';
import { Projector } from './views/Projector.js';
import { Results } from './views/Results.js';
import { Dashboard } from './views/Dashboard.js';
import { CustomerDisplay } from './views/CustomerDisplay.js';

const routes = {
    '/': Login,
    '/cashier': Cashier,
    '/kitchen': KDS,
    '/admin': Admin,
    '/projector': Projector,
    '/results': Results,
    '/dashboard': Dashboard,
    '/customer-display': CustomerDisplay
};

const router = async () => {
    const app = document.getElementById('app');
    const request = location.hash.slice(1).toLowerCase() || '/';
    const page = routes[request] || { 
        render: () => `<h1>404 Not Found</h1>`, 
        after_render: () => {} 
    };
    
    try {
        app.innerHTML = await page.render();
        await page.after_render();
    } catch (e) {
        console.error("Error rendering page:", e);
        app.innerHTML = `<h1>Application Error</h1><p>ページの描画中にエラーが発生しました。</p>`;
    }
};

window.addEventListener('hashchange', router);
window.addEventListener('load', router);