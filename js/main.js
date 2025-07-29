// js/main.js (最終確定版)
import AbstractView from "./views/AbstractView.js";
import { Admin } from './views/Admin.js';
import { Cashier } from './views/Cashier.js';
import { CustomerDisplay } from './views/CustomerDisplay.js';
import { KDS } from './views/KDS.js';
import { Login } from './views/Login.js';
import { Projector } from './views/Projector.js';
import { Results } from './views/Results.js';
import * as api from './api.js';

// APIをグローバルスコープで利用可能にする
window.api = api;

let currentView = null;

const router = async () => {
    // Shits.jsへのルーティングを削除
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

    const pathToRegex = path => new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");

    const getParams = match => {
        const values = match.result.slice(1);
        const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(result => result[1]);
        return Object.fromEntries(keys.map((key, i) => {
            return [key, values[i]];
        }));
    };

    let match = routes.map(route => {
        return {
            route: route,
            result: location.pathname.match(pathToRegex(route.path))
        };
    }).find(potentialMatch => potentialMatch.result !== null);

    if (!match) {
        match = {
            route: routes[0],
            result: [location.pathname]
        };
        history.pushState(null, null, "/");
    }
    
    // 前のビューのクリーンアップ処理を呼び出す
    if (currentView && typeof currentView.destroy === 'function') {
        currentView.destroy();
    }

    const view = new match.route.view(getParams(match));
    currentView = view;

    document.querySelector("#app").innerHTML = await view.getHtml();
    
    if (typeof view.afterRender === 'function') {
        view.afterRender();
    }
};

const navigateTo = url => {
    history.pushState(null, null, url);
    router();
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