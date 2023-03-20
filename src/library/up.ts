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
): Promise<UpEntrances<TEntrances, TInclude, TExclude>>;
export function up<
  TEntrances extends object,
  TInclude extends EntranceKey<TEntrances> | EntranceKeyPattern,
>(
  entrances: TEntrances,
  includes: TInclude[],
): Promise<UpEntrances<TEntrances, TInclude, never>>;
export async function up(
  entrances: object,
  ...args: [string[]] | [{includes: string[]; excludes: string[]}]
): Promise<object> {
  const [{includes, excludes}] = Array.isArray(args[0])
    ? [{includes: args[0], excludes: []}]
    : [args[0]];

  const includeMatchers = includes.map(include => buildMatcher(include));
  const excludeMatchers = excludes.map(exclude => buildMatcher(exclude));

  const entryPromises: Promise<[string, PropertyDescriptor]>[] = [];

  for (const key in entrances) {
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

  return Object.create(
    entrances,
    Object.fromEntries(await Promise.all(entryPromises)),
  );
}

export type EntranceKeyPattern = `${string}*${string}`;

type EntranceKey<TEntrances extends object> = Extract<keyof TEntrances, string>;

type UpEntrances<
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