// Proxies bntpool.com's per-address stats (the pool sends no CORS headers, so the
// browser can't call it directly). The address comes from ?address= or the
// BNT_ADDRESS environment variable you set in Vercel. Nothing is stored.
const ADDR_RE = /^[A-Za-z0-9]{40,140}$/;

module.exports = async (req, res) => {
  const address = String((req.query && req.query.address) || process.env.BNT_ADDRESS || '').trim();
  if (!ADDR_RE.test(address)) {
    res.status(400).json({ error: 'Set BNT_ADDRESS in your Vercel project, or open the page with ?address=YOUR_ADDRESS' });
    return;
  }
  try {
    const h = { headers: { 'user-agent': 'bnt-tracker' } };
    const [r, b] = await Promise.all([
      fetch(`https://bntpool.com/api/miner/${address}`, h),
      fetch(`https://bntpool.com/api/miner/${address}/balance?include_pending_estimate=true`, h).catch(() => null),
    ]);
    const body = await r.json();
    // pending = credits from pool blocks still waiting for their 60 confirmations
    try { if (b && b.ok) { const bal = await b.json(); body.balance = bal.balance || null; body.pending_estimate = bal.pending_estimate || null; } } catch (e) {}
    // If the address came from your private BNT_ADDRESS setting, don't echo it
    // back to the public: anyone could otherwise read it from /api/miner.
    if (!(req.query && req.query.address)) { delete body.address; if (body.balance) delete body.balance.address; }
    res.setHeader('cache-control', 's-maxage=20, stale-while-revalidate=60');
    res.status(r.ok ? 200 : r.status).json(body);
  } catch (e) {
    res.status(502).json({ error: 'pool unreachable' });
  }
};
