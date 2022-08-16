export function up<
  TEntrances extends object,
  TInclude extends __EntranceKey<TEntrances> | EntranceKeyPattern,
  TExclude extends __EntranceKey<TEntrances> | EntranceKeyPattern,
>(
  entrances: TEntrances,
  match: {
    includes: TInclude[];
    excludes: TExclude[];
  },
): Promise<__PickEntrances<TEntrances, TInclude, TExclude>>;
export function up<
  TEntrances extends object,
  TInclude extends __EntranceKey<TEntrances> | EntranceKeyPattern,
>(
  entrances: TEntrances,
  includes: TInclude[],
): Promise<__PickEntrances<TEntrances, TInclude, never>>;
export async function up(
  entrances: object,
  ...args: [string[]] | [{includes: string[]; excludes: string[]}]
): Promise<object> {
  let [{includes, excludes}] = Array.isArray(args[0])
    ? [{includes: args[0], excludes: []}]
    : [args[0]];

  let includeMatchers = includes.map(include => buildMatcher(include));
  let excludeMatchers = excludes.map(exclude => buildMatcher(exclude));

  let entryPromises: Promise<[string, unknown]>[] = [];

  for (let key in entrances) {
    if (
      !includeMatchers.some(matcher => matcher(key)) ||
      excludeMatchers.some(matcher => matcher(key))
    ) {
      continue;
    }

    entryPromises.push(
      Promise.resolve((entrances as any)[key]).then(value => [key, value]),
    );
  }

  return Object.fromEntries(await Promise.all(entryPromises));
}

export type EntranceKeyPattern = `${string}*${string}`;

type __EntranceKey<TEntrances extends object> = Extract<
  keyof TEntrances,
  string
>;

type __PickEntrances<
  TEntrances extends object,
  TInclude extends string,
  TExclude extends string,
> = {
  [TKey in Exclude<
    Extract<keyof TEntrances, KeyPattern<TInclude>>,
    KeyPattern<TExclude>
  >]: Awaited<TEntrances[TKey]>;
};

type KeyPattern<TKeyPattern extends string> =
  TKeyPattern extends `${infer TPrefix}*${infer TPostfix}`
    ? `${TPrefix}${string}${TPostfix}`
    : TKeyPattern;

function buildMatcher(pattern: string): (key: string) => boolean {
  let starIndex = pattern.indexOf('*');

  if (starIndex < 0) {
    return key => key === pattern;
  } else {
    let prefix = pattern.slice(0, starIndex);
    let postfix = pattern.slice(starIndex + 1);

    return key => key.startsWith(prefix) && key.endsWith(postfix);
  }
}
