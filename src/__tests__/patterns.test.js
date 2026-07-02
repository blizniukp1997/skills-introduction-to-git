const { ERROR_PATTERNS } = require("../patterns");

describe("ERROR_PATTERNS", () => {
  test("contains at least one pattern", () => {
    expect(ERROR_PATTERNS.length).toBeGreaterThan(0);
  });

  test("each pattern has a name and a 5x5 grid", () => {
    for (const entry of ERROR_PATTERNS) {
      expect(typeof entry.name).toBe("string");
      expect(entry.name.length).toBeGreaterThan(0);

      expect(entry.pattern).toHaveLength(5);
      for (const row of entry.pattern) {
        expect(row).toHaveLength(5);
      }
    }
  });

  test("pattern cells are only 0 or 1", () => {
    for (const entry of ERROR_PATTERNS) {
      for (const row of entry.pattern) {
        for (const cell of row) {
          expect([0, 1]).toContain(cell);
        }
      }
    }
  });

  test("each pattern has at least one filled cell", () => {
    for (const entry of ERROR_PATTERNS) {
      const filledCount = entry.pattern.flat().filter((c) => c === 1).length;
      expect(filledCount).toBeGreaterThan(0);
    }
  });

  test("pattern names are unique", () => {
    const names = ERROR_PATTERNS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  test("contains expected well-known patterns", () => {
    const names = ERROR_PATTERNS.map((p) => p.name);
    expect(names).toContain("Null Pointer");
    expect(names).toContain("Memory Leak");
    expect(names).toContain("Infinite Loop");
    expect(names).toContain("Syntax Error");
  });
});
