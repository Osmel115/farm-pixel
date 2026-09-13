const crypto = require('crypto');

function verifyTelegramWebAppData(telegramInitData) {
    const urlParams = new URLSearchParams(telegramInitData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    const paramsStr = Array.from(urlParams.entries())
        .map(([key, val]) => `${key}=${val}`)
        .sort()
        .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData')
        .update(process.env.BOT_TOKEN)
        .digest();

    const calculatedHash = crypto.createHmac('sha256', secretKey)
        .update(paramsStr)
        .digest('hex');

    return calculatedHash === hash ? Object.fromEntries(urlParams) : null;
}

module.exports = (req, res, next) => {
    const initData = req.headers['x-telegram-init-data'];
    if (!initData) return res.status(401).json({ error: 'Acceso no autorizado' });

    const validatedData = verifyTelegramWebAppData(initData);
    if (!validatedData) return res.status(403).json({ error: 'Firma no válida' });

    req.telegramUser = JSON.parse(validatedData.user);
    req.startParam = validatedData.start_param || null;
    next();
};

