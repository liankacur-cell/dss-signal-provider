var fetch = require('node-fetch');

exports.handler = async function(event) {
    try {
        var mktRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
        var text = await mktRes.text();
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ raw: text.substring(0, 500) })
        };
    } catch(e) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: e.message })
        };
    }
};
