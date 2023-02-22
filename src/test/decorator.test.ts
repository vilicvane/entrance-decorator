import {entrance} from '../../bld/library/cjs';

test('should work', () => {
  const invocations: string[] = [];

  class Entrances {
    @entrance
    get foo() {
      invocations.push('foo');

      return {
        id: 'foo',
      };
    }

    @entrance
    get bar() {
      invocations.push('bar');

      return {
        id: 'bar',
      };
    }
  }

  const entrances = new Entrances();

  expect(entrances.foo).toEqual({id: 'foo'});
  expect(entrances.bar).toEqual({id: 'bar'});
  expect(entrances.foo === entrances.foo).toBe(true);
  expect(entrances.foo === entrances.bar).toBe(false);
  expect(invocations).toEqual(['foo', 'bar']);
});

test('should work with subclasses', () => {
  const invocations: string[] = [];

  class Entrances {
    @entrance
    get foo() {
      invocations.push('foo');

      return {
        id: 'foo',
      };
    }

    @entrance
    get yoha() {
      invocations.push('yoha');

      return {
        id: 'yoha',
      };
    }
  }

  class ExtendedEntrances extends Entrances {
    @entrance
    get bar() {
      invocations.push('bar');

      return {
        id: 'bar',
      };
    }

    @entrance
    override get yoha() {
      invocations.push('extended-yoha');

      return {
        id: 'extended-yoha',
      };
    }
  }

  const entrances = new ExtendedEntrances();

  expect(entrances.foo).toEqual({id: 'foo'});
  expect(entrances.bar).toEqual({id: 'bar'});
  expect(entrances.yoha).toEqual({id: 'extended-yoha'});
  expect(entrances.foo === entrances.foo).toBe(true);
  expect(entrances.foo === entrances.bar).toBe(false);
  expect(entrances.foo === entrances.yoha).toBe(false);
  expect(invocations).toEqual(['foo', 'bar', 'extended-yoha']);
});

test('should throw on circular entrances', () => {
  class Entrances {
    @entrance
    get foo(): unknown {
      return this.yoha;
    }

    @entrance
    get bar(): unknown {
      return this.foo;
    }

    @entrance
    get yoha(): unknown {
      return this.foo;
    }
  }

  const entrances = new Entrances();

  expect(() => entrances.yoha).toThrow(
    /^Circular entrances: yoha -> foo -> yoha$/,
  );
});

test('should clear visiting set if getter throws', () => {
  class Entrances {
    @entrance
    get foo(): unknown {
      throw new Error('foo error');
    }
  }

  const entrances = new Entrances();

  expect(() => entrances.foo).toThrow('foo error');

  // Throw twice, if visiting set was not cleared, this should result in
  // circular entrances error.
  expect(() => entrances.foo).toThrow('foo error');
});
