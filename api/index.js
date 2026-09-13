const express = require('express');
const cors = require('cors');
const supabase = require('./config/supabase');
const authMiddleware = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Sincronización de usuario al entrar
app.post('/api/user/sync', authMiddleware, async (req, res) => {
    const { id: telegram_id, username } = req.telegramUser;
    const referrerId = req.startParam ? parseInt(req.startParam) : null;

    let { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegram_id)
        .single();

    if (!user) {
        let validReferrer = null;
        if (referrerId && referrerId !== telegram_id) {
            const { data: refUser } = await supabase
                .from('users')
                .select('telegram_id')
                .eq('telegram_id', referrerId)
                .single();
            if (refUser) validReferrer = refUser.telegram_id;
        }

        const { data: newUser } = await supabase
            .from('users')
            .insert([{ telegram_id, username, referred_by: validReferrer }])
            .select()
            .single();

        user = newUser;

        // Regalo inicial: Parcela 1 lista para cosechar inmediatamente
        await supabase.from('user_plots').insert([{
            telegram_id,
            plot_index: 1,
            seed_id: 1,
            planted_at: new Date(),
            ready_at: new Date()
        }]);
    }

    // Reset diario de cosechas si pasaron 24 horas
    const now = new Date();
    const lastReset = new Date(user.last_harvest_reset);
    if (now - lastReset > 86400000) {
        const { data: updatedUser } = await supabase
            .from('users')
            .update({ daily_harvests_left: 10, last_harvest_reset: now.toISOString() })
            .eq('telegram_id', telegram_id)
            .select()
            .single();
        user = updatedUser;
    }

    // Obtener las parcelas del usuario
    const { data: plots } = await supabase
        .from('user_plots')
        .select('*, seeds(*)')
        .eq('telegram_id', telegram_id);

    res.json({ user, plots: plots || [] });
});

// 2. Endpoint para Cosechar una Parcela
app.post('/api/plot/harvest', authMiddleware, async (req, res) => {
    const { id: telegram_id } = req.telegramUser;
    const { plot_index } = req.body;

    // Buscar usuario
    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegram_id)
        .single();

    if (!user || user.daily_harvests_left <= 0) {
        return res.status(400).json({ error: 'No te quedan cosechas diarias disponibles' });
    }

    // Buscar la parcela
    const { data: plot } = await supabase
        .from('user_plots')
        .select('*, seeds(*)')
        .eq('telegram_id', telegram_id)
        .eq('plot_index', plot_index)
        .single();

    if (!plot || !plot.seed_id) {
        return res.status(400).json({ error: 'No hay cultivos en esta parcela' });
    }

    const now = new Date();
    if (new Date(plot.ready_at) > now) {
        return res.status(400).json({ error: 'El cultivo aún no está listo' });
    }

    const reward = parseFloat(plot.seeds.harvest_value);
    const newBalance = parseFloat(user.balance) + reward;
    const newHarvests = user.daily_harvests_left - 1;

    // Actualizar balance y cosechas del usuario
    const { data: updatedUser } = await supabase
        .from('users')
        .update({ balance: newBalance, daily_harvests_left: newHarvests })
        .eq('telegram_id', telegram_id)
        .select()
        .single();

    // Re-plantar automáticamente el Brote de Luz para seguir jugando (5 minutos de crecimiento)
    const nextReadyAt = new Date(Date.now() + plot.seeds.growth_time_seconds * 1000);
    const { data: updatedPlot } = await supabase
        .from('user_plots')
        .update({ planted_at: now.toISOString(), ready_at: nextReadyAt.toISOString() })
        .eq('id', plot.id)
        .select('*, seeds(*)')
        .single();

    res.json({ user: updatedUser, plot: updatedPlot });
});

module.exports = app;
         
