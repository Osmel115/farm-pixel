const tg = window.Telegram.WebApp;
tg.expand();

let userData = {
    balance: 0.0000,
    daily_harvests_left: 10,
    plots_unlocked: 1
};

let userPlots = [];
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
            const plotData = userPlots.find(p => p.plot_index === i);
            let statusText = "Vacía";
            let icon = "🌱";

            if (plotData && plotData.seeds) {
                const now = new Date();
                const readyAt = new Date(plotData.ready_at);
                if (readyAt <= now) {
                    statusText = "✨ Cosechar!";
                    icon = "🌾";
                } else {
                    const secondsLeft = Math.ceil((readyAt - now) / 1000);
                    statusText = `⏳ ${secondsLeft}s`;
                    icon = "🌱";
                }
            }

            div.innerHTML = `<div class="plant-icon">${icon}</div><span>Parcela ${i}</span><div class="status">${statusText}</div>`;
            div.onclick = () => onPlotClick(i, plotData);
        }

        grid.appendChild(div);
    }
}

async function onPlotClick(plotIndex, plotData) {
    if (!plotData || !plotData.seeds) return;

    const now = new Date();
    const readyAt = new Date(plotData.ready_at);

    if (readyAt <= now) {
        if (userData.daily_harvests_left <= 0) {
            tg.showAlert("¡No te quedan cosechas por hoy! Vuelve mañana.");
            return;
        }

        try {
            const res = await fetch('/api/plot/harvest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-telegram-init-data': tg.initData || ''
                },
                body: JSON.stringify({ plot_index: plotIndex })
            });

            const data = await res.json();
            if (res.ok) {
                userData = data.user;
                document.getElementById('user-balance').innerText = parseFloat(userData.balance).toFixed(4);
                document.getElementById('user-harvests').innerText = `${userData.daily_harvests_left}/10`;
                
                const idx = userPlots.findIndex(p => p.plot_index === plotIndex);
                if (idx !== -1) userPlots[idx] = data.plot;

                tg.HapticFeedback.notificationOccurred('success');
                renderPlots();
            } else {
                tg.showAlert(data.error || "No se pudo cosechar.");
            }
        } catch (err) {
            tg.showAlert("Error de conexión al cosechar.");
        }
    } else {
        tg.showAlert("La planta aún está creciendo. ¡Espera un momento!");
    }
}

async function initGame() {
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
                userPlots = data.plots || [];
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

setInterval(renderPlots, 1000);

initGame();
            
                    
