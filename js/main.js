// main.js (最終修正版)

import { Admin } from './js/views/Admin.js';
import { Cashier } from './js/views/Cashier.js';
import { CustomerDisplay } from './js/views/CustomerDisplay.js';
import { KDS } from './js/views/KDS.js';
import { Login } from './js/views/Login.js';
import { Projector } from './js/views/Projector.js';
import { Results } from './js/views/Results.js';
import * as api from './js/api.js';

// APIをグローバルスコープで利用可能にする
window.api = api;

let currentView = null;

const router = async () => {
    const routes = [
        { path: "/", view: Login },
        { path: "/login", view: Login },
        { path: "/cashier/:id", view: Cashier },
        { path: "/kitchen", view: KDS },
        { path: "/display/:id", view: CustomerDisplay },
        { path: "/projector", view: Projector },
        { path: "/admin", view: Admin },
        { path: "/results", view: Results }
    ];

    const potentialMatches = routes.map(route => {
        return {
            route: route,
            isMatch: location.pathname === route.path || (route.path.includes(":") && location.pathname.match(pathToRegex(route.path)))
        };
    });

    let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);

    if (!match) {
        match = { route: routes[0], isMatch: true }; // Not found, redirect to login
        history.pushState(null, null, "/");
    }
    
    // 前のビューのクリーンアップ処理を呼び出す
    if (currentView && typeof currentView.destroy === 'function') {
        currentView.destroy();
    }

    const view = new match.route.view(getParams(match));
    currentView = view; // 現在のビューを保持

    // ★★★ エラー修正箇所 ★★★
    // `view.render()`ではなく、正しく`view.getHtml()`を呼び出す
    document.querySelector("#app").innerHTML = await view.getHtml();
    
    // afterRenderはDOM描画後に呼び出す
    if (typeof view.afterRender === 'function') {
        view.afterRender();
    }
};

const navigateTo = url => {
    history.pushState(null, null, url);
    router();
};

const pathToRegex = path => new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");

const getParams = match => {
    if (!match.route.path.includes(":")) return {};
    const values = location.pathname.match(pathToRegex(match.route.path)).slice(1);
    const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(result => result[1]);
    return Object.fromEntries(keys.map((key, i) => [key, values[i]]));
};


window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        if (e.target.matches("[data-link]")) {
            e.preventDefault();
            navigateTo(e.target.href);
        }
    });
    router();
});