const robotButton = document.getElementById('robot-button');
const robotMenu = document.getElementById('robot-menu');
if (robotButton && robotMenu) {
  const closeRobot = () => { robotMenu.hidden = true; robotButton.setAttribute('aria-expanded', 'false'); };
  robotButton.addEventListener('click', () => {
    const open = robotMenu.hidden;
    robotMenu.hidden = !open;
    robotButton.setAttribute('aria-expanded', String(open));
  });
  robotMenu.addEventListener('click', (event) => {
    const target = event.target.closest('[data-go]');
    if (!target) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) {
      robotButton.parentElement.classList.remove('is-driving');
      void robotButton.offsetWidth;
      robotButton.parentElement.classList.add('is-driving');
    }
    document.getElementById(target.dataset.go)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    closeRobot();
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeRobot(); });
  document.addEventListener('click', (event) => { if (!event.target.closest('.robot-helper')) closeRobot(); });
}

const loadX = document.getElementById('load-x');
if (loadX) {
  loadX.addEventListener('click', () => {
    document.getElementById('x-feed-content').hidden = false;
    loadX.disabled = true;
    loadX.textContent = 'Loading posts…';
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://platform.twitter.com/widgets.js';
    script.onload = () => { loadX.textContent = 'Posts from X'; };
    script.onerror = () => { loadX.textContent = 'Open posts on X instead'; loadX.disabled = false; loadX.onclick = () => { location.href = 'https://x.com/PickleDilll_'; }; };
    document.head.appendChild(script);
  }, { once: true });
}
