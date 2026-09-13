const tg = window.Telegram.WebApp;
tg.expand();

let userData = null;

async function initGame() {
    const response = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-telegram-init-data': tg.initData
        }
    });

    const data = await response.json();
    if (data.user) {
        userData = data.user;
        document.getElementById('user-balance').innerText = parseFloat(userData.balance).toFixed(4);
        document.getElementById('user-harvests').innerText = `${userData.daily_harvests_left}/10`;
        renderPlots();
    }
}

function renderPlots() {
    const grid = document.getElementById('plots-grid');
    grid.innerHTML = '';

    const plotCosts = [0, 0.05, 0.1, 0.25, 0.5, 1, 5, 10, 25, 50];

    for (let i = 1; i <= 10; i++) {
        const isUnlocked = i <= userData.plots_unlocked;
        const div = document.createElement('div');
        div.className = `plot ${isUnlocked ? '' : 'locked'}`;

        if (!isUnlocked) {
            div.innerHTML = `🔒<span>Parcela ${i}</span><div class="status">${plotCosts[i-1]} TON</div>`;
        } else {
            div.innerHTML = `<div class="plant-icon">🌱</div><span>Parcela ${i}</span><div class="status">Listo</div>`;
        }

        grid.appendChild(div);
    }
}

function closeElf() {
    document.getElementById('elf-guide').style.display = 'none';
}

initGame();
  
