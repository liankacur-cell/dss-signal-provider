const fetch = require('node-fetch');

const TOP_PAIRS = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','DOGEUSDT','ADAUSDT'];

exports.handler = async function(event) {
    try {
        const sigRes = await fetch(
            'https://raw.githubusercontent.com/liankacur-cell/dss-signal-system2/system2/dss_signals.json',
            { headers: { 'Accept': 'application/json' } }
        );
        const raw = await sigRes.json();

        const masked = {
            c: raw.btc_context || 'NEUTRAL',
            t: (raw.signals || []).length,
            s: (raw.signals || []).slice(0, 14).map(x => ({
                p: (x.pair || '???').replace('USDT', ''),
                d: x.dir === 'LONG' ? 'L' : 'S'
            }))
        };

        const symbols = TOP_PAIRS.map(s => `"${s}"`).join(',');
        const mktRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbols}]`);
        const mktRaw = await mktRes.json();
        const market = (mktRaw || []).map(x => ({
            p: (x.symbol || '???').replace('USDT', ''),
            pr: parseFloat(x.lastPrice) || 0,
            ch: parseFloat(x.priceChangePercent) || 0
        }));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ signals: masked, market: market })
        };
    } catch(e) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ signals: { c: 'NEUTRAL', t: 0, s: [] }, market: [] })
        };
    }
};
