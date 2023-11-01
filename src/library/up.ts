import {decorated_getter_flag} from './entrance-decorator.js';

export function up<
  TEntrances extends object,
  TInclude extends EntranceKey<TEntrances> | EntranceKeyPattern,
>(
  entrances: TEntrances,
  includes?: TInclude[],
  ref?: UpEntrances<TEntrances, TInclude, never>,
): Promise<UpEntrances<TEntrances, TInclude, never>>;
export function up<
  TEntrances extends object,
  TInclude extends EntranceKey<TEntrances> | EntranceKeyPattern,
  TExclude extends EntranceKey<TEntrances> | EntranceKeyPattern,
>(
  entrances: TEntrances,
  match: {
    includes: TInclude[];
    excludes: TExclude[];
  },
  ref?: UpEntrances<TEntrances, TInclude, TExclude>,
): Promise<UpEntrances<TEntrances, TInclude, TExclude>>;
export async function up(
  entrances: object,
  arg: string[] | {includes: string[]; excludes: string[]} = ['*'],
  ref?: object,
): Promise<object> {
  const {includes, excludes} = Array.isArray(arg)
    ? {includes: arg, excludes: []}
    : arg;

  const includeMatchers = includes.map(include => buildMatcher(include));
  const excludeMatchers = excludes.map(exclude => buildMatcher(exclude));

  const entryPromises: Promise<[string, PropertyDescriptor]>[] = [];

  const keys = getPrototypes(entrances)
    .flatMap(prototype =>
      Object.entries(Object.getOwnPropertyDescriptors(prototype)).filter(
        ([_name, {get}]) => (get ? (get as any)[decorated_getter_flag] : false),
      ),
    )
    .map(([name]) => name);

  for (const key of keys) {
    if (
      !includeMatchers.some(matcher => matcher(key)) ||
      excludeMatchers.some(matcher => matcher(key))
    ) {
      continue;
    }

    entryPromises.push(
      Promise.resolve((entrances as any)[key]).then(value => [
        key,
        {
          get() {
            return value;
          },
        },
      ]),
    );
  }

  const entries = await Promise.all(entryPromises);

  if (ref) {
    Object.setPrototypeOf(ref, entrances);

    for (const [key, descriptor] of entries) {
      Object.defineProperty(ref, key, descriptor);
    }

    return ref;
  } else {
    return Object.create(entrances, Object.fromEntries(entries));
  }
}

export type EntranceKeyPattern = `${string}*${string}`;

type EntranceKey<TEntrances extends object> = Extract<keyof TEntrances, string>;

export type UpEntrances<
  TEntrances extends object,
  TInclude extends string,
  TExclude extends string,
> = {
  [TKey in keyof TEntrances]: TKey extends KeyPattern<TInclude>
    ? TKey extends KeyPattern<TExclude>
      ? TEntrances[TKey]
      : Awaited<TEntrances[TKey]>
    : TEntrances[TKey];
};

type KeyPattern<TKeyPattern extends string> =
  TKeyPattern extends `${infer TPrefix}*${infer TPostfix}`
    ? `${TPrefix}${string}${TPostfix}`
    : TKeyPattern;

function buildMatcher(pattern: string): (key: string) => boolean {
  const starIndex = pattern.indexOf('*');

  if (starIndex < 0) {
    return key => key === pattern;
  } else {
    const prefix = pattern.slice(0, starIndex);
    const postfix = pattern.slice(starIndex + 1);

    return key => key.startsWith(prefix) && key.endsWith(postfix);
  }
}

function getPrototypes(object: object): object[] {
  const prototypes: object[] = [];

  // eslint-disable-next-line no-cond-assign
  while ((object = Object.getPrototypeOf(object))) {
    if (object === Object.prototype) {
      break;
    }

    prototypes.push(object);
  }

  return prototypes;
}
