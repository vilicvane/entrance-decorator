const instanceDataSymbol = Symbol();

type EntrancesInstanceData = {
  visitingKeySet: Set<string>;
  cachedEntranceMap: Map<string, unknown>;
};

type EntrancesInstance = {
  [instanceDataSymbol]?: EntrancesInstanceData;
};

export function entrance(
  _prototype: object,
  key: string,
  {get: getter}: PropertyDescriptor,
): PropertyDescriptor {
  if (!getter) {
    throw new Error('Decorator `@entrance` applies to getter only');
  }

  return {
    enumerable: true,
    get(this: EntrancesInstance) {
      let data = this[instanceDataSymbol];

      if (!data) {
        data = {
          visitingKeySet: new Set(),
          cachedEntranceMap: new Map(),
        };

        getEntrancesInstance(this)[instanceDataSymbol] = data;
      }

      const {cachedEntranceMap, visitingKeySet} = data;

      if (cachedEntranceMap.has(key)) {
        return cachedEntranceMap.get(key);
      }

      if (visitingKeySet.has(key)) {
        const circularChainText = [...visitingKeySet, key].join(' -> ');

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

function getEntrancesInstance(object: object): EntrancesInstance;
function getEntrancesInstance(object: object): object {
  const instance = getInstance(object);

  if (typeof instance === 'number') {
    throw new Error('Invalid entrances object');
  }

  return instance;

  function getInstance(object: object): object | number {
    const prototype = Object.getPrototypeOf(object);

    if (prototype === null) {
      return 0;
    }

    const instance = getInstance(prototype);

    if (typeof instance === 'number') {
      if (instance < 1) {
        return instance + 1;
      }
    }

    return object;
  }
}
