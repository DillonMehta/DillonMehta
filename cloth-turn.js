function drawFittedImage(ctx, image, x, y, width, height, fit) {
  const ratio = fit === 'cover'
    ? Math.max(width / image.naturalWidth, height / image.naturalHeight)
    : Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawnWidth = image.naturalWidth * ratio;
  const drawnHeight = image.naturalHeight * ratio;
  ctx.drawImage(image, x + (width - drawnWidth) / 2, y + (height - drawnHeight) / 2, drawnWidth, drawnHeight);
}

function drawWrappedText(ctx, value, x, top, maxWidth, lineHeight) {
  const paragraphs = value.split('\n');
  let y = top;
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > maxWidth) {
        ctx.fillText(line, x, y);
        y += lineHeight;
        line = word;
      } else {
        line = next;
      }
    }
    if (line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }
  }
  return y;
}

function cardTexture(card, side, width, height) {
  const resolution = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * resolution);
  canvas.height = Math.round(height * resolution);
  const ctx = canvas.getContext('2d');
  ctx.scale(resolution, resolution);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  if (side === 'front') {
    const photo = card.querySelector('.card-photo');
    const image = photo.querySelector('img');
    const photoHeight = height - 53;
    const contained = photo.classList.contains('card-photo--poster') || photo.classList.contains('card-photo--diagram') || photo.classList.contains('card-photo--logo');
    ctx.fillStyle = '#f3f3f3';
    ctx.fillRect(0, 0, width, photoHeight);
    if (image.complete && image.naturalWidth) {
      const imageWidth = photo.classList.contains('card-photo--logo') ? width * .78 : width;
      drawFittedImage(ctx, image, (width - imageWidth) / 2, 0, imageWidth, photoHeight, contained ? 'contain' : 'cover');
    }
    ctx.strokeStyle = '#aaa';
    ctx.beginPath();
    ctx.moveTo(0, height - .5);
    ctx.lineTo(width, height - .5);
    ctx.stroke();
    ctx.fillStyle = '#111';
    ctx.font = 'bold 20px "Times New Roman", Times, serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.querySelector('.card-caption strong').textContent, 0, height - 26);
  } else {
    const back = card.querySelector('.card-back');
    ctx.strokeStyle = '#aaa';
    ctx.strokeRect(.5, .5, width - 1, height - 1);
    ctx.fillStyle = '#111';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 23px "Times New Roman", Times, serif';
    ctx.fillText(back.querySelector('h3').textContent, 21, 20);
    ctx.font = '17px "Times New Roman", Times, serif';
    let y = 69;
    for (const paragraph of back.querySelectorAll('p')) {
      y = drawWrappedText(ctx, paragraph.innerText, 21, y, width - 42, 24) + 15;
    }
  }

  ctx.globalAlpha = .065;
  ctx.fillStyle = '#777';
  for (let y = 0; y < height; y += 3) ctx.fillRect(0, y, width, .35);
  ctx.globalAlpha = 1;
  return canvas;
}

function textureTriangle(ctx, texture, source, target, width, height) {
  const [s1, s2, s3] = source;
  const [t1, t2, t3] = target;
  const determinant = s1.x * (s2.y - s3.y) + s2.x * (s3.y - s1.y) + s3.x * (s1.y - s2.y);
  if (Math.abs(determinant) < .001) return;
  const xScale = (t1.x * (s2.y - s3.y) + t2.x * (s3.y - s1.y) + t3.x * (s1.y - s2.y)) / determinant;
  const xSkew = (t1.x * (s3.x - s2.x) + t2.x * (s1.x - s3.x) + t3.x * (s2.x - s1.x)) / determinant;
  const xShift = (t1.x * (s2.x * s3.y - s3.x * s2.y) + t2.x * (s3.x * s1.y - s1.x * s3.y) + t3.x * (s1.x * s2.y - s2.x * s1.y)) / determinant;
  const ySkew = (t1.y * (s2.y - s3.y) + t2.y * (s3.y - s1.y) + t3.y * (s1.y - s2.y)) / determinant;
  const yScale = (t1.y * (s3.x - s2.x) + t2.y * (s1.x - s3.x) + t3.y * (s2.x - s1.x)) / determinant;
  const yShift = (t1.y * (s2.x * s3.y - s3.x * s2.y) + t2.y * (s3.x * s1.y - s1.x * s3.y) + t3.y * (s1.x * s2.y - s2.x * s1.y)) / determinant;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(t1.x, t1.y);
  ctx.lineTo(t2.x, t2.y);
  ctx.lineTo(t3.x, t3.y);
  ctx.closePath();
  ctx.clip();
  ctx.transform(xScale, ySkew, xSkew, yScale, xShift, yShift);
  ctx.drawImage(texture, 0, 0, width, height);
  ctx.restore();
}

async function animateClothTurn(card, showBack, duration = 1550, positionCorner, releaseGrip) {
  const rect = card.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const resolution = Math.min(window.devicePixelRatio || 1, 2);
  const front = cardTexture(card, 'front', width, height);
  const back = cardTexture(card, 'back', width, height);
  const overlay = document.createElement('canvas');
  overlay.className = 'cloth-sheet';
  overlay.width = Math.round((width + 130) * resolution);
  overlay.height = Math.round((height + 30) * resolution);
  overlay.style.width = `${width + 130}px`;
  overlay.style.height = `${height + 30}px`;
  card.appendChild(overlay);
  const ctx = overlay.getContext('2d');
  const sourceFirst = showBack ? front : back;
  const sourceSecond = showBack ? back : front;
  const divisions = 24;
  const start = performance.now();
  card.classList.toggle('is-flipped', showBack);

  await new Promise(resolve => {
    function paint(now) {
      const progress = Math.min(1, (now - start) / duration);
      const peel = Math.min(1, progress / .78);
      const smoothPeel = peel * peel * (3 - 2 * peel);
      const relax = Math.max(0, (progress - .78) / .22);
      const tension = progress < .78 ? smoothPeel : 1 - relax * relax * (3 - 2 * relax);
      const corner = positionCorner(tension);
      if (progress >= .78) releaseGrip();
      ctx.clearRect(0, 0, overlay.width, overlay.height);
      ctx.save();
      ctx.scale(resolution, resolution);

      const vertex = (u, v) => {
        const influence = Math.pow(u, 2.2) * Math.pow(1 - v, 2.5);
        const body = Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
        const contact = Math.sin(Math.PI * progress) * influence;
        return {
          x: u * width + corner.x * influence + 22 * contact + 8 * tension * body,
          y: v * height + corner.y * influence - 40 * contact + 7 * tension * body
        };
      };
      const point = (u, v) => ({ x: u * width, y: v * height });
      const threshold = 1.02 - 1.26 * smoothPeel;

      for (let row = 0; row < divisions; row++) {
        for (let column = 0; column < divisions; column++) {
          const u0 = column / divisions;
          const u1 = (column + 1) / divisions;
          const v0 = row / divisions;
          const v1 = (row + 1) / divisions;
          const score = (u0 + u1) / 2 * (1 - (v0 + v1) / 2);
          const blend = Math.max(0, Math.min(1, (score - threshold) / .085 + .5));
          const source = [point(u0, v0), point(u1, v0), point(u1, v1), point(u0, v1)];
          const target = [vertex(u0, v0), vertex(u1, v0), vertex(u1, v1), vertex(u0, v1)];
          if (blend < 1) {
            ctx.globalAlpha = 1 - blend;
            textureTriangle(ctx, sourceFirst, [source[0], source[1], source[2]], [target[0], target[1], target[2]], width, height);
            textureTriangle(ctx, sourceFirst, [source[0], source[2], source[3]], [target[0], target[2], target[3]], width, height);
          }
          if (blend > 0) {
            ctx.globalAlpha = blend;
            textureTriangle(ctx, sourceSecond, [source[0], source[1], source[2]], [target[0], target[1], target[2]], width, height);
            textureTriangle(ctx, sourceSecond, [source[0], source[2], source[3]], [target[0], target[2], target[3]], width, height);
          }
          ctx.globalAlpha = 1;
          if (Math.abs(score - threshold) < .03 && tension > .01) {
            ctx.fillStyle = `rgba(0,0,0,${Math.min(.11, tension * .11)})`;
            ctx.beginPath();
            ctx.moveTo(target[0].x, target[0].y);
            for (let i = 1; i < 4; i++) ctx.lineTo(target[i].x, target[i].y);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
      ctx.restore();
      if (progress < 1) requestAnimationFrame(paint);
      else resolve();
    }
    requestAnimationFrame(paint);
  });

  overlay.remove();
}
