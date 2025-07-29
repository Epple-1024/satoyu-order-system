// js/views/Login.js (プロジェクターボタン追加版)
import AbstractView from "./AbstractView.js";

export const Login = class extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("ログイン");
    }

    async getHtml() {
        return `
            <div class="login-container">
                <div class="login-card">
                    <h1>SATOYU</h1>
                    <p>- Café & Puzzle Lounge</p>
                    
                    <div class="form-group">
                        <label for="role-select">役割を選択</label>
                        <select id="role-select" class="form-control">
                            <option value="cashier" selected>レジ</option>
                            <option value="admin">管理</option>
                            <option value="kitchen">厨房</option>
                        </select>
                    </div>

                    <div class="form-group" id="pin-group">
                        <label for="pin-input">PINコード</label>
                        <input type="password" id="pin-input" class="form-control" placeholder="4桁のPINを入力" maxlength="4" inputmode="numeric">
                    </div>

                    <button id="login-btn" class="btn btn-primary" style="width: 100%; margin-bottom: 12px;">ログイン</button>
                    
                    <a href="/views/Projector.js" class="btn btn-secondary" style="width: 100%;" data-link>プロジェクター画面へ</a>
                    
                    <p id="login-error" class="error-message" style="margin-top: 16px;"></p>
                </div>
            </div>
        `;
    }

    afterRender() {
        const roleSelect = document.getElementById('role-select');
        const pinGroup = document.getElementById('pin-group');
        const pinInput = document.getElementById('pin-input');
        const loginBtn = document.getElementById('login-btn');
        const errorMessage = document.getElementById('login-error');

        // 「厨房」が選択されたらPIN入力を非表示にする
        roleSelect.addEventListener('change', () => {
            if (roleSelect.value === 'kitchen') {
                pinGroup.style.display = 'none';
            } else {
                pinGroup.style.display = 'block';
            }
        });

        const handleLogin = async () => {
            const selectedRole = roleSelect.value;
            const pin = pinInput.value;
            errorMessage.textContent = '';
            
            if (selectedRole === 'kitchen') {
                window.location.href = '/kitchen';
                return;
            }

            if (pin.length !== 4) {
                 errorMessage.textContent = 'PINは4桁で入力してください。';
                 return;
            }

            try {
                const result = await window.api.login(selectedRole, pin);
                if (result) {
                    localStorage.setItem('user_role', result.role);
                    if(result.role === 'admin') {
                        window.location.href = '/admin';
                    } else {
                        const registerId = localStorage.getItem('register_id') || 1;
                        window.location.href = `/cashier/${registerId}`;
                    }
                }
            } catch (error) {
                errorMessage.textContent = '役割またはPINが正しくありません。';
                pinInput.value = '';
            }
        };

        loginBtn.addEventListener('click', handleLogin);
        
        // Enterキーでもログインできるようにする
        pinInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                handleLogin();
            }
        });
    }
}