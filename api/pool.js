// Pool + network totals from bntpool.com (public, no address needed).
module.exports = async (req, res) => {
  try {
    const r = await fetch('https://bntpool.com/api/stats', { headers: { 'user-agent': 'bnt-tracker' } });
    res.setHeader('cache-control', 's-maxage=30, stale-while-revalidate=120');
    res.status(r.ok ? 200 : r.status).json(await r.json());
  } catch (e) {
    res.status(502).json({ error: 'pool unreachable' });
  }
};
