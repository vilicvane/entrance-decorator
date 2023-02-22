import type {AssertTrue, IsEqual} from 'tslang';

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

  const entrances_2 = await up(new Entrances(), {
    includes: ['*ar'],
    excludes: ['far'],
  });

  expect((entrances_2 as any).foo).toEqual(undefined);
  expect(entrances_2.bar).toEqual(579);
  expect((entrances_2 as any).far).toEqual(undefined);

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
            bar: number;
          }
        >
      >;
});
