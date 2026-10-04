const bird = document.querySelector('.bird-png');
const game = document.querySelector('.game');
const scoreEl = document.querySelector('.score');

const state = {
  birdX: 120,
  birdY: 200,
  birdRotation: 0,
  velocity: 0,
  gravity: 0.42,
  jumpStrength: -8.5,
  score: 0,
  isGameOver: false,
  spawnTimer: 0,
  pipes: [],
};

bird.style.left = `${state.birdX}px`;
bird.style.top = `${state.birdY}px`;

function jump() {
  if (state.isGameOver) return;
  state.velocity = state.jumpStrength;
}

function gameOver() {
  if (state.isGameOver) return;

  state.isGameOver = true;
  alert(`Game Over! Your score: ${state.score}`);
  location.reload();
}

function spawnPipe() {
  const pipeWidth = 62;
  const gap = 170;
  const topHeight = 60 + Math.random() * (game.clientHeight - gap - 120);
  const bottomHeight = game.clientHeight - topHeight - gap;

  const pipeTop = document.createElement('div');
  const pipeBottom = document.createElement('div');

  pipeTop.className = 'pipe pipe-top';
  pipeBottom.className = 'pipe pipe-bottom';
  pipeTop.style.height = `${topHeight}px`;
  pipeBottom.style.height = `${bottomHeight}px`;
  pipeTop.style.left = `${game.clientWidth}px`;
  pipeBottom.style.left = `${game.clientWidth}px`;

  game.append(pipeTop, pipeBottom);
  state.pipes.push({ top: pipeTop, bottom: pipeBottom, x: game.clientWidth, width: pipeWidth, passed: false });
}

function intersects(a, b) {
  return (
    a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top
  );
}

let birdMask;

function getBirdMask() {
  if (birdMask) return birdMask;
  if (!bird.complete || !bird.naturalWidth) return null;

  const canvas = document.createElement('canvas');
  canvas.width = bird.offsetWidth;
  canvas.height = bird.offsetHeight;
  const context = canvas.getContext('2d');
  context.drawImage(bird, 0, 0, canvas.width, canvas.height);

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  birdMask = [];
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (pixels[(y * canvas.width + x) * 4 + 3] > 0) {
        birdMask.push([x + 0.5 - canvas.width / 2, y + 0.5 - canvas.height / 2]);
      }
    }
  }

  return birdMask;
}

function containsRoundedPoint(rect, x, y) {
  const radius = Math.min(14, rect.width / 2, rect.height / 2);
  const nearestX = Math.max(rect.left + radius, Math.min(x, rect.right - radius));
  const nearestY = Math.max(rect.top + radius, Math.min(y, rect.bottom - radius));
  return (x - nearestX) ** 2 + (y - nearestY) ** 2 <= radius ** 2;
}

function checkCollision(pipe) {
  const mask = getBirdMask();
  if (!mask) return false;

  const birdRect = bird.getBoundingClientRect();
  const topRect = pipe.top.getBoundingClientRect();
  const bottomRect = pipe.bottom.getBoundingClientRect();
  const centerX = (birdRect.left + birdRect.right) / 2;
  const centerY = (birdRect.top + birdRect.bottom) / 2;
  const angle = (state.birdRotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return mask.some(([x, y]) => {
    const screenX = centerX + x * cos - y * sin;
    const screenY = centerY + x * sin + y * cos;
    return containsRoundedPoint(topRect, screenX, screenY) || containsRoundedPoint(bottomRect, screenX, screenY);
  });
}

function update() {
  if (state.isGameOver) return;

  state.velocity += state.gravity;
  state.birdY += state.velocity;

  if (state.birdY <= 0) {
    state.birdY = 0;
    state.velocity = 0;
  }

  if (state.birdY + bird.offsetHeight >= game.clientHeight) {
    gameOver();
    return;
  }

  bird.style.top = `${state.birdY}px`;
  state.birdRotation = Math.max(-35, Math.min(90, state.velocity * 6));
  bird.style.transform = `rotate(${state.birdRotation}deg)`;

  state.spawnTimer += 16.67;
  if (state.spawnTimer >= 1500) {
    spawnPipe();
    state.spawnTimer = 0;
  }

  state.pipes.forEach((pipe) => {
    pipe.x -= 3;
    pipe.top.style.left = `${pipe.x}px`;
    pipe.bottom.style.left = `${pipe.x}px`;

    if (!pipe.passed && pipe.x + pipe.width < state.birdX) {
      pipe.passed = true;
      state.score += 1;
      scoreEl.textContent = state.score;
    }

    if (checkCollision(pipe)) {
      gameOver();
    }

    if (pipe.x + pipe.width < -10) {
      pipe.top.remove();
      pipe.bottom.remove();
      pipe.passed = true;
    }
  });

  state.pipes = state.pipes.filter((pipe) => !pipe.passed || pipe.x + pipe.width >= -10);
}

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    jump();
  }
});

setInterval(update, 16.67);

