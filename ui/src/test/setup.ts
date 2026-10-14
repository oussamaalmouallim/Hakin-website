import '@testing-library/jest-dom/vitest'

/** Node ≥ 25 expose un `localStorage` global incomplet qui masque celui de jsdom : stockage mémoire de test. */
class StockageMemoire implements Storage {
  private m = new Map<string, string>()
  get length() { return this.m.size }
  clear() { this.m.clear() }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null }
  key(i: number) { return [...this.m.keys()][i] ?? null }
  removeItem(k: string) { this.m.delete(k) }
  setItem(k: string, v: string) { this.m.set(k, String(v)) }
}
for (const nom of ['localStorage', 'sessionStorage'] as const) {
  const s = new StockageMemoire()
  Object.defineProperty(globalThis, nom, { value: s, configurable: true })
  Object.defineProperty(window, nom, { value: s, configurable: true })
}
