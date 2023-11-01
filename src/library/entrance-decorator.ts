const instance_data = Symbol();

export const decorated_getter_flag = Symbol();

type EntrancesInstanceData = {
  visitingNameSet: Set<string | symbol>;
  cachedEntranceMap: Map<string | symbol, unknown>;
};

type EntrancesInstance = {
  [instance_data]?: EntrancesInstanceData;
};

export function entrance<T extends () => unknown>(
  getter: T,
  context: ClassGetterDecoratorContext,
): T;
export function entrance(
  getter: () => unknown,
  {kind, name}: ClassGetterDecoratorContext,
): typeof getter {
  if (kind !== 'getter') {
    throw new Error('Decorator `@entrance` only applies to getters');
  }

  decorated[decorated_getter_flag] = true;

  return decorated;

  function decorated(this: EntrancesInstance): unknown {
    let data = this[instance_data];

    if (!data) {
      data = {
        visitingNameSet: new Set(),
        cachedEntranceMap: new Map(),
      };

      getEntrancesInstance(this)[instance_data] = data;
    }

    const {cachedEntranceMap, visitingNameSet} = data;

    if (cachedEntranceMap.has(name)) {
      return cachedEntranceMap.get(name);
    }

    if (visitingNameSet.has(name)) {
      const circularChainText = [...visitingNameSet, name].join(' -> ');

      // This `clear()` here should be redundant: if the code reaches here,
      // this is then not the outermost getter. The set will be cleared by the
      // upper try...catch.
      visitingNameSet.clear();

      throw new Error(`Circular entrances: ${circularChainText}`);
    }

    visitingNameSet.add(name);

    let entrance;

    try {
      entrance = getter.call(this) as unknown;
    } catch (error) {
      // We probably only need to clear the set in the uppermost try...catch.
      // But to write less condition, we do `clear()` in every one of them.
      visitingNameSet.clear();

      throw error;
    }

    visitingNameSet.delete(name);

    cachedEntranceMap.set(name, entrance);

    return entrance;
  }
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
