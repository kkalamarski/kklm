import { Option, Some, None, Result, Ok, Err } from '@kklm/monads';

export const Any: unique symbol = Symbol('Any');
export const AnyString: unique symbol = Symbol('AnyString');
export const AnyNumber: unique symbol = Symbol('AnyNumber');
export const AnyBoolean: unique symbol = Symbol('AnyBoolean');
export const AnyObject: unique symbol = Symbol('AnyObject');
export const AnyArray: unique symbol = Symbol('AnyArray');
export const AnyFunction: unique symbol = Symbol('AnyFunction');

const ComposeMatcherSymbol = Symbol('ComposeMatcher');
const StrictMatcherSymbol = Symbol('StrictMatcher');

interface ComposeMatcher<T> {
  _type: typeof ComposeMatcherSymbol;
  conditions: CaseValue<T>[];
}

interface StrictMatcher<T> {
  _type: typeof StrictMatcherSymbol;
  value: CaseValue<T>;
}

export const strict = <T>(value: CaseValue<T>): StrictMatcher<T> => ({
  _type: StrictMatcherSymbol,
  value,
});

export const compose = <T>(
  ...conditions: CaseValue<T>[]
): ComposeMatcher<T> => ({
  _type: ComposeMatcherSymbol,
  conditions,
});

type AnyMatchers =
  | typeof Any
  | typeof AnyString
  | typeof AnyNumber
  | typeof AnyArray
  | typeof AnyObject
  | typeof AnyBoolean;

type CaseValue<T> = T extends Array<any>
  ? T | AnyMatchers | Array<AnyMatchers> | ComposeMatcher<T> | StrictMatcher<T>
  : T | AnyMatchers | ComposeMatcher<T> | StrictMatcher<T>;

type CaseFn<T, U> = (x: T) => U;
type Case<T, U> = [CaseValue<T>, CaseFn<T, U>];

class PatternMatcher<T, U> {
  private cases: Case<T, U>[] = [];

  constructor(private value: T) {}

  case(pattern: CaseValue<T>, caseFn: CaseFn<T, U>) {
    this.cases = [...this.cases, [pattern, caseFn]];
    return this;
  }

  default(fn: () => U): U {
    const result = this.getResult();

    return result.match({
      Some: (value: U) => value,
      None: () => fn(),
    });
  }

  unwrap(): U {
    const result = this.getResult();

    return result.match({
      Some: (value: U) => value,
      None: () => {
        throw new Error('Unhandled case');
      },
    });
  }

  toOption(): Option<U> {
    return this.getResult();
  }

  toResult(): Result<U, Error> {
    return this.getResult().match({
      Some: (v: U) => Ok(v),
      None: () => Err(new Error('Unhandled case')),
    });
  }

  private getResult(): Option<U> {
    const result = this.cases.find(([pattern]) =>
      this.compare(pattern, this.value)
    );

    if (!result) return None();

    return Some(result[1](this.value));
  }

  private isComposeMatcher<D>(testCase: CaseValue<D>) {
    if ('_type' in (testCase as ComposeMatcher<D>)) {
      if ((testCase as ComposeMatcher<D>)?._type === ComposeMatcherSymbol)
        return true;

      return false;
    }

    return false;
  }

  private isStrictMatcher<D>(testCase: CaseValue<D>) {
    if ('_type' in (testCase as StrictMatcher<D>)) {
      if ((testCase as StrictMatcher<D>)?._type === StrictMatcherSymbol)
        return true;

      return false;
    }

    return false;
  }

  private compare<D>(testCase: CaseValue<D>, value: D): boolean {
    try {
      if (this.isComposeMatcher(testCase))
        return (testCase as ComposeMatcher<D>).conditions.every(
          (c: CaseValue<D>) => this.compare(c, value)
        );
    } catch (e) {}

    try {
      if (this.isStrictMatcher(testCase))
        return (
          JSON.stringify((testCase as StrictMatcher<D>).value) ===
          JSON.stringify(value)
        );
    } catch (e) {}

    if (testCase === Any && value !== undefined) return true;
    if (testCase === AnyNumber && typeof value === 'number') return true;
    if (testCase === AnyString && typeof value === 'string') return true;
    if (testCase === AnyBoolean && typeof value === 'boolean') return true;
    if (testCase === AnyArray && Array.isArray(value)) return true;
    if (testCase === AnyFunction && typeof value === 'function') return true;
    if (
      testCase === AnyObject &&
      typeof value === 'object' &&
      !Array.isArray(value)
    )
      return true;

    if (typeof testCase === 'function') {
      try {
        return testCase(value);
      } catch (e) {
        return false;
      }
    }

    if (typeof testCase === 'object' && !!testCase) {
      if (typeof value === 'object' && !!value) {
        return Object.keys(testCase).every((key) =>
          value.hasOwnProperty(key)
            ? this.compare((testCase as any)[key], (value as any)[key])
            : false
        );
      }
      return false;
    }

    if (typeof testCase !== typeof value) return false;

    return testCase === value;
  }
}

const match = <T, U>(x: T) => new PatternMatcher<T, U>(x);

export default match;
