import match, {
  Any,
  AnyArray,
  AnyBoolean,
  AnyFunction,
  AnyNumber,
  AnyObject,
  AnyString,
  compose,
  strict,
} from '..';

const Loading = Symbol('Loading');

const testCases = <V, R>(
  cases: [V, R][],
  fn: (value: V, result: R) => void
) => {
  cases.forEach(([value, result]) => fn(value, result));
};

describe('Pattern Matching TS', () => {
  it('Should define the match function', () => {
    expect(match).toBeDefined();
  });

  it('Should be chainable', () => {
    const v = match<number, string>(1)
      .case(1, () => 'one')
      .case(2, () => 'two')
      .case(3, () => 'three')
      .default(() => 'five');

    expect(v).toBe('one');
  });

  it('should match object structure', () => {
    interface X {
      loading?: boolean;
      data?: string | null;
      error?: string | null;
    }

    const x: X = {
      loading: true,
    };

    const v = match<X, string>(x)
      .case(
        {
          loading: true,
        },
        () => 'loading'
      )
      .case(
        {
          data: 'data',
        },
        () => 'two'
      )
      .case(
        {
          error: null,
        },
        () => 'three'
      )
      .default(() => 'not found');

    expect(v).toBe('loading');
  });

  it('should match an object with any() value', () => {
    testCases(
      [
        [{ loading: true }, 'loading'],
        [{ data: 'data' }, 'data'],
        [{ error: null }, 'error'],
        [{}, 'not found'],
      ],
      (value, result) => {
        const v = match<any, string>(value)
          .case(
            {
              loading: true,
            },
            () => 'loading'
          )
          .case(
            {
              data: Any,
            },
            () => 'data'
          )
          .case(
            {
              error: Any,
            },
            () => 'error'
          )
          .default(() => 'not found');

        expect(v).toBe(result);
      }
    );
  });

  it('should match different strings', () => {
    testCases(
      [
        [{ value: 'test' }, 1],
        [{ value: 'test2' }, 2],
        [{ value: 'test3' }, 3],
        [{ value: 'test4' }, 4],
        [{ value: 'test5' }, 5],
        [{ value: 'test6' }, 6],
        [{ value: 'any other string' }, 0],
      ],
      (val, res) => {
        const x = match<any, number>(val)
          .case({ value: 'test' }, () => 1)
          .case({ value: 'test2' }, () => 2)
          .case({ value: 'test3' }, () => 3)
          .case({ value: 'test4' }, () => 4)
          .case({ value: 'test5' }, () => 5)
          .case({ value: 'test6' }, () => 6)
          .default(() => 0);

        expect(x).toBe(res);
      }
    );
  });

  it('should match custom symbol types', () => {
    type Response = typeof Loading | { data: string } | { error: string };

    testCases<Response, number>(
      [
        [{ data: 'data' }, 1],
        [{ error: 'error' }, 2],
        [Loading, 3],
      ],
      (val, res) => {
        const x = match<Response, number>(val)
          .case({ data: 'data' }, () => 1)
          .case({ error: 'error' }, () => 2)
          .case(Loading, () => 3)
          .default(() => 4);

        expect(x).toBe(res);
      }
    );
  });

  describe('should match ANY symbols', () =>
    testCases<any, string>(
      [
        [1, 'number'],
        ['test', 'string'],
        [false, 'boolean'],
        [[1, 2, 3], 'array'],
        [() => {}, 'function'],
        [{ test: 1 }, 'object'],
      ],
      (val, res) =>
        it(`should match ${val} to ${res}`, () => {
          const x = match<any, string>(val)
            .case(AnyNumber, () => 'number')
            .case(AnyString, () => 'string')
            .case(AnyBoolean, () => 'boolean')
            .case(AnyArray, () => 'array')
            .case(AnyFunction, () => 'function')
            .case(AnyObject, () => 'object')
            .default(() => 'default');

          expect(x).toBe(res);
        })
    ));

  describe('should match arrays', () =>
    testCases(
      [
        [[1, 2, 3], 'three numbers'],
        [[1, 2], 'any array'],
      ],
      (val, res) =>
        it(`should match ${val} to ${res}`, () => {
          const x = match<number[], string>(val)
            .case([AnyNumber, AnyNumber, AnyNumber], () => 'three numbers')
            .case(AnyObject, () => 'should not match')
            .case(AnyArray, () => 'any array')
            .default(() => 'default');

          expect(x).toBe(res);
        })
    ));

  describe('should validate parsed json', () =>
    testCases(
      [
        ['{"data": "data"}', 'wrong'],
        ['{}', 'wrong'],
        ['{"name": "Mark", "age": "15"}', 'wrong'],
        ['{"name": "Mark", "age": 15}', 'correct'],
      ],
      (val, res) => {
        it(`should match ${val} to ${res}`, () => {
          const parsed = JSON.parse(val);

          const x = match<unknown, string>(parsed)
            .case({ name: AnyString, age: AnyNumber }, () => 'correct')
            .default(() => 'wrong');

          expect(x).toBe(res);
        });
      }
    ));

  describe('Should match nested objects', () =>
    testCases(
      [
        [{ a: { b: { c: 5 } } }, 'matched 5'],
        [{ a: { b: { c: 7 } } }, 'matched any number'],
        [{ a: { b: { c: 'c' } } }, 'default'],
      ],
      (val, res) =>
        it(`should match ${JSON.stringify(val)} to ${res}`, () => {
          const result = match<any, string>(val)
            .case({ a: { b: { c: 5 } } }, () => 'matched 5')
            .case({ a: { b: { c: true } } }, () => 'lolo')
            .case({ a: { b: { c: AnyNumber } } }, () => 'matched any number')
            .default(() => 'default');

          expect(result).toBe(res);
        })
    ));

  describe('should support matcher functions', () =>
    testCases<any, string>(
      [
        [6, 'greater than 5'],
        [2, 'less than 5'],
        [5, 'equal to 5'],
        [{ test: true }, 'invalid'],
      ],
      (val, res) =>
        it(`should match a function to ${res}`, () => {
          const result = match(val)
            .case(
              (x: number) => x > 5,
              () => 'greater than 5'
            )
            .case(
              (x: number) => x < 5,
              () => 'less than 5'
            )
            .case(
              (x: number) => x === 5,
              () => 'equal to 5'
            )
            .default(() => 'invalid');

          expect(result).toBe(res);
        })
    ));

  describe('should allow composing cases', () =>
    testCases<any, boolean>(
      [
        ['5', false],
        ['7', false],
        [4, false],
        [7, true],
      ],
      (val, res) =>
        it(`should match ${val} to ${res}`, () => {
          const result = match(val)
            .case(
              compose(AnyNumber, (x: number) => x > 5),
              () => true
            )
            .case(
              compose(AnyNumber, (x: number) => x < 5),
              () => false
            )
            .default(() => false);

          expect(result).toBe(res);
        })
    ));

  describe('should allow strict cases', () =>
    testCases<any, boolean>(
      [
        [{ test: 1 }, true],
        [{ test: 1, test2: 2 }, false],
      ],
      (val, res) =>
        it(`should match ${val} to ${res}`, () => {
          const result = match(val)
            .case(strict({ test: 1 }), () => true)
            .default(() => false);

          expect(result).toBe(res);
        })
    ));

  describe('should allow unsafe unwrap', () => {
    const value: number | string = 'rew';

    it('should throw in not found', () => {
      const result = () =>
        match(value)
          .case(AnyNumber, (v) => String(v))
          .unwrap();

      expect(result).toThrow();
    });

    it('should unwrap correct result', () => {
      const correct = match<number | string, string>(value)
        .case(AnyNumber, () => 'number')
        .case(AnyString, () => 'string')
        .unwrap();

      expect(correct).toBe('string');
    });
  });

  describe('should be able to convert result to monads', () => {
    it('should convert to Option', () => {
      const some = match(4)
        .case(4, () => 'matched')
        .toOption();

      expect(some.isSome()).toBe(true);

      const none = match(4)
        .case(66, () => 'not matched')
        .toOption();

      expect(none.isNone()).toBe(true);
    });

    it('should convert to Result', () => {
      const ok = match(4)
        .case(4, () => 'matched')
        .toResult();

      expect(ok.isOk()).toBe(true);

      const err = match(4)
        .case(66, () => 'not matched')
        .toResult();

      expect(err.isErr()).toBe(true);
    });
  });

  describe('documentation example', () => {
    it('should parse a user', () => {
      interface User {
        name: string;
        age: number;
      }

      const jsonString = '{ "name": "correct name", "age": 4 }';

      const user = match<unknown, User>(JSON.parse(jsonString))
        .case(
          { name: AnyString, age: AnyNumber },
          (user: unknown) => user as User
        )
        .toResult();

      const val = user.match({
        Ok: (_user) => 'user parsed correctly',
        Err: (_err) => 'handle parse error',
      });

      expect(val).toBe('user parsed correctly')
    });

    it('should not parse an incorrect user', () => {
      interface User {
        name: string;
        age: number;
      }

      const jsonString = '{ "definetly": "not an user" }';

      const user = match<unknown, User>(JSON.parse(jsonString))
        .case(
          { name: AnyString, age: AnyNumber },
          (user: unknown) => user as User
        )
        .toResult();

      const val = user.match({
        Ok: (_user) => 'user parsed correctly',
        Err: (_err) => 'handle parse error',
      });

      expect(val).toBe('handle parse error');
    });
  });
});
