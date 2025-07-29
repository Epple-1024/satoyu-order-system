// js/views/Login.js (最終確定版・完全版)
import AbstractView from "./AbstractView.js";

export class Login extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("ログイン");
    }

    async getHtml() {
        return `
            <div class="login-container">
                <div class="login-card">
                    <h1>SATOYU</h1>
                    <p>Café & Puzzle Lounge</p>
                    <div class="role-selector">
                        <button class="role-btn active" data-role="cashier">レジ</button>
                        <button class="role-btn" data-role="admin">管理</button>
                        <button class="role-btn" data-role="kitchen">厨房</button>
                    </div>
                    <div class="pin-pad-container">
                        <input type="password" id="pin-input" class="form-control" readonly placeholder="----" style="text-align: center; font-size: 24px; letter-spacing: 8px;">
                        <div class="pin-pad">
                            <button class="pin-btn">1</button><button class="pin-btn">2</button><button class="pin-btn">3</button>
                            <button class="pin-btn">4</button><button class="pin-btn">5</button><button class="pin-btn">6</button>
                            <button class="pin-btn">7</button><button class="pin-btn">8</button><button class="pin-btn">9</button>
                            <button class="pin-btn clear">C</button><button class="pin-btn">0</button><button class="pin-btn-enter">✓</button>
                        </div>
                    </div>
                    <p id="login-error" class="error-message"></p>
                </div>
            </div>
        `;
    }

    afterRender() {
        let selectedRole = 'cashier';
        let pin = '';
        const pinInput = document.getElementById('pin-input');
        const errorMessage = document.getElementById('login-error');

        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.role-btn.active').classList.remove('active');
                btn.classList.add('active');
                selectedRole = btn.dataset.role;
            });
        });

        document.querySelectorAll('.pin-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                errorMessage.textContent = '';
                if (btn.classList.contains('clear')) {
                    pin = '';
                } else if (pin.length < 4) {
                    pin += btn.textContent;
                }
                pinInput.value = '•'.repeat(pin.length);
            });
        });
        
        document.querySelector('.pin-btn-enter').addEventListener('click', async () => {
            if (pin.length < 4 && !['kitchen'].includes(selectedRole)) {
                 errorMessage.textContent = 'PINは4桁で入力してください。';
                 return;
            }
            
            if (selectedRole === 'kitchen') {
                window.location.href = '/kitchen';
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
                pin = '';
                pinInput.value = '';
            }
        });
    }
}