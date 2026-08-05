export type Unsubscribe = () => void;

export function createCompositeUnsubscribe(unsubscribes: Unsubscribe[]): Unsubscribe {
  let cleaned = false;
  return () => {
    if (cleaned) return;
    cleaned = true;
    for (const unsubscribe of unsubscribes) {
      unsubscribe();
    }
  };
}
