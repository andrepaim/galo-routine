#!/usr/bin/env node
/**
 * scripts/galo-matches.mjs
 * Daily cron: fetch Atlético Mineiro fixtures via ESPN API (no key needed),
 * classify them, build suggested rewards, and write to the local REST API.
 */

import https from 'https';
import http from 'http';
import { createHash } from 'crypto';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────

const ESPN_ATLETICO_ID = '7632';
const ESPN_LEAGUES = ['bra.1', 'conmebol.libertadores', 'conmebol.sudamericana'];
const BRT_OFFSET_MS = -3 * 60 * 60 * 1000;

const TG_TOKEN   = '8180862410:AAGorSa6VpB1oiDvIhQEv5VOUSW_x589izQ';
const TG_CHAT    = '8592602749';
const FAMILY_ID  = 'EXmCPl8hrnOYDzrPewHoXlGa5762';

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

function httpReq(url, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method,
      headers: {
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d ? JSON.parse(d) : {})); });
    req.on('error', reject); if (data) req.write(data); req.end();
  });
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function toBRT(isoStr) {
  const d = new Date(new Date(isoStr).getTime() + BRT_OFFSET_MS);
  return {
    date:    d.toISOString().slice(0, 10),
    time:    d.toISOString().slice(11, 16),
    weekday: d.getDay(), // 0=Sun 1=Mon … 6=Sat
    weekdayPT: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()],
  };
}

function dateRange(daysAhead = 120) {
  const now = new Date();
  const end = new Date(now.getTime() + daysAhead * 86400000);
  const fmt = d => d.toISOString().slice(0, 10).replace(/-/g, '');
  return `${fmt(now)}-${fmt(end)}`;
}

function todayBRT() {
  return new Date(Date.now() + BRT_OFFSET_MS).toISOString().slice(0, 10);
}

function daysBetween(dateStr) {
  const ms = new Date(dateStr).getTime() - new Date(todayBRT()).getTime();
  return Math.round(ms / 86400000);
}

// ── HTTP plain-text fetch (for RSS) ──────────────────────────────────────────

function httpGetText(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/rss+xml,application/xml,text/xml,*/*' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(httpGetText(res.headers.location, redirectCount + 1));
        return;
      }
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

// ── Galo News fetch ───────────────────────────────────────────────────────────

async function fetchGaloNews() {
  const rssUrl = 'https://news.google.com/rss/search?q=Atletico+Mineiro&hl=pt-BR&gl=BR&ceid=BR:pt-BR';
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  try {
    const xml = await httpGetText(rssUrl);
    const items = [];
    const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    for (const block of itemBlocks) {
      const getTag = (tag) => {
        const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
        return m ? m[1].trim() : '';
      };

      const rawTitle = getTag('title')
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
        .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      const link = getTag('link') || '';
      const pubDateRaw = getTag('pubDate');
      const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/);
      const source = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() : 'Google News';

      // Helper: strip source name suffix appended by Google News (" - SOURCE" or " SOURCE")
      const stripSourceSuffix = (text) => {
        if (!source || source === 'Google News') return text;
        const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return text
          .replace(new RegExp(`\\s*-\\s*${escaped}\\s*$`, 'i'), '')
          .replace(new RegExp(`\\s+${escaped}\\s*$`, 'i'), '')
          .trim();
      };

      const title = stripSourceSuffix(rawTitle);

      const description = stripSourceSuffix(
        getTag('description')
          .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1')
          .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
      );

      if (!title || !link) continue;

      const publishedAt = pubDateRaw ? new Date(pubDateRaw).toISOString() : new Date().toISOString();
      if (new Date(publishedAt) < threeDaysAgo) continue;

      const id = createHash('sha256').update(link).digest('hex').slice(0, 16);
      items.push({ id, title, summary: description, url: link, source, publishedAt });
    }

    return items;
  } catch (err) {
    console.warn(`Google News RSS error: ${err.message}`);
    return [];
  }
}

// ── ESPN fetch ────────────────────────────────────────────────────────────────

async function fetchMatches() {
  const range = dateRange(120);
  const matches = [];

  for (const league of ESPN_LEAGUES) {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${range}&limit=200`;
    try {
      const d = await httpGet(url);
      for (const e of (d.events || [])) {
        const comp = e.competitions?.[0];
        if (!comp) continue;
        const competitors = comp.competitors || [];
        const teamIds = competitors.map(c => c.team?.id);
        if (!teamIds.includes(ESPN_ATLETICO_ID)) continue;

        const home = competitors.find(c => c.homeAway === 'home');
        const away = competitors.find(c => c.homeAway === 'away');
        const brt  = toBRT(e.date);

        if (brt.date < todayBRT()) continue; // skip past matches

        matches.push({
          date:       brt.date,
          timeBRT:    brt.time,
          weekday:    brt.weekday,
          weekdayPT:  brt.weekdayPT,
          home:       home?.team?.displayName || '?',
          away:       away?.team?.displayName || '?',
          isGaloHome: home?.team?.id === ESPN_ATLETICO_ID,
          venue:      comp.venue?.fullName || 'Arena MRV',
          competition: league === 'bra.1' ? 'Brasileirão' :
                       league === 'conmebol.libertadores' ? 'Libertadores' : 'Sul-Americana',
        });
      }
    } catch (err) {
      console.warn(`ESPN ${league} error: ${err.message}`);
    }
  }

  matches.sort((a, b) => a.date.localeCompare(b.date));
  return matches;
}

// ── Build suggested rewards ────────────────────────────────────────────────────

const STATIC_REWARDS = [
  { type: 'shirt',     name: '👕 Camisa do Galo',         icon: '👕', starCost: 80 },
  { type: 'fifa',      name: '🎮 2h de FIFA',              icon: '🎮', starCost: 15 },
  { type: 'videogame', name: '🕹️ 1h de videogame livre',  icon: '🕹️', starCost: 10 },
];

function buildSuggestedRewards(matches) {
  const suggested = [...STATIC_REWARDS];

  // Next home match (at Arena MRV)
  const nextHome = matches.find(m => m.isGaloHome);
  if (nextHome) {
    const days = daysBetween(nextHome.date);
    const dateFmt = nextHome.date.slice(8, 10) + '/' + nextHome.date.slice(5, 7);
    const opponent = nextHome.home === 'Atlético-MG' ? nextHome.away : nextHome.home;
    suggested.unshift({
      type:       'home_game',
      name:       `🏟️ Ir ao jogo: Galo x ${opponent} (${dateFmt})`,
      icon:       '🏟️',
      starCost:   100,
      expiresAt:  nextHome.date,
      matchDate:  nextHome.date,
      matchTime:  nextHome.timeBRT,
      competition: nextHome.competition,
      daysAway:   days,
    });
  }

  // Next late weekday game (Mon–Fri, kickoff >= 19:00 BRT)
  const nextLate = matches.find(m => m.weekday >= 1 && m.weekday <= 5 && parseInt(m.timeBRT) >= 19);
  if (nextLate) {
    const opponent = nextLate.isGaloHome ? nextLate.away : nextLate.home;
    const label = `${nextLate.weekdayPT} às ${nextLate.timeBRT}`;
    suggested.push({
      type:      'tv_game',
      name:      `📺 Ver Galo de noite: x ${opponent} (${label})`,
      icon:      '📺',
      starCost:  25,
      expiresAt: nextLate.date,
      matchDate: nextLate.date,
      matchTime: nextLate.timeBRT,
    });
  }

  return suggested;
}

// ── REST API write ────────────────────────────────────────────────────────────

async function writeGaloSchedule(_familyId, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ data });
    const options = {
      hostname: '127.0.0.1',
      port: 3200,
      path: '/api/galo/schedule',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = http.request(options, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve(d ? JSON.parse(d) : {}));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Telegram notify ───────────────────────────────────────────────────────────

async function tgNotify(msg) {
  try {
    await httpReq(
      `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`,
      'POST', { chat_id: TG_CHAT, text: msg, parse_mode: 'HTML' }
    );
  } catch (e) { console.warn('TG notify failed:', e.message); }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[galo-matches] ${new Date().toISOString()}`);

  const matches = await fetchMatches();
  console.log(`  Fixtures found: ${matches.length}`);
  matches.slice(0, 5).forEach(m =>
    console.log(`  ${m.isGaloHome ? '🏠' : '✈️'} ${m.date} ${m.timeBRT} | ${m.home} vs ${m.away} | ${m.competition}`)
  );

  const news = await fetchGaloNews();
  console.log(`  News items found: ${news.length}`);

  const suggestedRewards = buildSuggestedRewards(matches);
  const payload = {
    lastUpdated: new Date().toISOString(),
    matches: matches.slice(0, 20), // store next 20 fixtures
    suggestedRewards,
    news,
  };

  // Firebase write
  await writeGaloSchedule(FAMILY_ID, payload);
  console.log(`  ✓ REST API updated (galo/schedule)`);


  // Telegram alert for imminent home match
  const homeReward = suggestedRewards.find(r => r.type === 'home_game');
  if (homeReward && homeReward.daysAway <= 7) {
    const msg = `🏆 <b>Alerta Galo!</b>\n\n${homeReward.name}\n📍 Arena MRV · ${homeReward.competition}\n🗓️ Em ${homeReward.daysAway} dia(s)\n\nAdiciona o prêmio pro Vitor no app! ⭐`;
    await tgNotify(msg);
    console.log('  ✓ Telegram alert sent (home match ≤ 7 days)');
  }

  console.log('  Done.');
}

main().catch(err => { console.error('[galo-matches] FATAL:', err); process.exit(1); });
