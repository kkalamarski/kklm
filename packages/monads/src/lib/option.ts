import { Ok, Result } from './result';

const OptionSymbol = Symbol('Option');

type Nullable<T> = T | null | undefined;

const isSomeValue = <T>(x: Nullable<T>): x is T =>
  x !== undefined && x !== null;

export interface Option<T> {
  __type: typeof OptionSymbol;
  map<E>(f: (value: T) => E): Option<E>;
  flatMap<E>(f: (value: T) => Option<E>): Option<E>;
  toString(): string;
  unwrap(): T;
  isSome(): boolean;
  isNone(): boolean;
  match: <E>(x: { Some: (v: T) => E; None: () => E }) => E;
}

export function Option<T>(value: Nullable<T>): Option<T> {
  return Some<T>(value);
}

export const Some = <T>(value: Nullable<T>): Option<T> =>
  isSomeValue(value)
    ? {
      __type: OptionSymbol,
      map: <E>(f: (value: T) => E): Option<E> => Option(f(value)),
      flatMap: <E>(f: (value: T) => Option<E>): Option<E> => f(value),
      toString: () => `Some(${value})`,
      unwrap: () => value,
      isNone: () => false,
      isSome: () => true,
      match: ({ Some }) => Some(value),
    }
    : None<T>();

export const None = <T>(): Option<T> => ({
  __type: OptionSymbol,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  map: <E>(_: (value: T) => E): Option<E> => None(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  flatMap: <E>(_f: (value: T) => Option<E>): Option<E> => None(),
  toString: () => `None()`,
  unwrap: () => {
    throw new Error('Tried to access a None() value.');
  },
  isSome: () => false,
  isNone: () => true,
  match: ({ None }) => None(),
});

Option.isOption = <T>(value: Option<T> | T): value is Option<T> => {
  if (!!value && typeof value === 'object' && '__type' in value) {
    return Boolean(value?.__type === OptionSymbol);
  }

  return false;
};

type GeneratorType<T> = Option<T> | T | null | undefined;

Option.do = <T, R = T>(
  f: () => Generator<GeneratorType<T>, GeneratorType<R>, T>
): Option<R> => {
  const generator = f();

  let step = generator.next();

  while (!step.done) {
    const value = step.value;

    if (Option.isOption(value)) {
      if (value.isNone()) return None<R>();

      value.map((x) => {
        step = generator.next(x);
        return x;
      });
    } else {
      if (isSomeValue(value)) {
        step = generator.next(value);
      } else {
        return None<R>();
      }
    }
  }

  const { value } = step;

  if (Option.isOption(value)) {
    return value;
  }

  return Some<R>(value);
};

Option.sequence = <T>(list: Array<Option<T>>): Option<Array<T>> =>
  Option.fromResult(Ok(list).map((list) => list.map((x) => x.unwrap())));

Option.fromResult = <T>(result: Result<T, unknown>): Option<T> =>
  result.match({ Err: () => None<T>(), Ok: (v) => Some<T>(v) });
