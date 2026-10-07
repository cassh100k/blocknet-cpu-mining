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
    const r = await fetch(`https://bntpool.com/api/miner/${address}`, { headers: { 'user-agent': 'bnt-tracker' } });
    const body = await r.json();
    res.setHeader('cache-control', 's-maxage=20, stale-while-revalidate=60');
    res.status(r.ok ? 200 : r.status).json(body);
  } catch (e) {
    res.status(502).json({ error: 'pool unreachable' });
  }
};
