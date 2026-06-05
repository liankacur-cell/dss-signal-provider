var fetch = require('node-fetch');

var TOP_PAIRS = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','DOGEUSDT','ADAUSDT'];

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
        var sigRes = await fetch(
            'https://raw.githubusercontent.com/liankacur-cell/dss-signal-system2/system2/dss_signals.json',
            { headers: { 'Accept': 'application/json' } }
        );
        var raw = await sigRes.json();

        var signals = raw.signals || [];
        var dirCount = { LONG: 0, SHORT: 0 };
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

        var market = [];
        for (var i = 0; i < TOP_PAIRS.length; i++) {
            try {
                var url = 'https://api.binance.com/api/v3/ticker/24hr?symbol=' + TOP_PAIRS[i];
                var mktRes = await fetch(url);
                var mktRaw = await mktRes.json();
                if (mktRaw && mktRaw.symbol) {
                    market.push({
                        p: (mktRaw.symbol || '???').replace('USDT', ''),
                        pr: parseFloat(mktRaw.lastPrice) || 0,
                        ch: parseFloat(mktRaw.priceChangePercent) || 0
                    });
                }
            } catch(e) {}
        }

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
