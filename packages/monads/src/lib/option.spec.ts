import { None, Some, Option } from './option';

describe('Option Monad', () => {
  test('Option monad', () => {
    const some = Some(1);
    expect(some.isSome()).toBe(true);
    expect(some.isNone()).toBe(false);

    const none = None();
    expect(none.isSome()).toBe(false);
    expect(none.isNone()).toBe(true);
  });

  test('map function', () => {
    const some = Some(1);
    const some2 = some.map((x) => x + 1);
    expect(some2.isSome()).toBe(true);
    expect(some2.isNone()).toBe(false);

    const none = None<number>();
    const none2 = none.map((x) => x + 1);
    expect(none2.isSome()).toBe(false);
    expect(none2.isNone()).toBe(true);
  });

  test('bind method', () => {
    const some = Some(1);
    const some2 = some.flatMap((x) => Some(x + 1));
    expect(some2.isSome()).toBe(true);

    const none = None<number>();
    const none2 = none.flatMap((x) => Some(x + 1));
    expect(none2.isNone()).toBe(true);

    const option = some.flatMap((_x) => None());
    expect(option.isNone()).toBe(true);
  });

  test('match function', () => {
    const some = Some(1);
    const someResult = some.match({
      Some: (x) => x + 1,
      None: () => 0,
    });
    expect(someResult).toBe(2);

    const nothing = None<number>();
    const nothingResult = nothing.match({
      Some: (x) => x + 1,
      None: () => 0,
    });
    expect(nothingResult).toBe(0);
  });

  test('toString function', () => {
    const just = Some(1);
    expect(just.toString()).toBe('Some(1)');

    const nothing = None();
    expect(nothing.toString()).toBe('None()');
  });

  test('an example', () => {
    const getUserInput = (input?: string) =>
      input ? Some(input) : None<string>();

    const justResult = getUserInput('hello')
      .map((x) => x.toUpperCase())
      .map((x) => x.split('').reverse().join(''))
      .match({
        Some: (x) => x,
        None: () => 'Nothing',
      });

    expect(justResult).toBe('OLLEH');

    const nothingResult = getUserInput()
      .map((x) => x.toUpperCase())
      .map((x) => x.split('').reverse().join(''))
      .match({
        Some: (x) => x,
        None: () => 'Nothing',
      });

    expect(nothingResult).toBe('Nothing');
  });

  test('an example 2', () => {
    const search = (text: string, search: RegExp) => {
      const result = text.match(search);

      return result ? Some<string[]>(result) : None<string[]>();
    };

    const justResult = search('hello', /hello/).match({
      Some: (x) => x[0],
      None: () => 'Nothing',
    });

    expect(justResult).toBe('hello');

    const nothingResult = search('hello', /world/).match({
      Some: (x) => x[0],
      None: () => 'Nothing',
    });

    expect(nothingResult).toBe('Nothing');
  });

  test('do notation - Just', () => {
    const maybe = Option.do<string>(function*() {
      const x = 'ala ma kota';

      const result = yield x.includes('ala') ? 'ala' : None();

      return result;
    });

    const result = maybe.match({ Some: (x) => x, None: () => 'Nothing' });

    expect(result).toBe('ala');
  });

  test('do notation - Nothing', () => {
    const maybe = Option.do<string>(function*() {
      const x = 'ala ma kota';

      const result = yield x.includes('hello monad') ? 'hello monad' : None();

      console.log('not reachcable');

      return result;
    });

    const result = maybe.match({ Some: (x) => x, None: () => 'Nothing' });

    expect(result).toBe('Nothing');
  });

  test('do notation - handle nulls', () => {
    const user = { firstName: 'John', lastName: null };

    const option = Option.do<string>(function*() {
      const firstName = yield user.firstName;
      const lastName = yield user.lastName;

      return `${firstName} ${lastName}`;
    });

    expect(option.isNone()).toBe(true);
  });

  test('do notation - handle undefined', () => {
    const userTelephoneNumber = Option.do<string>(function*() {
      const user: any = {
        firstName: 'John',
        lastName: 'Doe',
        address: {
          city: 'New York',
          postalCode: '123 mm 123',
        },
      };

      // yielding undefined value will produce None type and abort code execution
      const telephone = yield user?.contact?.telephone;

      return telephone.replace(/-/g, '');
    });

    expect(userTelephoneNumber.isNone()).toBe(true);
  });

  test('Option#sequence', () => {
    const option = Option.sequence([Some(1), Some(2)]);

    expect(option.isSome()).toBe(true);

    option.match({
      Some: ([x, y]) => {
        expect(x).toBe(1);
        expect(y).toBe(2);
      },
      None: () => {
        fail('should not be Nothing');
      },
    });
  });
});
