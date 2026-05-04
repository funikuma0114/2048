const SIZE = 4;
let board = [];
let score = 0;
let best = Number(localStorage.getItem("best2048") || 0);

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlayEl = document.getElementById("overlay");
const overlayTextEl = document.getElementById("overlay-text");
const retryBtn = document.getElementById("retry");
const newGameBtn = document.getElementById("new-game");

bestEl.textContent = String(best);

function initGame() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  score = 0;
  hideOverlay();
  addRandomTile();
  addRandomTile();
  render();
}

function addRandomTile() {
  const empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (!empty.length) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function slideAndMerge(line) {
  const compact = line.filter((v) => v !== 0);
  const merged = [];
  let lineScore = 0;

  for (let i = 0; i < compact.length; i++) {
    if (compact[i] === compact[i + 1]) {
      const value = compact[i] * 2;
      merged.push(value);
      lineScore += value;
      i++;
    } else {
      merged.push(compact[i]);
    }
  }

  while (merged.length < SIZE) merged.push(0);
  return { line: merged, gained: lineScore };
}

function rotateRight(mat) {
  const out = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      out[c][SIZE - 1 - r] = mat[r][c];
    }
  }
  return out;
}

function moveLeft() {
  let moved = false;
  let gained = 0;
  const next = board.map((row) => {
    const { line, gained: g } = slideAndMerge(row);
    if (line.some((v, i) => v !== row[i])) moved = true;
    gained += g;
    return line;
  });
  board = next;
  score += gained;
  return moved;
}

function move(direction) {
  const rotations = { left: 0, up: 3, right: 2, down: 1 }[direction];

  for (let i = 0; i < rotations; i++) board = rotateRight(board);
  const moved = moveLeft();
  for (let i = 0; i < (4 - rotations) % 4; i++) board = rotateRight(board);

  if (moved) {
    addRandomTile();
    if (score > best) {
      best = score;
      localStorage.setItem("best2048", String(best));
    }
    render();
    const state = checkState();
    if (state !== "playing") showOverlay(state);
  }
}

function hasMoves() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

function checkState() {
  if (board.flat().some((v) => v >= 2048)) return "win";
  if (!hasMoves()) return "lose";
  return "playing";
}

function showOverlay(state) {
  overlayTextEl.textContent = state === "win" ? "2048達成！" : "ゲームオーバー";
  overlayEl.classList.remove("hidden");
}

function hideOverlay() {
  overlayEl.classList.add("hidden");
}

function render() {
  scoreEl.textContent = String(score);
  bestEl.textContent = String(best);
  boardEl.innerHTML = "";

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = board[r][c];
      const cell = document.createElement("div");
      cell.className = `cell ${v > 2048 ? "v-super" : `v-${v}`}`;
      cell.textContent = v === 0 ? "" : String(v);
      boardEl.appendChild(cell);
    }
  }
}

window.addEventListener("keydown", (e) => {
  const keyMap = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
  };
  const direction = keyMap[e.key];
  if (!direction) return;
  e.preventDefault();
  move(direction);
});

let startX = 0;
let startY = 0;
boardEl.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  startX = t.clientX;
  startY = t.clientY;
});

boardEl.addEventListener("touchend", (e) => {
  const t = e.changedTouches[0];
  const dx = t.clientX - startX;
  const dy = t.clientY - startY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (Math.max(absX, absY) < 20) return;
  if (absX > absY) move(dx > 0 ? "right" : "left");
  else move(dy > 0 ? "down" : "up");
});

retryBtn.addEventListener("click", initGame);
newGameBtn.addEventListener("click", initGame);

initGame();
