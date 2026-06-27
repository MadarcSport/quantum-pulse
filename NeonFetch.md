I'll verify both the implementation and the current collected snapshot count, without changing the Yahoo indicator-fetching logic.

Short answer: partially, but not fully yet.

We already store the right fields in Neon for the historical indicator chart:

avgVolume7d
avgVolume90d
volumeDeltaPct
cmf7d
cmf7dAvg90d
cmfSpread
mfVelocity
So the schema in stock-indicator-snapshots.ts:86-108 is enough for charts like:

Volume 7d vs 90d Avg
Volume delta %
CMF 7d vs CMF 90d average
CMF spread
MF Velocity
I checked the current Neon data. We have:

Symbol Snapshot rows First date Last date Enough for 5-point chart?
QUBT 5 2026-06-15 2026-06-26 Yes
RGTI 5 2026-06-15 2026-06-26 Yes
QBTS 4 2026-06-15 2026-06-26 Not yet
Important caveat: this is enough for last 5 saved snapshots, not necessarily last 5 consecutive trading days, because there are date gaps in the stored data.

Also, only QUBT, RGTI, and QBTS currently have rows. The project has more enabled stocks in stocks.json, so for all stocks the answer is no, not enough yet.

Current collection paths:

Home page saves snapshots for the first 3 preview stocks in page.tsx:18-36.
Cron endpoint is designed to save snapshots for all enabled stocks in route.ts:27-49.
The API can already return the last 5 snapshots using app/api/stocks/[symbol]/indicators/route.ts.
So: the database structure is ready, Yahoo indicator fetching can stay unchanged, but we need a few more successful daily captures to make the 5-day historical charts reliable for every stock.

GPT-5.5 • 1x
