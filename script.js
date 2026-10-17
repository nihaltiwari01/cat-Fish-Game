const EMPTY = 0;
const START = 2;
const FISH = 3;
const DOOR_EXIT = 4;
const DOG_UP = 10;
const DOG_DOWN = 11;
const DOG_LEFT = 12;
const DOG_RIGHT = 13;
const DOG_TYPES = [DOG_UP, DOG_DOWN, DOG_LEFT, DOG_RIGHT];

const EMOJI_PLAYER = '🐱';
const EMOJI_FISH = '🐟';
const EMOJI_DOOR = '🏡';
const EMOJI_FOOTPRINT = '🐾';
const EMOJI_DOG = '🐶';

let currentLevelIndex = 0;
let playerPos = { x: 0, y: 0 };
let startPos = { x: 0, y: 0 };
let hasFish = false;
let fishTotal = 0;
let fishCollected = 0;
let grid = [];
let sessionGrid = []; 
let solutionPathCoords = []; 
let aiRunning = false;
let aiRunId = 0;
let showingSolution = false;
let gameOver = false;
let visitedCells = [];
let currentScore = 0;
let highScore = localStorage.getItem('catFishHighScore') || 0;

const levelButtonsEl = document.getElementById('level-buttons');
const levelTitleEl = document.getElementById('level-title');
const fishLeftEl = document.getElementById('fish-left');
const currentScoreEl = document.getElementById('current-score');
const highScoreEl = document.getElementById('high-score');
const btnReset = document.getElementById('btn-reset');
const btnSolution = document.getElementById('btn-solution');
const btnAI = document.getElementById('btn-ai');
const AI_COST = 200;
const AI_LABEL = btnAI.innerHTML;
const boardEl = document.getElementById('game-board');

let audioInitialized = false;
let meowSynth, barkSynth, winSynth, keySynth;

// ==========================================================
//  CUSTOM MP3 SOUNDS - put your own audio files here
//  1. Create a folder called "sounds" next to index.html
//  2. Copy your .mp3 files into it
//  3. Write the file path between the quotes below
//  Leave a line as '' to keep the built-in synth sound.
// ==========================================================
const CUSTOM_SOUNDS = {
    move:  '',   // cat takes a step      e.g. 'sounds/meow.mp3'
    fish:  '',   // cat collects a fish   e.g. 'sounds/fish.mp3'
    dog:   'sounds/fahhh.mp3',   // cat meets a dog       e.g. 'sounds/bark.mp3'
    win:   '',   // level completed       e.g. 'sounds/win.mp3'
    music: ''    // background music loop e.g. 'sounds/music.mp3'
};
const SOUND_VOLUME = 0.8;  // 0 (silent) to 1 (full)
const MUSIC_VOLUME = 0.3;

let bgMusic = null;
function startMusic() {
    if (!CUSTOM_SOUNDS.music || bgMusic) return;
    bgMusic = new Audio(CUSTOM_SOUNDS.music);
    bgMusic.loop = true;
    bgMusic.volume = MUSIC_VOLUME;
    bgMusic.play().catch(() => { bgMusic = null; });
}

async function initAudio() {
    startMusic(); // browsers only allow audio after a click or key press
    if (audioInitialized) return;
    await Tone.start();

    meowSynth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.2 }
    }).toDestination();
    meowSynth.volume.value = -2;

    barkSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }
    }).toDestination();
    barkSynth.volume.value = 2;

    keySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }
    }).toDestination();
    keySynth.volume.value = -2;

    winSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.2, release: 1 }
    }).toDestination();
    winSynth.volume.value = -2;

    audioInitialized = true;
}

function playSound(type) {
    // Use your own mp3 if one is set for this sound
    if (CUSTOM_SOUNDS[type]) {
        const clip = new Audio(CUSTOM_SOUNDS[type]);
        clip.volume = SOUND_VOLUME;
        clip.play().catch(() => {});
        return;
    }
    if (!audioInitialized) return;
    const now = Tone.now();
    switch(type) {
        case 'move': 
            meowSynth.triggerAttackRelease("E4", "8n", now);
            meowSynth.frequency.linearRampToValueAtTime(Tone.Frequency("A4").toFrequency(), now + 0.1);
            meowSynth.frequency.linearRampToValueAtTime(Tone.Frequency("E4").toFrequency(), now + 0.2);
            break;
        case 'dog': 
            barkSynth.triggerAttackRelease("G3", "16n", now);
            barkSynth.triggerAttackRelease("G2", "16n", now + 0.15);
            break;
        case 'fish': 
            keySynth.triggerAttackRelease(["E5", "G5", "C6"], "8n"); 
            break;
        case 'win': 
            winSynth.triggerAttackRelease("C4", "8n", now);
            winSynth.triggerAttackRelease("E4", "8n", now + 0.15);
            winSynth.triggerAttackRelease("G4", "8n", now + 0.3);
            winSynth.triggerAttackRelease("C5", "4n", now + 0.45);
            break;
    }
}

const levels = [
    { name: "Level 1 (5x5)", size: 5 },
    { name: "Level 2 (6x6)", size: 6 },
    { name: "Level 3 (7x7)", size: 7 }
];

function initLevelButtons() {
    levelButtonsEl.innerHTML = '';
    levels.forEach((level, index) => {
        const btn = document.createElement('button');
        const isActive = index === currentLevelIndex;
        btn.className = `font-bold py-2 px-4 rounded shadow transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`;
        btn.textContent = level.name;
        btn.onclick = () => loadLevel(index);
        levelButtonsEl.appendChild(btn);
    });
}

function getSafePathCoords(gridData, startX, startY, targetX, targetY) {
    let size = gridData.length;
    let weights = Array(size).fill(0).map(() => Array(size).fill(0).map(() => Math.random() * 2));

    let pq = [{x: startX, y: startY, cost: 0, path: [`${startX},${startY}`]}];
    let visited = new Map();
    visited.set(`${startX},${startY}`, 0);

    let dirs = [[0,1],[0,-1],[1,0],[-1,0]];

    while(pq.length > 0) {
        pq.sort((a, b) => a.cost - b.cost);
        let curr = pq.shift();

        if(curr.x === targetX && curr.y === targetY) {
            return curr.path;
        }

        for(let d of dirs) {
            let nx = curr.x + d[0], ny = curr.y + d[1];
            if(nx >= 0 && nx < size && ny >= 0 && ny < size) {
                let newCost = curr.cost + weights[ny][nx];
                let key = `${nx},${ny}`;
                if(!visited.has(key) || newCost < visited.get(key)) {
                    visited.set(key, newCost);
                    pq.push({x: nx, y: ny, cost: newCost, path: [...curr.path, key]});
                }
            }
        }
    }
    return [];
}

function loadLevel(index) {
    currentLevelIndex = index;
    const levelData = levels[index];
    const size = levelData.size;

    grid = Array(size).fill(null).map(() => Array(size).fill(EMPTY));

    function getRandomEmptyPos() {
        let x, y;
        do {
            x = Math.floor(Math.random() * size);
            y = Math.floor(Math.random() * size);
        } while (grid[y][x] !== EMPTY);
        return {x, y};
    }

    startPos = getRandomEmptyPos();
    grid[startPos.y][startPos.x] = START;
    playerPos = { ...startPos };

    fishTotal = currentLevelIndex === 0 ? 2 : (currentLevelIndex === 1 ? 4 : 5); 
    let fishPositions = [];
    for(let i = 0; i < fishTotal; i++) {
        let fPos = getRandomEmptyPos();
        grid[fPos.y][fPos.x] = FISH;
        fishPositions.push(fPos);
    }

    // Place the house far from the start so the route is longer
    let doorPos;
    let doorTries = 0;
    do {
        doorPos = getRandomEmptyPos();
        doorTries++;
    } while (doorTries < 50 && (Math.abs(doorPos.x - startPos.x) + Math.abs(doorPos.y - startPos.y)) < size - 1);
    grid[doorPos.y][doorPos.x] = DOOR_EXIT;

    boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    levelTitleEl.textContent = levelData.name;

    // Build the guaranteed safe route and remember which side of each tile it enters from
    let safeCoords = new Set();
    let safeEntries = {}; // "x,y" -> Set of dog types that would block the safe route
    let segments = [];
    let currentP = startPos;

    for (let fish of fishPositions) {
        segments.push(getSafePathCoords(grid, currentP.x, currentP.y, fish.x, fish.y));
        currentP = fish;
    }
    segments.push(getSafePathCoords(grid, currentP.x, currentP.y, doorPos.x, doorPos.y));

    segments.forEach(path => {
        path.forEach((p, i) => {
            safeCoords.add(p);
            if (i > 0) {
                const [px, py] = path[i - 1].split(',').map(Number);
                const [cx, cy] = p.split(',').map(Number);
                const dx = cx - px, dy = cy - py;
                let blockedBy;
                if (dy === 1) blockedBy = DOG_UP;
                else if (dy === -1) blockedBy = DOG_DOWN;
                else if (dx === 1) blockedBy = DOG_LEFT;
                else blockedBy = DOG_RIGHT;
                if (!safeEntries[p]) safeEntries[p] = new Set();
                safeEntries[p].add(blockedBy);
            }
        });
    });

    solutionPathCoords = Array.from(safeCoords);

    // Which neighbour does each dog type guard?
    const dogSide = {
        [DOG_UP]:    { dx: 0,  dy: -1 },
        [DOG_DOWN]:  { dx: 0,  dy: 1 },
        [DOG_LEFT]:  { dx: -1, dy: 0 },
        [DOG_RIGHT]: { dx: 1,  dy: 0 }
    };

    // Difficulty settings per level
    const pathDogChance = [0.6, 0.75, 0.9][index];

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (grid[y][x] !== EMPTY) continue;

            const key = `${x},${y}`;
            const onPath = safeCoords.has(key);

            // Only sides that face a real neighbouring tile are useful
            const usefulSides = DOG_TYPES.filter(t => {
                const nx = x + dogSide[t].dx, ny = y + dogSide[t].dy;
                return nx >= 0 && nx < size && ny >= 0 && ny < size;
            });

            if (onPath) {
                // Dogs on the safe route guard sides the safe route does NOT use,
                // so the level always stays solvable but shortcuts and detours become risky
                const used = safeEntries[key] || new Set();
                const options = usefulSides.filter(t => !used.has(t));
                if (options.length > 0 && Math.random() < pathDogChance) {
                    grid[y][x] = options[Math.floor(Math.random() * options.length)];
                }
            } else {
                // Off-route tiles: dogs almost everywhere, denser near the house
                const distToHouse = Math.max(Math.abs(x - doorPos.x), Math.abs(y - doorPos.y));
                let spawnChance;
                if (distToHouse <= 2) spawnChance = 1.0;
                else if (distToHouse === 3) spawnChance = 0.95;
                else spawnChance = 0.85;

                if (Math.random() < spawnChance) {
                    // 75% of the time, guard the side that faces the safe route
                    const towardRoute = usefulSides.filter(t => {
                        const nx = x + dogSide[t].dx, ny = y + dogSide[t].dy;
                        return safeCoords.has(`${nx},${ny}`);
                    });
                    let pick;
                    if (towardRoute.length > 0 && Math.random() < 0.75) {
                        pick = towardRoute[Math.floor(Math.random() * towardRoute.length)];
                    } else {
                        pick = usefulSides[Math.floor(Math.random() * usefulSides.length)];
                    }
                    grid[y][x] = pick;
                }
            }
        }
    }

    sessionGrid = grid.map(row => [...row]);

    updateScoreDisplay();
    resetGameState(false);
    initLevelButtons(); 
    renderBoard();
}

function updateScoreDisplay() {
    currentScoreEl.textContent = currentScore;
    highScoreEl.textContent = highScore;

    // AI Solve is greyed out until the player has enough points
    const locked = currentScore < AI_COST;
    btnAI.classList.toggle('opacity-50', locked);
    btnAI.classList.toggle('cursor-not-allowed', locked);
    btnAI.title = locked ? `You need ${AI_COST} points to use AI Solve` : '';
}

function resetGameState(isPenalty = true) {
    aiRunning = false; // any reset or new level stops the AI
    playerPos = { ...startPos };
    hasFish = false;
    fishCollected = 0;
    gameOver = false;
    showingSolution = false;
    visitedCells = [];
    fishLeftEl.textContent = fishTotal;

    if (isPenalty) {
        currentScore = Math.max(0, currentScore - 50); // Dog hit penalty
        updateScoreDisplay();
    }

    if (sessionGrid.length > 0) {
        grid = sessionGrid.map(row => [...row]);
    }
    renderBoard();
}

function renderBoard() {
    boardEl.innerHTML = '';
    const size = levels[currentLevelIndex].size;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const cellVal = grid[y][x];
            const cellDiv = document.createElement('div');
            cellDiv.className = 'grid-cell';
            cellDiv.dataset.x = x;
            cellDiv.dataset.y = y;

            if (!gameOver && !aiRunning && Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y) === 1) {
                cellDiv.classList.add('cell-adjacent');
            }

            let cellContent = '';

            if (x === playerPos.x && y === playerPos.y) {
                cellDiv.classList.add('cell-start');
                cellContent = EMOJI_PLAYER;
            }

            if (x === startPos.x && y === startPos.y) {
                 cellDiv.style.backgroundColor = 'var(--cell-start-bg)'; 
                 cellDiv.style.opacity = '0.5';
            }

            if (cellVal === FISH) {
                cellContent = EMOJI_FISH;
                cellDiv.classList.add('cell-water');
            } else if (cellVal === DOOR_EXIT) {
                if (cellContent === EMOJI_PLAYER) {
                    cellContent = `<span style="position: absolute; opacity: 0.5; font-size: 1.5em;">${EMOJI_DOOR}</span><span style="position: absolute; z-index: 10;">${EMOJI_PLAYER}</span>`;
                } else {
                    cellContent = `<span style="font-size: 1.5em;">${EMOJI_DOOR}</span>`;
                }
                if (hasFish) cellDiv.classList.add('door-open'); 
            } 

            if (visitedCells.some(pos => pos.x === x && pos.y === y)) {
                if (cellContent === '') {
                    cellContent = `<span class="footprint">${EMOJI_FOOTPRINT}</span>`;
                }
            }

            if (cellContent.toString().includes('<')) {
                cellDiv.innerHTML = cellContent;
            } else {
                cellDiv.textContent = cellContent;
            }

            if (showingSolution && DOG_TYPES.includes(cellVal)) {
                let animClass = '';
                if (cellVal === DOG_UP) animClass = 'dog-revealed-up';
                if (cellVal === DOG_DOWN) animClass = 'dog-revealed-down';
                if (cellVal === DOG_LEFT) animClass = 'dog-revealed-left';
                if (cellVal === DOG_RIGHT) animClass = 'dog-revealed-right';
                cellDiv.innerHTML += `<span class="${animClass}">${EMOJI_DOG}</span>`;
            }

            boardEl.appendChild(cellDiv);
        }
    }
}

function movePlayer(dx, dy, fromAI = false) {
    if (gameOver) return;
    if (aiRunning && !fromAI) return; // player input is locked while the AI plays

    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;
    const size = levels[currentLevelIndex].size;

    if (newX < 0 || newX >= size || newY < 0 || newY >= size) return;

    if (!visitedCells.some(pos => pos.x === playerPos.x && pos.y === playerPos.y)) {
         visitedCells.push({ x: playerPos.x, y: playerPos.y });
    }

    const targetCell = grid[newY][newX];
    let hitDog = false;
    let dogTypeHit = 0;

    if (DOG_TYPES.includes(targetCell)) {
        if (dy === 1 && targetCell === DOG_UP) { hitDog = true; dogTypeHit = DOG_UP; }
        else if (dy === -1 && targetCell === DOG_DOWN) { hitDog = true; dogTypeHit = DOG_DOWN; }
        else if (dx === 1 && targetCell === DOG_LEFT) { hitDog = true; dogTypeHit = DOG_LEFT; }
        else if (dx === -1 && targetCell === DOG_RIGHT) { hitDog = true; dogTypeHit = DOG_RIGHT; }
    }

    if (hitDog) {
        gameOver = true;
        playSound('dog');

        const cellDiv = boardEl.children[newY * size + newX];
        let animClass = '';
        if (dogTypeHit === DOG_UP) animClass = 'dog-peek-up';
        if (dogTypeHit === DOG_DOWN) animClass = 'dog-peek-down';
        if (dogTypeHit === DOG_LEFT) animClass = 'dog-peek-left';
        if (dogTypeHit === DOG_RIGHT) animClass = 'dog-peek-right';

        cellDiv.innerHTML += `<span class="${animClass}">${EMOJI_DOG}</span>`; 

        setTimeout(() => {
            resetGameState(true); 
        }, 800);
        return;
    }

    if (targetCell === DOOR_EXIT) {
        if (fishCollected >= fishTotal) {
            playSound('win');
            playerPos = { x: newX, y: newY };
            renderBoard();
            winGame();
            return;
        } else {
            playSound('move');
        }
    } else if (targetCell === FISH) {
        playSound('fish');
        fishCollected++;
        hasFish = fishCollected >= fishTotal;
        fishLeftEl.textContent = fishTotal - fishCollected;
        grid[newY][newX] = EMPTY; 
        if (!aiRunning) currentScore += 50; // fish points (not awarded during an AI run)
    } else {
        playSound('move');
    }

    playerPos = { x: newX, y: newY };
    renderBoard();
}

function winGame() {
    if (!aiRunning) currentScore += 100; // finish bonus (not awarded during an AI run)

    if (currentScore > highScore) {
        highScore = currentScore;
        localStorage.setItem('catFishHighScore', highScore);
    }

    updateScoreDisplay();

    setTimeout(() => {
        loadLevel(currentLevelIndex);
    }, 2000);
}

window.addEventListener('keydown', (e) => {
    initAudio(); 
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
    switch(e.key) {
        case 'ArrowUp': movePlayer(0, -1); break;
        case 'ArrowDown': movePlayer(0, 1); break;
        case 'ArrowLeft': movePlayer(-1, 0); break;
        case 'ArrowRight': movePlayer(1, 0); break;
    }
});

document.getElementById('btn-up').addEventListener('click', () => { initAudio(); movePlayer(0, -1); });
document.getElementById('btn-down').addEventListener('click', () => { initAudio(); movePlayer(0, 1); });
document.getElementById('btn-left').addEventListener('click', () => { initAudio(); movePlayer(-1, 0); });
document.getElementById('btn-right').addEventListener('click', () => { initAudio(); movePlayer(1, 0); });

btnReset.addEventListener('click', () => {
    initAudio();
    resetGameState(true);
});

btnSolution.addEventListener('click', () => {
    initAudio();
    currentScore = Math.max(0, currentScore - 100); // Exactly -100 points penalty for showing dogs
    updateScoreDisplay();
    showingSolution = true;
    renderBoard();
    setTimeout(() => {
        showingSolution = false;
        renderBoard();
    }, 1500); 
});

// ---------- AI Solver ----------
function dogBlocks(cellVal, dx, dy) {
    return (cellVal === DOG_UP && dy === 1) ||
           (cellVal === DOG_DOWN && dy === -1) ||
           (cellVal === DOG_LEFT && dx === 1) ||
           (cellVal === DOG_RIGHT && dx === -1);
}

// Breadth-first search over (position, fish collected) to find the shortest safe route
function solveWithAI() {
    const g = sessionGrid;
    const n = g.length;
    const fish = [];
    g.forEach((row, y) => row.forEach((v, x) => { if (v === FISH) fish.push({ x, y }); }));
    const full = (1 << fish.length) - 1;

    const startKey = `${startPos.x},${startPos.y},0`;
    const parent = new Map([[startKey, null]]);
    const queue = [{ x: startPos.x, y: startPos.y, mask: 0 }];
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

    for (let qi = 0; qi < queue.length; qi++) {
        const cur = queue[qi];
        const curKey = `${cur.x},${cur.y},${cur.mask}`;

        for (const [dx, dy] of dirs) {
            const nx = cur.x + dx, ny = cur.y + dy;
            if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;

            const v = g[ny][nx];
            if (dogBlocks(v, dx, dy)) continue;

            let mask = cur.mask;
            if (v === FISH) mask |= 1 << fish.findIndex(f => f.x === nx && f.y === ny);

            const key = `${nx},${ny},${mask}`;
            if (parent.has(key)) continue;
            parent.set(key, { prev: curKey, move: [dx, dy] });

            if (v === DOOR_EXIT && mask === full) {
                const moves = [];
                let k = key;
                while (parent.get(k)) {
                    moves.unshift(parent.get(k).move);
                    k = parent.get(k).prev;
                }
                return moves;
            }
            queue.push({ x: nx, y: ny, mask });
        }
    }
    return null;
}

btnAI.addEventListener('click', () => {
    initAudio();
    if (aiRunning || gameOver) return;

    // Not enough points: show a short message instead of running the AI
    if (currentScore < AI_COST) {
        btnAI.textContent = `Need ${AI_COST} pts (you have ${currentScore})`;
        setTimeout(() => { btnAI.innerHTML = AI_LABEL; }, 1500);
        return;
    }

    currentScore -= AI_COST;
    updateScoreDisplay();

    resetGameState(false); // put the cat back at the start with all fish restored
    const moves = solveWithAI();
    if (!moves) return;

    aiRunning = true;
    const runId = ++aiRunId;
    let step = 0;

    function nextStep() {
        if (!aiRunning || runId !== aiRunId) return; // stopped by reset or new level
        if (step >= moves.length) return;
        const [dx, dy] = moves[step++];
        movePlayer(dx, dy, true);
        setTimeout(nextStep, 300);
    }
    setTimeout(nextStep, 400);
});

// Mouse / touch: click a tile next to the cat to move there
boardEl.addEventListener('click', (e) => {
    const cell = e.target.closest('.grid-cell');
    if (!cell) return;
    initAudio();
    const dx = Number(cell.dataset.x) - playerPos.x;
    const dy = Number(cell.dataset.y) - playerPos.y;
    if (Math.abs(dx) + Math.abs(dy) === 1) movePlayer(dx, dy);
});

const btnTheme = document.getElementById('btn-theme');
let isDarkMode = false;
btnTheme.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    btnTheme.innerHTML = isDarkMode ? '☀️ Day' : '🌙 Night';
});

window.onload = () => {
    loadLevel(0);
};
