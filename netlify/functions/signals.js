const fetch = require('node-fetch');

const TOP_PAIRS = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','DOGEUSDT','ADAUSDT'];

exports.handler = async function(event) {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            body: ''
        };
    }

    try {
        const sigRes = await fetch(
            'https://raw.githubusercontent.com/liankacur-cell/dss-signal-system2/system2/dss_signals.json',
            { headers: { 'Accept': 'application/json' } }
        );
        const raw = await sigRes.json();

        const signals = raw.signals || [];
        const dirCount = { LONG: 0, SHORT: 0 };
        signals.forEach(function(x) {
            if (x.dir === 'LONG') dirCount.LONG++;
            else dirCount.SHORT++;
        });

        var btc = 'NEUTRAL';
        if (dirCount.SHORT > dirCount.LONG && dirCount.SHORT >= 3) btc = 'BEARISH';
        else if (dirCount.LONG > dirCount.SHORT && dirCount.LONG >= 3) btc = 'BULLISH';

        var masked = {
            c: btc,
            t: signals.length,
            s: signals.slice(0, 14).map(function(x) {
                return {
                    p: (x.pair || '???').replace('USDT', ''),
                    d: x.dir === 'LONG' ? 'L' : 'S'
                };
            })
        };

        var symbols = TOP_PAIRS.map(function(s) { return '"' + s + '"'; }).join(',');
        var mktRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=[' + symbols + ']');
        var mktRaw = await mktRes.json();
        var market = (mktRaw || []).map(function(x) {
            return {
                p: (x.symbol || '???').replace('USDT', ''),
                pr: parseFloat(x.lastPrice) || 0,
                ch: parseFloat(x.priceChangePercent) || 0
            };
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ signals: masked, market: market })
        };
    } catch(e) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                signals: { c: 'NEUTRAL', t: 0, s: [] },
                market: [],
                error: e.message
            })
        };
    }
};
