const motors = document.getElementById('card-motors');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let motorBusy = false;

async function motion(element, frames, duration, animations) {
  const animation = element.animate(frames, {
    duration, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards',
  });
  animations.push(animation);
  await animation.finished;
}

for (const card of document.querySelectorAll('[data-project]')) {
  const inner = card.querySelector('.card-inner');
  const front = card.querySelector('.card-front');
  const back = card.querySelector('.card-back');
  const returnButton = card.querySelector('.card-return');

  async function flip(showBack) {
    if (motorBusy) return;
    motorBusy = true;
    const animations = [];
    const cancel = () => animations.forEach(animation => animation.cancel());
    const oldAngle = card.classList.contains('is-flipped') ? 180 : 0;
    const newAngle = showBack ? 180 : 0;
    card.setAttribute('aria-busy', 'true');
    card.classList.add('is-turning');
    window.addEventListener('resize', cancel, { once: true });
    window.addEventListener('scroll', cancel, { once: true, passive: true });

    try {
      if (!reducedMotion.matches) {
        const rect = card.getBoundingClientRect();
        const small = window.innerWidth < 660;
        const size = small ? 46 : 90;
        const shaft = small ? 8 : 12;
        const center = rect.left + rect.width / 2;
        const leftSpace = 2 * (center - size - shaft - 9);
        const rightSpace = 2 * (window.innerWidth - center - size * .38 - shaft - 9);
        const scale = Math.min(1, Math.max(.2, Math.min(leftSpace, rightSpace) / rect.width));
        const edge = rect.width * (1 - scale) / 2;
        const left = motors.querySelector('.card-motor--left');
        const right = motors.querySelector('.card-support');
        const couplers = [...motors.querySelectorAll('.motor-coupler')];
        const leftEnd = rect.left + edge - size - shaft;
        const rightEnd = rect.right - edge + shaft;
        motors.style.setProperty('--motor-size', `${size}px`);
        motors.style.setProperty('--shaft-size', `${shaft}px`);
        motors.style.setProperty('--motor-top', `${rect.top + rect.height / 2}px`);
        left.style.left = `${-size - 24}px`;
        right.style.left = `${window.innerWidth + 24}px`;
        motors.hidden = false;
        couplers.forEach(coupler => { coupler.style.transform = `rotateX(${oldAngle}deg)`; });

        await Promise.all([
          motion(inner, [
            { transform: `scale(1) rotateX(${oldAngle}deg)` },
            { transform: `scale(${scale}) rotateX(${oldAngle}deg)` },
          ], 450, animations),
          motion(left, [{ left: `${-size - 24}px` }, { left: `${leftEnd}px` }], 450, animations),
          motion(right, [{ left: `${window.innerWidth + 24}px` }, { left: `${rightEnd}px` }], 450, animations),
        ]);

        await Promise.all([
          motion(inner, [
            { transform: `scale(${scale}) rotateX(${oldAngle}deg)` },
            { transform: `scale(${scale}) rotateX(${newAngle}deg)` },
          ], 1800, animations),
          ...couplers.map(coupler => motion(coupler, [
            { transform: `rotateX(${oldAngle}deg)` },
            { transform: `rotateX(${newAngle}deg)` },
          ], 1800, animations)),
        ]);

        await Promise.all([
          motion(inner, [
            { transform: `scale(${scale}) rotateX(${newAngle}deg)` },
            { transform: `scale(1) rotateX(${newAngle}deg)` },
          ], 450, animations),
          motion(left, [{ left: `${leftEnd}px` }, { left: `${-size - 24}px` }], 450, animations),
          motion(right, [{ left: `${rightEnd}px` }, { left: `${window.innerWidth + 24}px` }], 450, animations),
        ]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') console.error('Card turn interrupted', error.name);
    } finally {
      card.classList.toggle('is-flipped', showBack);
      front.setAttribute('aria-expanded', String(showBack));
      front.setAttribute('aria-hidden', String(showBack));
      front.tabIndex = showBack ? -1 : 0;
      back.setAttribute('aria-hidden', String(!showBack));
      back.toggleAttribute('inert', !showBack);
      cancel();
      motors.hidden = true;
      card.classList.remove('is-turning');
      card.removeAttribute('aria-busy');
      window.removeEventListener('resize', cancel);
      window.removeEventListener('scroll', cancel);
      motorBusy = false;
      (showBack ? returnButton : front).focus({ preventScroll: true });
    }
  }

  front.addEventListener('click', () => flip(true));
  returnButton.addEventListener('click', () => flip(false));
}
