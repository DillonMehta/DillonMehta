(() => {
  const feed = document.querySelector('[data-x-posts]');
  if (!feed) return;

  const refreshInterval = 60 * 60 * 1000;
  let nextRefresh = 0;
  let refreshing = false;

  const fallbackPosts = [
  {
    "id": "2108833480301776989",
    "date": "Oct 10, 2026",
    "text": "wow super cool!! wait wdym 1x speed?!?!"
  },
  {
    "id": "2108435123255582847",
    "date": "Oct 9, 2026",
    "text": "i have been experimenting with similar agent environments at cuebench. step rewards could help with credit assignment, but i was wary of how to reward an agent for finding bad news. a lookup that rules out your best plan can lower its apparent chance of success while saving it from a dead end."
  },
  {
    "id": "2108418335474081958",
    "date": "Oct 8, 2026",
    "text": "👀"
  },
  {
    "id": "2108042817738244543",
    "date": "Oct 7, 2026",
    "text": "this might be my favorite x post oat"
  },
  {
    "id": "2107885940039688633",
    "date": "Oct 7, 2026",
    "text": "wow i really doubted the power of running daily. ive never felt this locked in🔒"
  }
];
  feed.replaceChildren(...fallbackPosts.map(post => {
    const embed = document.createElement('blockquote');
    embed.className = 'twitter-tweet';
    embed.setAttribute('data-dnt', 'true');
    const body = document.createElement('p');
    body.textContent = post.text;
    const link = document.createElement('a');
    link.href = `https://x.com/PickleDilll_/status/${post.id}`;
    link.textContent = `Dillon Mehta · ${post.date}`;
    embed.append(body);
    embed.append(link);
    return embed;
  }));

  const widgets = new Promise((resolve, reject) => {
    const ready = () => {
      if (window.twttr?.widgets?.createTimeline) resolve(window.twttr);
      else if (typeof window.twttr?.ready === 'function') window.twttr.ready(resolve);
      else reject(new Error('X widget API unavailable'));
    };
    if (window.twttr?.ready) return ready();
    let script = document.querySelector('script[src="https://platform.twitter.com/widgets.js"],script[src="https://platform.x.com/widgets.js"]');
    if (!script) {
      script = document.createElement('script');
      script.async = true;
      script.src = 'https://platform.x.com/widgets.js';
      script.addEventListener('load', ready, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.append(script);
    } else {
      script.addEventListener('load', ready, { once: true });
      script.addEventListener('error', reject, { once: true });
    }
  });
  widgets.then(twitter => twitter.widgets.load(feed)).catch(() => {});

  async function refresh() {
    if (refreshing || document.hidden || !navigator.onLine || Date.now() < nextRefresh) return;
    refreshing = true;
    feed.setAttribute('aria-busy', 'true');
    const mount = document.createElement('div');
    mount.className = 'x-timeline-pending';
    mount.style.width = `${feed.clientWidth}px`;
    feed.append(mount);
    let timeout;
    try {
      const iframe = await Promise.race([
        widgets.then(twitter => twitter.widgets.createTimeline(
          { sourceType: 'profile', screenName: 'PickleDilll_' }, mount,
          { tweetLimit: 5, theme: 'light', chrome: 'noheader nofooter noborders', dnt: true },
        )),
        new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Timeline timeout')), 20000); }),
      ]);
      if (!iframe) throw new Error('Timeline unavailable');
      mount.classList.remove('x-timeline-pending');
      mount.style.removeProperty('width');
      feed.replaceChildren(mount);
      nextRefresh = Date.now() + refreshInterval;
    } catch (error) {
      console.warn('X profile timeline could not be loaded:', error.message);
      mount.remove();
      nextRefresh = Date.now() + refreshInterval;
    } finally {
      clearTimeout(timeout);
      feed.removeAttribute('aria-busy');
      refreshing = false;
    }
  }

  refresh();
  window.setInterval(refresh, refreshInterval);
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('online', refresh);
})();
