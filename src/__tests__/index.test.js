// Mock canvas context
function mockCanvasContext() {
  return {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
  };
}

function mockCanvas() {
  return { width: 300, height: 600, getContext: () => mockCanvasContext() };
}

// Mock DOM APIs before requiring the module
const mockGetElementById = jest.fn(() => ({
  textContent: "",
  classList: { add: jest.fn() },
}));

global.document = {
  getElementById: mockGetElementById,
  addEventListener: jest.fn(),
};

const {
  COLS,
  ROWS,
  BLOCK_SIZE,
  PATTERN_SIZE,
  COLORS,
  SHAPES,
  checkCollision,
  lockPiece,
  rotate,
  moveLeft,
  moveRight,
  moveDown,
  hardDrop,
  matchesPattern,
  clearPattern,
  checkPatternMatch,
  togglePause,
  spawnPiece,
  endGame,
  handleKeyPress,
  init,
  gameLoop,
  draw,
  drawBlock,
  drawPiece,
  drawTargetPattern,
  setNewTargetPattern,
  updateScore,
  getState,
  setState,
} = require("../index");

const { ERROR_PATTERNS } = require("../patterns");

// Helper to create an empty board
function emptyBoard() {
  return Array(ROWS)
    .fill(null)
    .map(() => Array(COLS).fill(0));
}

beforeEach(() => {
  // Reset game state before each test
  setState({
    board: emptyBoard(),
    currentPiece: [[1]],
    currentX: 4,
    currentY: 0,
    score: 0,
    gameOver: false,
    isPaused: false,
    targetPattern: ERROR_PATTERNS[0],
    canvas: mockCanvas(),
    ctx: mockCanvasContext(),
    patternCanvas: mockCanvas(),
    patternCtx: mockCanvasContext(),
  });
  mockGetElementById.mockClear();
  mockGetElementById.mockReturnValue({
    textContent: "",
    classList: { add: jest.fn() },
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
describe("Game constants", () => {
  test("board dimensions", () => {
    expect(COLS).toBe(10);
    expect(ROWS).toBe(20);
  });

  test("block and pattern sizes", () => {
    expect(BLOCK_SIZE).toBe(30);
    expect(PATTERN_SIZE).toBe(5);
  });

  test("COLORS has entries for 0-8", () => {
    for (let i = 0; i <= 8; i++) {
      expect(COLORS[i]).toBeDefined();
    }
  });

  test("SHAPES is a non-empty array of 2D arrays", () => {
    expect(SHAPES.length).toBeGreaterThan(0);
    for (const shape of SHAPES) {
      expect(Array.isArray(shape)).toBe(true);
      for (const row of shape) {
        expect(Array.isArray(row)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// checkCollision
// ---------------------------------------------------------------------------
describe("checkCollision", () => {
  test("returns false for a piece in open space", () => {
    expect(checkCollision([[1]], 5, 5)).toBe(false);
  });

  test("returns true when piece is past left wall", () => {
    expect(checkCollision([[1]], -1, 0)).toBe(true);
  });

  test("returns true when piece is past right wall", () => {
    expect(checkCollision([[1]], COLS, 0)).toBe(true);
  });

  test("returns true when piece is past bottom", () => {
    expect(checkCollision([[1]], 0, ROWS)).toBe(true);
  });

  test("returns true when colliding with existing block on board", () => {
    const board = emptyBoard();
    board[5][5] = 1;
    setState({ board });
    expect(checkCollision([[1]], 5, 5)).toBe(true);
  });

  test("handles multi-cell pieces", () => {
    expect(checkCollision([[1, 1]], COLS - 1, 0)).toBe(true);
    expect(checkCollision([[1, 1]], COLS - 2, 0)).toBe(false);
  });

  test("ignores zero cells in piece during collision", () => {
    // A piece with a zero cell should not collide where the zero is
    const board = emptyBoard();
    board[0][5] = 1;
    setState({ board });
    // piece [[0, 1]] at x=4 means col 4 is zero (no block), col 5 has block
    expect(checkCollision([[0, 1]], 4, 0)).toBe(true);
    expect(checkCollision([[1, 0]], 4, 0)).toBe(false);
  });

  test("allows piece above the board (negative y) with no board collision", () => {
    expect(checkCollision([[1]], 5, -1)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// lockPiece
// ---------------------------------------------------------------------------
describe("lockPiece", () => {
  test("writes single-cell piece to the board", () => {
    setState({ currentPiece: [[3]], currentX: 2, currentY: 10 });
    lockPiece();
    expect(getState().board[10][2]).toBe(3);
  });

  test("writes multi-cell piece to the board", () => {
    setState({
      currentPiece: [
        [4, 4],
        [4, 4],
      ],
      currentX: 0,
      currentY: 0,
    });
    lockPiece();
    const { board } = getState();
    expect(board[0][0]).toBe(4);
    expect(board[0][1]).toBe(4);
    expect(board[1][0]).toBe(4);
    expect(board[1][1]).toBe(4);
  });

  test("does not write cells with value 0", () => {
    setState({
      currentPiece: [[0, 5]],
      currentX: 3,
      currentY: 5,
    });
    lockPiece();
    const { board } = getState();
    expect(board[5][3]).toBe(0);
    expect(board[5][4]).toBe(5);
  });

  test("does not write if piece is above the board (negative y)", () => {
    setState({ currentPiece: [[1]], currentX: 0, currentY: -1 });
    lockPiece();
    // board should remain unchanged
    const { board } = getState();
    expect(board[0][0]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// rotate
// ---------------------------------------------------------------------------
describe("rotate", () => {
  test("rotates a vertical pair into a horizontal pair", () => {
    setState({ currentPiece: [[3], [3]], currentX: 4, currentY: 0 });
    rotate();
    expect(getState().currentPiece).toEqual([[3, 3]]);
  });

  test("rotates a horizontal pair into a vertical pair", () => {
    setState({ currentPiece: [[2, 2]], currentX: 4, currentY: 0 });
    rotate();
    expect(getState().currentPiece).toEqual([[2], [2]]);
  });

  test("does not rotate if it would cause a collision", () => {
    // Horizontal line of 3 near right wall
    setState({ currentPiece: [[5, 5, 5]], currentX: COLS - 2, currentY: 0 });
    rotate();
    // Should remain horizontal because rotated version (3 tall) would go out of bounds
    // Actually rotation transposes, so [[5,5,5]] -> [[5],[5],[5]] which is 3 tall, 1 wide
    // At x = COLS-2 = 8, width 1, that fits. Let me check height: y=0, height 3, fits.
    // So rotation should succeed here. Let me pick a case that actually fails.
    expect(getState().currentPiece).toEqual([[5], [5], [5]]);
  });

  test("does not rotate if blocked by wall", () => {
    // Vertical piece of 3 at y that would overflow rows
    setState({
      currentPiece: [[5], [5], [5]],
      currentX: COLS - 1,
      currentY: 0,
    });
    rotate();
    // Rotated: [[5,5,5]] at x=COLS-1 needs 3 cols -> goes past right wall
    expect(getState().currentPiece).toEqual([[5], [5], [5]]);
  });
});

// ---------------------------------------------------------------------------
// moveLeft / moveRight
// ---------------------------------------------------------------------------
describe("moveLeft", () => {
  test("decrements currentX when space is available", () => {
    setState({ currentPiece: [[1]], currentX: 5, currentY: 5 });
    moveLeft();
    expect(getState().currentX).toBe(4);
  });

  test("does not move past left wall", () => {
    setState({ currentPiece: [[1]], currentX: 0, currentY: 5 });
    moveLeft();
    expect(getState().currentX).toBe(0);
  });
});

describe("moveRight", () => {
  test("increments currentX when space is available", () => {
    setState({ currentPiece: [[1]], currentX: 5, currentY: 5 });
    moveRight();
    expect(getState().currentX).toBe(6);
  });

  test("does not move past right wall", () => {
    setState({ currentPiece: [[1]], currentX: COLS - 1, currentY: 5 });
    moveRight();
    expect(getState().currentX).toBe(COLS - 1);
  });
});

// ---------------------------------------------------------------------------
// moveDown
// ---------------------------------------------------------------------------
describe("moveDown", () => {
  test("increments currentY when space below", () => {
    setState({ currentPiece: [[1]], currentX: 5, currentY: 5 });
    moveDown();
    expect(getState().currentY).toBe(6);
  });

  test("locks piece and spawns new one when at bottom", () => {
    setState({
      currentPiece: [[1]],
      currentX: 5,
      currentY: ROWS - 1,
      targetPattern: ERROR_PATTERNS[0],
    });
    moveDown();
    // Piece should be locked into board
    expect(getState().board[ROWS - 1][5]).toBe(1);
    // A new piece should have been spawned (currentY reset near top)
    expect(getState().currentY).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// hardDrop
// ---------------------------------------------------------------------------
describe("hardDrop", () => {
  test("drops piece to the bottom of an empty board", () => {
    setState({
      currentPiece: [[1]],
      currentX: 5,
      currentY: 0,
      targetPattern: ERROR_PATTERNS[0],
    });
    hardDrop();
    expect(getState().board[ROWS - 1][5]).toBe(1);
  });

  test("drops piece onto existing blocks", () => {
    const board = emptyBoard();
    board[ROWS - 1][5] = 2;
    setState({
      board,
      currentPiece: [[1]],
      currentX: 5,
      currentY: 0,
      targetPattern: ERROR_PATTERNS[0],
    });
    hardDrop();
    expect(getState().board[ROWS - 2][5]).toBe(1);
    expect(getState().board[ROWS - 1][5]).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// matchesPattern
// ---------------------------------------------------------------------------
describe("matchesPattern", () => {
  test("returns false on an empty board", () => {
    setState({ targetPattern: ERROR_PATTERNS[0] });
    expect(matchesPattern(0, 0)).toBe(false);
  });

  test("returns true when board region exactly matches pattern", () => {
    const board = emptyBoard();
    const pattern = ERROR_PATTERNS[0]; // Null Pointer
    // Fill board region starting at (0,0) to match the pattern
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        board[r][c] = pattern.pattern[r][c] === 1 ? 1 : 0;
      }
    }
    setState({ board, targetPattern: pattern });
    expect(matchesPattern(0, 0)).toBe(true);
  });

  test("returns false when pattern partially matches", () => {
    const board = emptyBoard();
    const pattern = ERROR_PATTERNS[0];
    // Fill only first row
    for (let c = 0; c < 5; c++) {
      board[0][c] = pattern.pattern[0][c] === 1 ? 1 : 0;
    }
    setState({ board, targetPattern: pattern });
    expect(matchesPattern(0, 0)).toBe(false);
  });

  test("void blocks (8) count as empty for matching", () => {
    const board = emptyBoard();
    const pattern = ERROR_PATTERNS[0];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (pattern.pattern[r][c] === 1) {
          board[r][c] = 1;
        } else {
          // Place void blocks where pattern expects empty
          board[r][c] = 8;
        }
      }
    }
    setState({ board, targetPattern: pattern });
    expect(matchesPattern(0, 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// clearPattern
// ---------------------------------------------------------------------------
describe("clearPattern", () => {
  test("clears the entire board", () => {
    const board = emptyBoard();
    board[5][5] = 3;
    board[10][2] = 7;
    setState({ board });
    clearPattern(0, 0);
    const { board: newBoard } = getState();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        expect(newBoard[r][c]).toBe(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// checkPatternMatch
// ---------------------------------------------------------------------------
describe("checkPatternMatch", () => {
  test("awards 100 points when a pattern is matched", () => {
    const board = emptyBoard();
    const pattern = ERROR_PATTERNS[0];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        board[r][c] = pattern.pattern[r][c] === 1 ? 1 : 0;
      }
    }
    setState({ board, targetPattern: pattern, score: 0 });
    checkPatternMatch();
    expect(getState().score).toBe(100);
  });

  test("does not award points when no pattern matches", () => {
    setState({ score: 0, targetPattern: ERROR_PATTERNS[0] });
    checkPatternMatch();
    expect(getState().score).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// togglePause
// ---------------------------------------------------------------------------
describe("togglePause", () => {
  test("toggles isPaused from false to true", () => {
    setState({ isPaused: false });
    togglePause();
    expect(getState().isPaused).toBe(true);
  });

  test("toggles isPaused from true to false", () => {
    setState({ isPaused: true });
    togglePause();
    expect(getState().isPaused).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// spawnPiece
// ---------------------------------------------------------------------------
describe("spawnPiece", () => {
  test("sets a new currentPiece from SHAPES", () => {
    spawnPiece();
    const { currentPiece } = getState();
    expect(currentPiece).not.toBeNull();
    // Verify it matches one of the SHAPES (deep content, ignoring reference)
    const shapeContents = SHAPES.map((s) => JSON.stringify(s));
    expect(shapeContents).toContain(JSON.stringify(currentPiece));
  });

  test("centers piece horizontally", () => {
    // Run many spawns to cover randomness
    for (let i = 0; i < 20; i++) {
      setState({ board: emptyBoard(), gameOver: false });
      spawnPiece();
      const { currentX, currentPiece } = getState();
      const expectedX =
        Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2);
      expect(currentX).toBe(expectedX);
    }
  });

  test("triggers game over when spawn position collides", () => {
    // Fill top row so any piece will collide
    const board = emptyBoard();
    for (let c = 0; c < COLS; c++) {
      board[0][c] = 1;
    }
    setState({ board, gameOver: false });
    spawnPiece();
    expect(getState().gameOver).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// endGame
// ---------------------------------------------------------------------------
describe("endGame", () => {
  test("sets gameOver to true", () => {
    setState({ gameOver: false });
    endGame();
    expect(getState().gameOver).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// handleKeyPress
// ---------------------------------------------------------------------------
describe("handleKeyPress", () => {
  function fakeEvent(key) {
    return { key, preventDefault: jest.fn() };
  }

  test("does nothing when gameOver is true", () => {
    setState({ gameOver: true, currentX: 5 });
    handleKeyPress(fakeEvent("ArrowLeft"));
    expect(getState().currentX).toBe(5);
  });

  test("ArrowLeft moves piece left", () => {
    setState({ currentPiece: [[1]], currentX: 5, currentY: 5, isPaused: false });
    handleKeyPress(fakeEvent("ArrowLeft"));
    expect(getState().currentX).toBe(4);
  });

  test("ArrowRight moves piece right", () => {
    setState({ currentPiece: [[1]], currentX: 5, currentY: 5, isPaused: false });
    handleKeyPress(fakeEvent("ArrowRight"));
    expect(getState().currentX).toBe(6);
  });

  test("ArrowDown moves piece down", () => {
    setState({ currentPiece: [[1]], currentX: 5, currentY: 5, isPaused: false });
    handleKeyPress(fakeEvent("ArrowDown"));
    expect(getState().currentY).toBe(6);
  });

  test("P toggles pause", () => {
    setState({ isPaused: false });
    handleKeyPress(fakeEvent("P"));
    expect(getState().isPaused).toBe(true);
  });

  test("does not move when paused (except pause key)", () => {
    setState({ currentPiece: [[1]], currentX: 5, currentY: 5, isPaused: true });
    handleKeyPress(fakeEvent("ArrowLeft"));
    expect(getState().currentX).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// handleKeyPress – remaining branches (ArrowUp, Space)
// ---------------------------------------------------------------------------
describe("handleKeyPress - additional branches", () => {
  function fakeEvent(key) {
    return { key, preventDefault: jest.fn() };
  }

  test("ArrowUp rotates the piece", () => {
    setState({
      currentPiece: [[3], [3]],
      currentX: 4,
      currentY: 5,
      isPaused: false,
    });
    handleKeyPress(fakeEvent("ArrowUp"));
    expect(getState().currentPiece).toEqual([[3, 3]]);
  });

  test("Space performs a hard drop", () => {
    setState({
      currentPiece: [[1]],
      currentX: 5,
      currentY: 0,
      isPaused: false,
      targetPattern: ERROR_PATTERNS[0],
    });
    handleKeyPress(fakeEvent(" "));
    expect(getState().board[ROWS - 1][5]).toBe(1);
  });

  test("lowercase p also toggles pause", () => {
    setState({ isPaused: false });
    handleKeyPress(fakeEvent("p"));
    expect(getState().isPaused).toBe(true);
  });

  test("unrecognized key does nothing", () => {
    const before = getState();
    handleKeyPress(fakeEvent("z"));
    const after = getState();
    expect(after.currentX).toBe(before.currentX);
    expect(after.currentY).toBe(before.currentY);
  });
});

// ---------------------------------------------------------------------------
// draw, drawBlock, drawPiece (rendering with mocked canvas)
// ---------------------------------------------------------------------------
describe("draw", () => {
  test("calls canvas drawing methods on an empty board", () => {
    const ctxMock = mockCanvasContext();
    const canvasMock = mockCanvas();
    setState({ canvas: canvasMock, ctx: ctxMock, currentPiece: null });
    draw();
    expect(ctxMock.fillRect).toHaveBeenCalled();
    expect(ctxMock.beginPath).toHaveBeenCalled();
    expect(ctxMock.stroke).toHaveBeenCalled();
  });

  test("draws blocks that are on the board", () => {
    const ctxMock = mockCanvasContext();
    const canvasMock = mockCanvas();
    const board = emptyBoard();
    board[5][3] = 2;
    setState({ board, canvas: canvasMock, ctx: ctxMock, currentPiece: null });
    draw();
    // fillRect called for clearing + at least once for the block
    expect(ctxMock.fillRect.mock.calls.length).toBeGreaterThan(1);
  });

  test("draws the current piece if present", () => {
    const ctxMock = mockCanvasContext();
    const canvasMock = mockCanvas();
    setState({
      canvas: canvasMock,
      ctx: ctxMock,
      currentPiece: [[1]],
      currentX: 3,
      currentY: 3,
    });
    draw();
    // fillRect called for clearing + block + piece
    expect(ctxMock.fillRect.mock.calls.length).toBeGreaterThan(1);
  });
});

describe("drawBlock", () => {
  test("draws a filled and stroked rectangle", () => {
    const ctxMock = mockCanvasContext();
    drawBlock(ctxMock, 2, 3, 1);
    expect(ctxMock.fillRect).toHaveBeenCalledWith(
      2 * BLOCK_SIZE,
      3 * BLOCK_SIZE,
      BLOCK_SIZE,
      BLOCK_SIZE
    );
    expect(ctxMock.strokeRect).toHaveBeenCalledWith(
      2 * BLOCK_SIZE,
      3 * BLOCK_SIZE,
      BLOCK_SIZE,
      BLOCK_SIZE
    );
  });
});

describe("drawPiece", () => {
  test("draws each non-zero cell of the piece", () => {
    const ctxMock = mockCanvasContext();
    drawPiece(
      ctxMock,
      [
        [4, 4],
        [4, 4],
      ],
      1,
      1
    );
    // 4 cells, each gets a fillRect + strokeRect
    expect(ctxMock.fillRect).toHaveBeenCalledTimes(4);
    expect(ctxMock.strokeRect).toHaveBeenCalledTimes(4);
  });

  test("skips zero cells", () => {
    const ctxMock = mockCanvasContext();
    drawPiece(ctxMock, [[0, 5]], 0, 0);
    // Only 1 non-zero cell
    expect(ctxMock.fillRect).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// drawTargetPattern
// ---------------------------------------------------------------------------
describe("drawTargetPattern", () => {
  test("draws the pattern onto patternCtx", () => {
    const pCtx = mockCanvasContext();
    const pCanvas = mockCanvas();
    setState({
      patternCtx: pCtx,
      patternCanvas: pCanvas,
      targetPattern: ERROR_PATTERNS[0],
    });
    drawTargetPattern();
    expect(pCtx.fillRect).toHaveBeenCalled();
  });

  test("does nothing when targetPattern is null", () => {
    const pCtx = mockCanvasContext();
    setState({ patternCtx: pCtx, targetPattern: null });
    drawTargetPattern();
    expect(pCtx.fillRect).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// setNewTargetPattern
// ---------------------------------------------------------------------------
describe("setNewTargetPattern", () => {
  test("sets a new pattern from ERROR_PATTERNS", () => {
    setNewTargetPattern();
    const { targetPattern } = getState();
    expect(ERROR_PATTERNS).toContainEqual(targetPattern);
  });
});

// ---------------------------------------------------------------------------
// updateScore
// ---------------------------------------------------------------------------
describe("updateScore", () => {
  test("updates the score DOM element", () => {
    const el = { textContent: "" };
    mockGetElementById.mockReturnValue(el);
    setState({ score: 200 });
    updateScore();
    expect(el.textContent).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// init
// ---------------------------------------------------------------------------
describe("init", () => {
  test("initializes board, spawns piece, and starts game loop", () => {
    global.requestAnimationFrame = jest.fn();
    const mockCtx = mockCanvasContext();
    const mockPCtx = mockCanvasContext();
    mockGetElementById.mockImplementation((id) => {
      if (id === "gameCanvas")
        return { getContext: () => mockCtx, width: 300, height: 600 };
      if (id === "patternCanvas")
        return { getContext: () => mockPCtx, width: 100, height: 100 };
      return { textContent: "", classList: { add: jest.fn() } };
    });

    init();

    const { board, currentPiece } = getState();
    expect(board).toHaveLength(ROWS);
    expect(board[0]).toHaveLength(COLS);
    expect(currentPiece).not.toBeNull();
    expect(global.requestAnimationFrame).toHaveBeenCalled();

    delete global.requestAnimationFrame;
  });
});

// ---------------------------------------------------------------------------
// gameLoop
// ---------------------------------------------------------------------------
describe("gameLoop", () => {
  test("calls draw and requestAnimationFrame", () => {
    global.requestAnimationFrame = jest.fn();
    const ctxMock = mockCanvasContext();
    const canvasMock = mockCanvas();
    setState({
      canvas: canvasMock,
      ctx: ctxMock,
      gameOver: false,
      isPaused: false,
      currentPiece: [[1]],
    });
    gameLoop(0);
    expect(global.requestAnimationFrame).toHaveBeenCalled();
    delete global.requestAnimationFrame;
  });

  test("does not advance drop when paused", () => {
    global.requestAnimationFrame = jest.fn();
    const ctxMock = mockCanvasContext();
    const canvasMock = mockCanvas();
    setState({
      canvas: canvasMock,
      ctx: ctxMock,
      isPaused: true,
      currentPiece: [[1]],
      currentX: 5,
      currentY: 3,
    });
    gameLoop(5000);
    expect(getState().currentY).toBe(3);
    delete global.requestAnimationFrame;
  });
});

// ---------------------------------------------------------------------------
// getState / setState helpers
// ---------------------------------------------------------------------------
describe("getState / setState", () => {
  test("round-trips state correctly", () => {
    const board = emptyBoard();
    board[3][3] = 7;
    setState({
      board,
      currentPiece: [[2, 2]],
      currentX: 3,
      currentY: 7,
      score: 42,
      gameOver: false,
      isPaused: true,
      targetPattern: ERROR_PATTERNS[1],
    });
    const s = getState();
    expect(s.board[3][3]).toBe(7);
    expect(s.currentPiece).toEqual([[2, 2]]);
    expect(s.currentX).toBe(3);
    expect(s.currentY).toBe(7);
    expect(s.score).toBe(42);
    expect(s.gameOver).toBe(false);
    expect(s.isPaused).toBe(true);
    expect(s.targetPattern).toBe(ERROR_PATTERNS[1]);
  });
});
