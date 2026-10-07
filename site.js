const flipRobot = document.getElementById('flip-robot');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let robotBusy = false;
const armOpen = 'assets/industrial-arm.png';
const armGrip = 'assets/industrial-arm-grip.png';
for (const source of [armOpen, armGrip]) {
  const preload = new Image();
  preload.src = source;
}

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
    const scale = window.innerWidth < 700 ? .21 : .27;
    try {
      if (!reducedMotion.matches) {
        const rect = card.getBoundingClientRect();
        flipRobot.style.transform = `scale(${scale})`;
        const start = window.innerWidth + 1536 * scale;
        const stop = rect.right - 30 * scale - 2;
        const top = rect.top + 5 - 515 * scale;
        await drive(start, stop, top, 580);
        await pause(120);
        flipRobot.classList.add('is-gripping');
        card.classList.add('is-turning');
        const shoulder = flipRobot.querySelector('.rig-shoulder');
        const elbow = flipRobot.querySelector('.rig-elbow');
        const wrist = flipRobot.querySelector('.rig-wrist');
        const pivot = (point, center, degrees) => {
          const angle = degrees * Math.PI / 180;
          const x = point.x - center.x;
          const y = point.y - center.y;
          return { x: center.x + x * Math.cos(angle) - y * Math.sin(angle), y: center.y + x * Math.sin(angle) + y * Math.cos(angle) };
        };
        await animateClothTurn(card, showBack, 1550, progress => {
          const shoulderAngle = -85 * progress;
          const elbowAngle = 55 * progress;
          const wristAngle = -15 * progress;
          shoulder.style.transform = `rotate(${shoulderAngle}deg)`;
          elbow.style.transform = `rotate(${elbowAngle}deg)`;
          wrist.style.transform = `rotate(${wristAngle}deg)`;
          let tip = pivot({ x: 30, y: 515 }, { x: 350, y: 335 }, wristAngle);
          tip = pivot(tip, { x: 800, y: 140 }, elbowAngle);
          tip = pivot(tip, { x: 1110, y: 385 }, shoulderAngle);
          return { x: (tip.x - 30) * scale, y: (tip.y - 515) * scale };
        }, () => flipRobot.classList.remove('is-gripping'));
        flipRobot.classList.remove('is-gripping');
        card.classList.remove('is-turning');
        shoulder.style.transform = '';
        elbow.style.transform = '';
        wrist.style.transform = '';
        await pause(120);
      } else {
        card.classList.toggle('is-flipped', showBack);
      }

      front.setAttribute('aria-expanded', String(showBack));
      front.setAttribute('aria-hidden', String(showBack));
      front.tabIndex = showBack ? -1 : 0;
      back.setAttribute('aria-hidden', String(!showBack));
      if (showBack) back.removeAttribute('inert');
      else back.setAttribute('inert', '');
      (showBack ? returnButton : front).focus({ preventScroll: true });

      if (!reducedMotion.matches) {
        const position = Number.parseFloat(flipRobot.style.left);
        await drive(position, window.innerWidth + 1536 * scale, Number.parseFloat(flipRobot.style.top), 490);
      }
    } finally {
      flipRobot.style.display = 'none';
      flipRobot.classList.remove('is-gripping');
      card.classList.remove('is-turning');
      robotBusy = false;
    }
  }

  front.addEventListener('click', () => flip(true));
  returnButton.addEventListener('click', () => flip(false));
}
