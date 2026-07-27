(() => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const messageScreen = document.getElementById('message-screen');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const startButton = document.getElementById('start-button');

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const GROUND_Y = HEIGHT - 50;
    const GRAVITY = 1800;
    const JUMP_VELOCITY = -650;
    const DOUBLE_JUMP_VELOCITY = -560;
    const MAX_JUMPS = 2;
    const PIT_MIN_WIDTH = 70;
    const PIT_MAX_WIDTH = 140;
    const PIT_CHANCE = 0.35;

    const STATE = { READY: 'ready', PLAYING: 'playing', GAMEOVER: 'gameover' };
    let state = STATE.READY;

    let player, obstacles, pits, particles, score, scrollSpeed, spawnTimer, lastTime, animTime;

    function resetGame() {
        player = {
            x: 90,
            y: GROUND_Y - 40,
            width: 34,
            height: 40,
            vy: 0,
            onGround: true,
            runCycle: 0,
            jumpsLeft: MAX_JUMPS,
        };
        obstacles = [];
        pits = [];
        particles = [];
        score = 0;
        scrollSpeed = 320;
        spawnTimer = 0;
        animTime = 0;
        lastTime = performance.now();
    }

    function jump() {
        if (state !== STATE.PLAYING || player.jumpsLeft <= 0) return;
        player.vy = player.onGround ? JUMP_VELOCITY : DOUBLE_JUMP_VELOCITY;
        player.onGround = false;
        player.jumpsLeft -= 1;
    }

    function startGame() {
        resetGame();
        state = STATE.PLAYING;
        messageScreen.classList.add('hidden');
        requestAnimationFrame(loop);
    }

    function gameOver() {
        state = STATE.GAMEOVER;
        messageTitle.textContent = 'GAME OVER';
        messageText.innerHTML = `スコア: ${Math.floor(score)}<br>スペースキー / タップでリトライ`;
        startButton.textContent = 'もう一度';
        messageScreen.classList.remove('hidden');
    }

    function spawnObstacle() {
        const height = 30 + Math.random() * 40;
        obstacles.push({
            x: WIDTH + 20,
            y: GROUND_Y - height,
            width: 26 + Math.random() * 14,
            height,
            passed: false,
        });
    }

    function spawnPit() {
        pits.push({
            x: WIDTH + 20,
            width: PIT_MIN_WIDTH + Math.random() * (PIT_MAX_WIDTH - PIT_MIN_WIDTH),
        });
    }

    function spawnHazard() {
        if (Math.random() < PIT_CHANCE) {
            spawnPit();
        } else {
            spawnObstacle();
        }
    }

    function isOverPit(x) {
        return pits.some((p) => x > p.x && x < p.x + p.width);
    }

    function rectsOverlap(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    function update(dt) {
        scrollSpeed += dt * 6;
        score += dt * 10;
        animTime += dt;
        scoreEl.textContent = `SCORE: ${Math.floor(score)}`;

        player.vy += GRAVITY * dt;
        player.y += player.vy * dt;

        const overPit = isOverPit(player.x + player.width / 2);
        if (!overPit && player.y + player.height >= GROUND_Y) {
            player.y = GROUND_Y - player.height;
            player.vy = 0;
            player.onGround = true;
            player.jumpsLeft = MAX_JUMPS;
        } else if (overPit) {
            player.onGround = false;
        }
        if (player.onGround) {
            player.runCycle += dt * (scrollSpeed / 24);
        }

        if (player.y > HEIGHT) {
            gameOver();
            return;
        }

        spawnTimer -= dt;
        if (spawnTimer <= 0) {
            spawnHazard();
            spawnTimer = Math.max(0.7, 1.6 - score / 400) + Math.random() * 0.6;
        }

        for (const ob of obstacles) {
            ob.x -= scrollSpeed * dt;
        }
        obstacles = obstacles.filter((ob) => ob.x + ob.width > -10);

        for (const p of pits) {
            p.x -= scrollSpeed * dt;
        }
        pits = pits.filter((p) => p.x + p.width > -10);

        const playerBox = { x: player.x + 6, y: player.y + 4, width: player.width - 12, height: player.height - 6 };
        for (const ob of obstacles) {
            if (rectsOverlap(playerBox, ob)) {
                gameOver();
                return;
            }
        }
    }

    function drawGround() {
        ctx.fillStyle = '#6b4f3a';
        ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
        ctx.fillStyle = '#4f7942';
        ctx.fillRect(0, GROUND_Y, WIDTH, 8);

        for (const p of pits) {
            ctx.fillStyle = '#0d1117';
            ctx.fillRect(p.x, GROUND_Y, p.width, HEIGHT - GROUND_Y);
            ctx.fillStyle = '#33261c';
            ctx.fillRect(p.x, GROUND_Y, 4, HEIGHT - GROUND_Y);
            ctx.fillRect(p.x + p.width - 4, GROUND_Y, 4, HEIGHT - GROUND_Y);
        }
    }

    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function drawPlayer() {
        const { x, y, width, height, onGround } = player;
        const centerX = x + width / 2;
        const legSwing = onGround ? Math.sin(player.runCycle) * 10 : -4;
        const bob = onGround ? Math.abs(Math.sin(player.runCycle)) * 2 : 0;
        const topY = y + bob;

        ctx.save();

        // motion trail
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#3a86ff';
        roundRect(x - 10, topY + 10, width, height - 14, 8);
        ctx.fill();
        ctx.globalAlpha = 1;

        // flowing scarf
        const wave = Math.sin(animTime * 9) * 7;
        ctx.fillStyle = '#ffb703';
        ctx.beginPath();
        ctx.moveTo(x - 1, topY + 5);
        ctx.quadraticCurveTo(x - 18 + wave, topY + 12, x - 12 + wave, topY + 24);
        ctx.quadraticCurveTo(x - 6, topY + 18, x + 1, topY + 13);
        ctx.closePath();
        ctx.fill();

        // legs
        ctx.strokeStyle = '#1b1b2f';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(centerX - 5, topY + height - 8);
        ctx.lineTo(centerX - 5 + legSwing * 0.4, topY + height + 8);
        ctx.moveTo(centerX + 5, topY + height - 8);
        ctx.lineTo(centerX + 5 - legSwing * 0.4, topY + height + 8);
        ctx.stroke();

        // body with gradient armor
        const bodyGrad = ctx.createLinearGradient(x, topY, x, topY + height);
        bodyGrad.addColorStop(0, '#4dabf7');
        bodyGrad.addColorStop(1, '#1b1b2f');
        ctx.fillStyle = bodyGrad;
        roundRect(x, topY + 10, width, height - 14, 8);
        ctx.fill();

        // chest core glow
        ctx.fillStyle = '#ffd60a';
        ctx.beginPath();
        ctx.arc(centerX, topY + height / 2 + 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // head
        ctx.fillStyle = '#e9ecef';
        ctx.beginPath();
        ctx.arc(centerX, topY + 8, 10, 0, Math.PI * 2);
        ctx.fill();

        // glowing visor
        ctx.fillStyle = '#00f5ff';
        roundRect(centerX - 7, topY + 3, 13, 6, 3);
        ctx.fill();

        ctx.restore();
    }

    function drawObstacles() {
        ctx.fillStyle = '#2f6d3b';
        for (const ob of obstacles) {
            ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
        }
    }

    function draw() {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        drawGround();
        drawObstacles();
        drawPlayer();
    }

    function loop(now) {
        if (state !== STATE.PLAYING) return;
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        update(dt);
        draw();
        if (state === STATE.PLAYING) {
            requestAnimationFrame(loop);
        } else {
            draw();
        }
    }

    function handleActionPress() {
        if (state === STATE.READY || state === STATE.GAMEOVER) {
            startGame();
        } else if (state === STATE.PLAYING) {
            jump();
        }
    }

    startButton.addEventListener('click', handleActionPress);
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            handleActionPress();
        }
    });
    canvas.addEventListener('pointerdown', handleActionPress);

    draw();
})();
