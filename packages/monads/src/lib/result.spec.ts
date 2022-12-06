
import Result, { Ok, Err } from './result';

describe('Result Monad', () => {
  test('Result Monad', () => {
    const r = Ok(5)
      .map((x) => x + 1)
      .flatMap((_) => Err('wrong value'));

    expect(Result.isResult(r)).toBe(true);
    expect(r.isErr()).toBe(true);
  });

  test('tryCatch method', () => {
    const result: Result<number, Error> = Result.tryCatch<number, Error>(() => {
      // not throwing anything
      return 1 + 1;
    });

    expect(result.isOk()).toBe(true);

    const result2: Result<number, Error> = Result.tryCatch<number, Error>(
      () => {
        // throwing an error
        throw new Error('error');
      }
    );

    expect(result2.isErr()).toBe(true);
  });

  test('flatMap method', () => {
    const rightFn = jest.fn();
    const leftFn = jest.fn();

    const result: Result<number, string> = Ok<number, string>(5)
      .flatMap((x) => Ok<number, string>(x + 1))
      .map((x) => {
        rightFn(x);
        return x + 4;
      })
      .flatMap((_x) => Err<number, string>('Error'))
      .map((x) => {
        leftFn(x);
        return x;
      });

    expect(result.isErr()).toBe(true);
    expect(rightFn).toHaveBeenCalledWith(6);
    expect(leftFn).not.toHaveBeenCalled();
  });

  test('do notation - handle errors', () => {
    const r = Result.do<string, Error>(function*() {
      const content = '/not valid json - thould throw/';

      const parsed = yield JSON.parse(content); // should throw an error

      return parsed;
    });

    const result = r.match({ Err: (x) => x.toString(), Ok: (x) => x });

    expect(result).toBe(
      'SyntaxError: Unexpected token / in JSON at position 0'
    );
  });

  test('do notation - happy path', () => {
    const age = 25;

    const r = Result.do<string, string>(function*() {
      if (age < 18) yield Err('You are too young!');

      return "You're an adult!";
    });

    expect(r.isOk()).toBe(true);
  });
});
