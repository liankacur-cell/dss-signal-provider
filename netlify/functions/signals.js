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
