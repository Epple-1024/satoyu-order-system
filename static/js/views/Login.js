// static/js/views/Login.js
import { postLogin } from '../api.js';

export const Login = {
    render: () => `
        <div class="login-card">
            <h2>SATOYU – Café & Puzzle Lounge</h2>
            <form id="login-form">
                <div class="form-group">
                    <label for="role-select">役割を選択</label>
                    <select id="role-select" name="role" class="form-control">
                        <option value="cashier">キャッシャー</option>
                        <option value="kitchen">キッチン</option>
                        <option value="admin">管理者</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="pin-input">PINコード</label>
                    <input type="password" id="pin-input" name="pin" class="form-control" inputmode="numeric" pattern="[0-9]*" maxlength="4" required>
                </div>
                <button type="submit" class="btn btn-primary">ログイン</button>
            </form>
        </div>
    `,
    after_render: () => {
        const form = document.getElementById('login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const role = form.querySelector('#role-select').value;
            const pin = form.querySelector('#pin-input').value;
            try {
                const result = await postLogin(role, pin);
                if (result.success) {
                    // 役割に応じてリダイレクト
                    const redirectMap = {
                        admin: '#/admin',
                        cashier: '#/cashier',
                        kitchen: '#/kitchen'
                    };
                    window.location.href = redirectMap[role] || '/';
                } else {
                    alert('PINコードが間違っています。');
                }
            } catch (err) {
                alert('ログインに失敗しました。');
                console.error(err);
            }
        });
    }
};