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

    const STATE = { READY: 'ready', PLAYING: 'playing', GAMEOVER: 'gameover' };
    let state = STATE.READY;

    let player, obstacles, particles, score, scrollSpeed, spawnTimer, lastTime;

    function resetGame() {
        player = {
            x: 90,
            y: GROUND_Y - 40,
            width: 34,
            height: 40,
            vy: 0,
            onGround: true,
        };
        obstacles = [];
        particles = [];
        score = 0;
        scrollSpeed = 320;
        spawnTimer = 0;
        lastTime = performance.now();
    }

    function jump() {
        if (state === STATE.PLAYING && player.onGround) {
            player.vy = JUMP_VELOCITY;
            player.onGround = false;
        }
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
        scoreEl.textContent = `SCORE: ${Math.floor(score)}`;

        player.vy += GRAVITY * dt;
        player.y += player.vy * dt;
        if (player.y + player.height >= GROUND_Y) {
            player.y = GROUND_Y - player.height;
            player.vy = 0;
            player.onGround = true;
        }

        spawnTimer -= dt;
        if (spawnTimer <= 0) {
            spawnObstacle();
            spawnTimer = Math.max(0.7, 1.6 - score / 400) + Math.random() * 0.6;
        }

        for (const ob of obstacles) {
            ob.x -= scrollSpeed * dt;
        }
        obstacles = obstacles.filter((ob) => ob.x + ob.width > -10);

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
    }

    function drawPlayer() {
        ctx.fillStyle = '#ff5e5e';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillStyle = '#2b2b2b';
        ctx.fillRect(player.x + player.width - 10, player.y + 8, 6, 6);
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
