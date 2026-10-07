(() => {
  const feed = document.querySelector('[data-x-posts]');
  if (!feed) return;

  const posts = [
    { url: 'https://x.com/PickleDilll_/status/2107885940039688633', date: 'Oct 7, 2026', text: "wow i really doubted the power of running daily. ive never felt this locked in🔒" },
    { url: 'https://x.com/PickleDilll_/status/2106081351573422436', date: 'Oct 2, 2026', text: "made my dog my chatgpt pet. he has no idea he's been vertically integrated" },
    { url: 'https://x.com/PickleDilll_/status/2104062934473474372', date: 'Sep 26, 2026', text: 'jev is making it obvious how much of an agent loop was never a language problem. we used LLMs because prompts were the easiest universal interface, then kept throwing data at them instead of asking whether every decision should be generated as text.' },
    { url: 'https://x.com/PickleDilll_/status/2102506016227369018', date: 'Sep 22, 2026', text: 'the hardest part of pivoting cuebench a couple months ago was walking away from traction. one of the hardest lessons as a founder was learning that traction only tells you people want what you built. it can’t tell you whether you should spend years building it, and it shouldn’t.' },
    { url: 'https://x.com/PickleDilll_/status/2101416391891210354', date: 'Sep 19, 2026', text: 'i recently saw a robot fail around reflective packaging. the geometry stayed the same, but the reflection changed the camera input. the policy likely learned appearance as a proxy for geometry. kinda surprising how clearly one edge case can expose what a policy learned.' },
  ];

  for (const post of posts) {
    const embed = document.createElement('blockquote');
    embed.className = 'twitter-tweet';
    embed.setAttribute('data-dnt', 'true');
    const body = document.createElement('p');
    body.textContent = post.text;
    const link = document.createElement('a');
    link.href = post.url;
    link.textContent = `Dillon Mehta · ${post.date}`;
    embed.append(body, link);
    feed.append(embed);
  }

  const render = () => {
    if (window.twttr?.ready) {
      window.twttr.ready((twitter) => twitter.widgets.load(feed));
    }
  };

  const existing = document.querySelector('script[src="https://platform.twitter.com/widgets.js"], script[src="https://platform.x.com/widgets.js"]');
  if (existing) {
    if (window.twttr?.ready) render();
    else existing.addEventListener('load', render, { once: true });
  } else {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://platform.twitter.com/widgets.js';
    script.addEventListener('load', render, { once: true });
    document.head.append(script);
  }
})();
