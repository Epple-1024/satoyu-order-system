import { fetchUsers, fetchShiftAssignments, fetchShiftTemplates, postShiftAssignment } from '../api.js';

export const Shifts = {
    render: async () => `
        <div class="dashboard-header">
            <h1>シフト管理</h1>
            <a href="#/admin" class="btn btn-secondary">ダッシュボードに戻る</a>
        </div>
        <div class="dashboard-card">
            <div class="shift-controls">
                <input type="date" id="shift-date-picker" value="2025-07-21">
                </div>
            <div id="shift-timeline-container">
                <div id="timeline-header"></div>
                <div id="timeline-grid"></div>
            </div>
        </div>

        <div id="assignment-modal" class="modal-backdrop" style="display:none;">
            <div class="modal">
                <h3>シフトを割り当て</h3>
                <form id="assignment-form">
                    <p><strong>スタッフ:</strong> <span id="modal-user-name"></span></p>
                    <input type="hidden" name="user_id">
                    <input type="hidden" name="shift_date">
                    <div class="form-group">
                        <label for="modal-shift-select">シフトを選択</label>
                        <select name="shift_id" id="modal-shift-select" class="form-control" required></select>
                    </div>
                    <div class="modal-actions">
                        <button type="button" id="modal-cancel-btn" class="btn btn-secondary">キャンセル</button>
                        <button type="submit" class="btn btn-primary">割り当て</button>
                    </div>
                </form>
            </div>
        </div>
    `,
    after_render: async () => {
        const timelineGrid = document.getElementById('timeline-grid');
        const timelineHeader = document.getElementById('timeline-header');
        const datePicker = document.getElementById('shift-date-picker');
        const modal = document.getElementById('assignment-modal');
        const modalUserName = document.getElementById('modal-user-name');
        const modalShiftSelect = document.getElementById('modal-shift-select');
        const assignmentForm = document.getElementById('assignment-form');
        const cancelBtn = document.getElementById('modal-cancel-btn');

        let users = [];
        let shiftTemplates = [];

        const renderTimeline = (assignments) => {
            timelineGrid.innerHTML = '';
            timelineHeader.innerHTML = '';

            // タイムラインヘッダー (9:00 - 19:00)
            for (let i = 9; i < 20; i++) {
                const hourEl = document.createElement('div');
                hourEl.className = 'hour-label';
                hourEl.textContent = `${i}:00`;
                timelineHeader.appendChild(hourEl);
            }

            users.forEach(user => {
                const row = document.createElement('div');
                row.className = 'user-row';
                const nameCell = document.createElement('div');
                nameCell.className = 'user-name-cell';
                nameCell.innerHTML = `<span>${user.name}</span><button class="btn assign-btn" data-user-id="${user.id}" data-user-name="${user.name}">+</button>`;
                row.appendChild(nameCell);
                
                const scheduleCell = document.createElement('div');
                scheduleCell.className = 'schedule-cell';
                
                const userAssignments = assignments.filter(a => a.user_name === user.name);
                userAssignments.forEach(a => {
                    const [startHour] = a.start_time.split(':').map(Number);
                    const [endHour] = a.end_time.split(':').map(Number);
                    const shiftBlock = document.createElement('div');
                    shiftBlock.className = 'shift-block';
                    shiftBlock.textContent = a.shift_name;
                    shiftBlock.style.gridColumnStart = startHour - 8; // 9時が1列目
                    shiftBlock.style.gridColumnEnd = endHour - 8;
                    scheduleCell.appendChild(shiftBlock);
                });

                row.appendChild(scheduleCell);
                timelineGrid.appendChild(row);
            });
        };

        const fetchAndRender = async () => {
            const selectedDate = datePicker.value;
            const assignments = await fetchShiftAssignments(selectedDate);
            renderTimeline(assignments);
        };

        const openAssignmentModal = (userId, userName) => {
            modalUserName.textContent = userName;
            assignmentForm.elements.user_id.value = userId;
            assignmentForm.elements.shift_date.value = datePicker.value;
            
            modalShiftSelect.innerHTML = shiftTemplates.map(st => `<option value="${st.id}">${st.name} (${st.start_time}-${st.end_time})</option>`).join('');
            modal.style.display = 'flex';
        };

        const closeAssignmentModal = () => {
            modal.style.display = 'none';
        };

        // --- Event Listeners ---
        datePicker.addEventListener('change', fetchAndRender);
        
        timelineGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('assign-btn')) {
                const userId = e.target.dataset.userId;
                const userName = e.target.dataset.userName;
                openAssignmentModal(userId, userName);
            }
        });
        
        cancelBtn.addEventListener('click', closeAssignmentModal);

        assignmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(assignmentForm);
            const assignmentData = Object.fromEntries(formData.entries());
            try {
                await postShiftAssignment(assignmentData);
                closeAssignmentModal();
                await fetchAndRender();
            } catch(err) {
                alert('シフトの割り当てに失敗しました。');
            }
        });

        // --- Initial Load ---
        [users, shiftTemplates] = await Promise.all([fetchUsers(), fetchShiftTemplates()]);
        await fetchAndRender();
    }
};