const tg = window.Telegram.WebApp;
tg.expand();

let userData = {
    balance: 0.0000,
    daily_harvests_left: 10,
    plots_unlocked: 1
};

const plotCosts = [0, 0.05, 0.1, 0.25, 0.5, 1, 5, 10, 25, 50];

function renderPlots() {
    const grid = document.getElementById('plots-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (let i = 1; i <= 10; i++) {
        const isUnlocked = i <= userData.plots_unlocked;
        const div = document.createElement('div');
        div.className = `plot ${isUnlocked ? '' : 'locked'}`;

        if (!isUnlocked) {
            div.innerHTML = `<span>🔒 Parcela ${i}</span><div class="status">${plotCosts[i-1]} TON</div>`;
        } else {
            div.innerHTML = `<div class="plant-icon">🌱</div><span>Parcela ${i}</span><div class="status">Brote de Luz</div>`;
        }

        grid.appendChild(div);
    }
}

async function initGame() {
    // Dibujamos las parcelas base mientras sincroniza
    renderPlots();

    try {
        const response = await fetch('/api/user/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-telegram-init-data': tg.initData || ''
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.user) {
                userData = data.user;
                document.getElementById('user-balance').innerText = parseFloat(userData.balance).toFixed(4);
                document.getElementById('user-harvests').innerText = `${userData.daily_harvests_left}/10`;
                renderPlots();
            }
        }
    } catch (err) {
        console.log("Modo visual activo");
    }
}

function closeElf() {
    const elf = document.getElementById('elf-guide');
    if (elf) elf.style.display = 'none';
}

initGame();
            
