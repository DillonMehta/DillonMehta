(() => {
  const feed = document.querySelector('[data-x-posts]');
  if (!feed) return;

  const refreshInterval = 60 * 60 * 1000;
  let nextRefresh = 0;
  let refreshing = false;

  const fallbackPosts = [
    { id: '2107885940039688633', date: 'Oct 7, 2026', text: 'wow i really doubted the power of running daily. ive never felt this locked in🔒' },
    { id: '2106081351573422436', date: 'Oct 2, 2026', text: "made my dog my chatgpt pet. he has no idea he's been vertically integrated" },
    { id: '2104062934473474372', date: 'Sep 26, 2026', text: 'jev is making it obvious how much of an agent loop was never a language problem. we used LLMs because prompts were the easiest universal interface, then kept throwing data at them instead of asking whether every decision should be generated as text.' },
    { id: '2102506016227369018', date: 'Sep 22, 2026', text: 'the hardest part of pivoting cuebench a couple months ago was walking away from traction. one of the hardest lessons as a founder was learning that traction only tells you people want what you built. it can’t tell you whether you should spend years building it, and it shouldn’t.' },
    { id: '2101416391891210354', date: 'Sep 19, 2026', text: 'i recently saw a robot fail around reflective packaging. the geometry stayed the same, but the reflection changed the camera input. the policy likely learned appearance as a proxy for geometry. kinda surprising how clearly one edge case can expose what a policy learned.' },
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
