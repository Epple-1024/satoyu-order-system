import { fetchFinancials, postExpense, fetchProducts, postProduct, updateProduct, deleteProduct } from '../api.js';

export const Admin = {
    render: async () => `
        <div class="dashboard-header">
            <h1>管理者ダッシュボード</h1>
            <a href="/" class="btn btn-secondary">ログアウト</a>
        </div>
        <div class="dashboard-grid">
            <div class="dashboard-card" id="financials-card">
                <h3>収益サマリー</h3>
                <p>売上: <span id="summary-sales">---</span>円</p>
                <p>経費: <span id="summary-expenses">---</span>円</p>
                <p class="profit">利益: <span id="summary-profit">---</span>円</p>
            </div>
            <div class="dashboard-card" id="product-card">
                <h3>商品管理</h3>
                <ul id="product-list" class="item-list"></ul>
                <button id="add-product-btn" class="btn btn-primary">商品を追加</button>
            </div>
            <div class="dashboard-card" id="expense-card">
                <h3>経費登録</h3>
                <form id="expense-form" class="form-inline">
                    <input type="text" name="item" class="form-control" placeholder="品名" required>
                    <input type="number" name="amount" class="form-control" placeholder="金額" required>
                    <button type="submit" class="btn btn-primary">登録</button>
                </form>
            </div>
            <div class="dashboard-card">
                <h3>シフト管理</h3>
                <a href="#/shifts" class="btn btn-secondary">シフトを編集</a>
            </div>
            <div class="dashboard-card"><h3>表示画面</h3><a href="#/projector" class="btn">プロジェクター</a> <a href="#/results" class="btn">リザルト</a></div>
        </div>
        <div id="product-modal" class="modal-backdrop" style="display:none;">
            <div class="modal">
                <h3 id="product-modal-title"></h3>
                <form id="product-form">
                    <input type="hidden" name="id">
                    <div class="form-group"><label>商品名</label><input type="text" name="name" class="form-control" required></div>
                    <div class="form-group"><label>価格</label><input type="number" name="price" class="form-control" required></div>
                    <div class="form-group"><label>カテゴリ</label><input type="text" name="category" class="form-control" required></div>
                    <div class="form-group"><label>原価</label><input type="number" name="cost_per_item" class="form-control" required></div>
                    <div class="modal-actions">
                        <button type="button" id="modal-cancel-btn" class="btn btn-secondary">キャンセル</button>
                        <button type="submit" class="btn btn-primary">保存</button>
                    </div>
                </form>
            </div>
        </div>
    `,
    after_render: async () => {
        const financialsCard = document.getElementById('financials-card');
        const expenseForm = document.getElementById('expense-form');
        const productList = document.getElementById('product-list');
        const addProductBtn = document.getElementById('add-product-btn');
        const productModal = document.getElementById('product-modal');
        const productForm = document.getElementById('product-form');
        const productModalTitle = document.getElementById('product-modal-title');
        const cancelBtn = document.getElementById('modal-cancel-btn');

        let products = [];

        const renderFinancials = async () => {
            const data = await fetchFinancials();
            financialsCard.innerHTML = `
                <h3>収益サマリー</h3>
                <p>売上: ${data.sales.toLocaleString()}円</p>
                <p>経費: ${data.expenses.toLocaleString()}円</p>
                <p class="profit">利益: ${data.profit.toLocaleString()}円</p>`;
        };

        const openProductModal = (product = null) => {
            productModalTitle.textContent = product ? '商品を編集' : '商品を追加';
            productForm.reset();
            if (product) {
                for (const key in product) {
                    if (productForm.elements[key]) {
                        productForm.elements[key].value = product[key];
                    }
                }
            }
            productModal.style.display = 'flex';
        };
        const closeProductModal = () => { productModal.style.display = 'none'; };

        const renderProducts = () => {
            productList.innerHTML = products.map(p => `
                <li class="list-item">
                    <span>${p.name} (${p.price}円)</span>
                    <div>
                        <button class="btn-sm btn-edit" data-id="${p.id}">編集</button>
                        <button class="btn-sm btn-delete" data-id="${p.id}">削除</button>
                    </div>
                </li>`).join('');
        };

        const refreshProducts = async () => {
            products = await fetchProducts();
            renderProducts();
        };

        expenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(expenseForm);
            const expenseData = Object.fromEntries(formData.entries());
            await postExpense(expenseData);
            e.target.reset();
            await renderFinancials();
        });

        addProductBtn.addEventListener('click', () => openProductModal());
        cancelBtn.addEventListener('click', closeProductModal);

        productList.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            if (e.target.classList.contains('btn-edit')) {
                openProductModal(products.find(p => p.id == id));
            }
            if (e.target.classList.contains('btn-delete')) {
                if (confirm('本当にこの商品を削除しますか？')) {
                    await deleteProduct(id);
                    await refreshProducts();
                }
            }
        });

        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(productForm);
            const productData = Object.fromEntries(formData.entries());
            const id = productData.id;
            delete productData.id;

            if (id) {
                await updateProduct(id, productData);
            } else {
                await postProduct(productData);
            }
            closeProductModal();
            await refreshProducts();
        });

        await renderFinancials();
        setInterval(renderFinancials, 15000);
        await refreshProducts();
    }
};