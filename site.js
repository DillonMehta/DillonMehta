const flipRobot = document.getElementById('flip-robot');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let robotBusy = false;

function pause(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

async function drive(from, to, top, duration) {
  flipRobot.style.display = 'block';
  flipRobot.style.top = `${top}px`;
  flipRobot.style.left = `${from}px`;
  const animation = flipRobot.animate(
    [{ left: `${from}px` }, { left: `${to}px` }],
    { duration, easing: 'ease-in-out', fill: 'forwards' }
  );
  await animation.finished.catch(() => {});
  animation.cancel();
  flipRobot.style.left = `${to}px`;
}

for (const card of document.querySelectorAll('[data-project]')) {
  const front = card.querySelector('.card-front');
  const back = card.querySelector('.card-back');
  const returnButton = card.querySelector('.card-return');

  async function flip(showBack) {
    if (robotBusy) return;
    robotBusy = true;
    let push;

    if (!reducedMotion.matches) {
      const rect = card.getBoundingClientRect();
      const robotSize = 88;
      const start = window.innerWidth + robotSize;
      const stop = Math.max(8, Math.min(window.innerWidth - robotSize - 8, rect.right - 65));
      const top = Math.max(8, Math.min(window.innerHeight - robotSize - 8, rect.top + rect.height * 0.58));
      await drive(start, stop, top, 420);
      push = flipRobot.animate(
        [
          { transform: 'translateX(0) rotate(0deg)' },
          { transform: 'translateX(-18px) rotate(-16deg)', offset: 0.43 },
          { transform: 'translateX(-22px) rotate(-14deg)', offset: 0.58 },
          { transform: 'translateX(0) rotate(0deg)' }
        ],
        { duration: 670, easing: 'ease-in-out' }
      );
      await pause(245);
    }

    card.classList.toggle('is-flipped', showBack);
    front.setAttribute('aria-expanded', String(showBack));
    front.setAttribute('aria-hidden', String(showBack));
    front.tabIndex = showBack ? -1 : 0;
    back.setAttribute('aria-hidden', String(!showBack));
    if (showBack) back.removeAttribute('inert');
    else back.setAttribute('inert', '');

    if (push) {
      await push.finished.catch(() => {});
      push.cancel();
      await pause(170);
    }
    (showBack ? returnButton : front).focus({ preventScroll: true });

    if (!reducedMotion.matches) {
      const position = Number.parseFloat(flipRobot.style.left);
      await drive(position, -80, Number.parseFloat(flipRobot.style.top), 330);
      flipRobot.style.display = 'none';
    }
    robotBusy = false;
  }

  front.addEventListener('click', () => flip(true));
  returnButton.addEventListener('click', () => flip(false));
}

const xColumn = document.querySelector('.x-column');
const xFallback = document.querySelector('.x-fallback');
if (xColumn && xFallback) {
  const updateFeed = () => {
    const frame = xColumn.querySelector('iframe');
    const hasFeed = Boolean(frame && frame.clientHeight > 150);
    xFallback.hidden = hasFeed;
    xColumn.classList.toggle('x-column--fallback', Boolean(frame && !hasFeed));
  };
  const watchFrame = new MutationObserver(() => {
    const frame = xColumn.querySelector('iframe');
    if (frame) {
      new ResizeObserver(updateFeed).observe(frame);
      watchFrame.disconnect();
    }
    updateFeed();
  });
  watchFrame.observe(xColumn, { childList: true, subtree: true });
  updateFeed();
}
