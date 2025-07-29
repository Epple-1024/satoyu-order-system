// js/views/Admin.js (クラスベース対応 最終確定版)
import AbstractView from "./AbstractView.js";

export const Admin = class extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("管理者ダッシュボード");
        this.products = [];
    }

    async getHtml() {
        return `
            <div class="container">
                <div class="dashboard-header">
                    <h1>管理者ダッシュボード</h1>
                    <a href="/" data-link class="btn btn-secondary">ログアウト</a>
                </div>
                <div class="dashboard-grid">
                    <div class="dashboard-card" id="financials-card">
                        <h3>収益サマリー</h3>
                        <p>売上: <span id="summary-sales">---</span>円</p>
                        <p>経費(原価): <span id="summary-expenses">---</span>円</p>
                        <p class="profit">利益: <span id="summary-profit">---</span>円</p>
                    </div>
                    <div class="dashboard-card" id="product-card">
                        <h3>商品管理</h3>
                        <ul id="product-list" class="item-list"></ul>
                        <button id="add-product-btn" class="btn btn-primary">商品を追加</button>
                    </div>
                    <div class="dashboard-card" id="expense-card">
                        <h3>経費登録</h3>
                        <form id="expense-form">
                            <div class="form-group">
                                <input type="text" name="item" class="form-control" placeholder="品名" required>
                            </div>
                            <div class="form-group">
                                <input type="number" name="amount" class="form-control" placeholder="金額" required>
                            </div>
                            <button type="submit" class="btn btn-primary">登録</button>
                        </form>
                    </div>
                </div>
            </div>

            <div id="product-modal" class="modal-backdrop" style="display: none;">
                <div class="modal">
                    <h2 id="modal-title">商品を追加</h2>
                    <form id="product-form">
                        <input type="hidden" name="id">
                        <div class="form-group">
                            <label for="name">商品名</label>
                            <input type="text" name="name" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="price">価格</label>
                            <input type="number" name="price" class="form-control" required>
                        </div>
                         <div class="form-group">
                            <label for="cost_per_item">原価</label>
                            <input type="number" name="cost_per_item" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="category">カテゴリー</label>
                            <input type="text" name="category" class="form-control" required>
                        </div>
                        <div class="modal-actions">
                            <button type="button" id="cancel-btn" class="btn btn-secondary">キャンセル</button>
                            <button type="submit" class="btn btn-primary">保存</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    async afterRender() {
        this.renderFinancials();
        this.refreshProducts();

        // イベントリスナーの設定
        const expenseForm = document.getElementById('expense-form');
        expenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(expenseForm);
            const expenseData = {
                item: formData.get('item'),
                amount: parseInt(formData.get('amount'))
            };
            await window.api.postExpense(expenseData);
            e.target.reset();
            await this.renderFinancials();
        });

        document.getElementById('add-product-btn').addEventListener('click', () => this.openProductModal());
        document.getElementById('cancel-btn').addEventListener('click', () => this.closeProductModal());
        
        document.getElementById('product-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const productData = {
                name: formData.get('name'),
                price: parseInt(formData.get('price')),
                cost_per_item: parseInt(formData.get('cost_per_item')),
                category: formData.get('category')
            };
            const id = formData.get('id');

            if (id) {
                await window.api.updateProduct(id, productData);
            } else {
                await window.api.postProduct(productData);
            }
            this.closeProductModal();
            await this.refreshProducts();
        });

        document.getElementById('product-list').addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            if (e.target.classList.contains('btn-edit')) {
                const product = this.products.find(p => p.id == id);
                this.openProductModal(product);
            }
            if (e.target.classList.contains('btn-delete')) {
                if (confirm('本当にこの商品を削除しますか？')) {
                    await window.api.deleteProduct(id);
                    await this.refreshProducts();
                }
            }
        });
    }

    async renderFinancials() {
        const financials = await window.api.fetchFinancials();
        document.getElementById('summary-sales').textContent = financials.sales.toLocaleString();
        document.getElementById('summary-expenses').textContent = financials.expenses.toLocaleString();
        document.getElementById('summary-profit').textContent = financials.profit.toLocaleString();
    }

    async refreshProducts() {
        this.products = await window.api.fetchProducts();
        const productListEl = document.getElementById('product-list');
        productListEl.innerHTML = this.products.map(p => `
            <li class="list-item">
                <span>${p.name} - ¥${p.price} (原価: ¥${p.cost_per_item})</span>
                <div>
                    <button class="btn-edit btn btn-sm" data-id="${p.id}">編集</button>
                    <button class="btn-delete btn btn-sm" data-id="${p.id}">削除</button>
                </div>
            </li>
        `).join('');
    }

    openProductModal(product = null) {
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('product-form');
        const title = document.getElementById('modal-title');
        
        form.reset();
        if (product) {
            title.textContent = '商品を編集';
            form.id.value = product.id;
            form.name.value = product.name;
            form.price.value = product.price;
            form.cost_per_item.value = product.cost_per_item;
            form.category.value = product.category;
        } else {
            title.textContent = '商品を追加';
        }
        modal.style.display = 'flex';
    }

    closeProductModal() {
        document.getElementById('product-modal').style.display = 'none';
    }
}