import type {AssertTrue, IsEqual} from 'tslang';

import type {UpEntrances} from '../../bld/library/cjs';
import {entrance, up} from '../../bld/library/cjs';

test('should work', async () => {
  class Entrances {
    @entrance
    get foo() {
      return Promise.resolve(123);
    }

    @entrance
    get bar() {
      return Promise.all([this.foo]).then(([foo]) => foo + 456);
    }

    @entrance
    get far() {
      return 'abc';
    }
  }

  const entrances_1 = await up(new Entrances(), ['*']);

  expect(entrances_1.foo).toEqual(123);
  expect(entrances_1.bar).toEqual(579);
  expect(entrances_1.far).toEqual('abc');

  // eslint-disable-next-line @mufan/no-object-literal-type-assertion
  const entrances_2_ref = {} as UpEntrances<Entrances, '*ar', 'far'>;

  const entrances_2 = await up(
    new Entrances(),
    {
      includes: ['*ar'],
      excludes: ['far'],
    },
    entrances_2_ref,
  );

  expect(entrances_2_ref).toBe(entrances_2);

  await expect(entrances_2.foo).resolves.toEqual(123);
  expect(entrances_2.bar).toEqual(579);
  expect(entrances_2.far).toEqual('abc');

  type _ =
    | AssertTrue<
        IsEqual<
          typeof entrances_1,
          {
            foo: number;
            bar: number;
            far: string;
          }
        >
      >
    | AssertTrue<
        IsEqual<
          typeof entrances_2,
          {
            foo: Promise<number>;
            bar: number;
            far: string;
          }
        >
      >;
});

test('should handle instance prototype chain', async () => {
  let invocations: string[] = [];

  class Entrances {
    @entrance
    get baz() {
      invocations.push('baz');
      return this.foo;
    }

    @entrance
    get foo() {
      invocations.push('foo');
      return this.fooAndBar.foo;
    }

    @entrance
    get bar() {
      invocations.push('bar');
      return this.fooAndBar.bar;
    }

    @entrance
    get fooAndBar() {
      invocations.push('foo-bar');

      return {
        foo: 'foo',
        bar: 'bar',
      };
    }
  }

  class XEntrances extends Entrances {
    @entrance
    get x() {
      invocations.push('x');

      return 'x';
    }
  }

  const entrances = await up(new Entrances(), {
    includes: ['*'],
    excludes: ['foo', 'bar', 'fooAndBar'],
  });

  expect(entrances.foo).toBe('foo');
  expect(entrances.fooAndBar).toEqual({foo: 'foo', bar: 'bar'});
  expect(entrances.bar).toBe('bar');
  expect(invocations).toEqual(['baz', 'foo', 'foo-bar', 'bar']);

  invocations = [];

  await up(new Entrances());

  expect(invocations).toEqual(['baz', 'foo', 'foo-bar', 'bar']);

  invocations = [];

  await up(new XEntrances());

  expect(invocations).toEqual(['x', 'baz', 'foo', 'foo-bar', 'bar']);
});
