// main.js（最終完全修正版）

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
        match = { route: routes[0], isMatch: true };
        history.pushState(null, null, "/");
    }

    if (currentView && typeof currentView.destroy === 'function') {
        currentView.destroy();
    }

    const view = new match.route.view(getParams(match));
    currentView = view;

    // view.getHtml() を使って HTML を取得して描画
    document.querySelector("#app").innerHTML = await view.getHtml();

    if (typeof view.afterRender === 'function') {
        view.afterRender();
    }
};

const navigateTo = url => {
    history.pushState(null, null, url);
    router();
};

const pathToRegex = path =>
    new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");

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