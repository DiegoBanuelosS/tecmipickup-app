export type AutocompleteEntry = {
  phrase: string;
  weight: number;
};

type TrieNode = {
  children: Map<string, TrieNode>;
  entry: AutocompleteEntry | null;
};

function createNode(): TrieNode {
  return { children: new Map(), entry: null };
}

/** Minúsculas y sin acentos; mantiene el largo 1:1 con el texto original. */
export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Árbol de prefijos (trie) para autocompletado.
 * Cada frase se indexa normalizada, pero se conserva la forma original
 * (con acentos y mayúsculas) para mostrarla como sugerencia.
 */
export class AutocompleteTree {
  private root = createNode();

  insert(phrase: string, weight = 1) {
    const key = normalizeText(phrase);
    if (!key) {
      return;
    }

    let node = this.root;
    for (const char of key) {
      let next = node.children.get(char);
      if (!next) {
        next = createNode();
        node.children.set(char, next);
      }
      node = next;
    }

    if (!node.entry || node.entry.weight < weight) {
      node.entry = { phrase, weight };
    }
  }

  /** Devuelve la frase con mayor peso que extiende el prefijo, si existe. */
  complete(prefix: string): string | null {
    const key = normalizeText(prefix);
    if (!key) {
      return null;
    }

    let node = this.root;
    for (const char of key) {
      const next = node.children.get(char);
      if (!next) {
        return null;
      }
      node = next;
    }

    let best: AutocompleteEntry | null = null;
    const stack: TrieNode[] = [node];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current.entry && (!best || current.entry.weight > best.weight)) {
        best = current.entry;
      }
      current.children.forEach((child) => stack.push(child));
    }

    return best?.phrase ?? null;
  }
}
