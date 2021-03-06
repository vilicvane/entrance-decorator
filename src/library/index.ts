interface EntranceInstanceData {
  visitingKeySet: Set<string>;
  cachedEntranceMap: Map<string, unknown>;
}

const entranceInstanceDataMap = new WeakMap<object, EntranceInstanceData>();

export function entrance(
  _prototype: object,
  key: string,
  {get: getter}: PropertyDescriptor,
): PropertyDescriptor {
  if (!getter) {
    throw new Error('Decorator `@entrance` applies to getter only');
  }

  return {
    get() {
      let data = entranceInstanceDataMap.get(this);

      if (!data) {
        data = {
          visitingKeySet: new Set(),
          cachedEntranceMap: new Map(),
        };

        entranceInstanceDataMap.set(this, data);
      }

      let {cachedEntranceMap, visitingKeySet} = data;

      if (cachedEntranceMap.has(key)) {
        return cachedEntranceMap.get(key);
      }

      if (visitingKeySet.has(key)) {
        let circularChainText = [...visitingKeySet, key].join(' -> ');

        // This `clear()` here should be redundant: if the code reaches here,
        // this is then not the outermost getter. The set will be cleared by the
        // upper try...catch.
        visitingKeySet.clear();

        throw new Error(`Circular entrances: ${circularChainText}`);
      }

      visitingKeySet.add(key);

      let entrance;

      try {
        entrance = getter.call(this) as unknown;
      } catch (error) {
        // We probably only need to clear the set in the uppermost try...catch.
        // But to write less condition, we do `clear()` in every one of them.
        visitingKeySet.clear();

        throw error;
      }

      visitingKeySet.delete(key);

      cachedEntranceMap.set(key, entrance);

      return entrance;
    },
  };
}

export default entrance;
