const IOSymbol = Symbol('IO');

export interface IO<T> {
  __type: typeof IOSymbol;
  map<E>(f: (value: T) => E): IO<E>;
  flatMap<E>(f: (value: T) => IO<E>): IO<E>;
  toString(): string;
  unwrap: () => T;
}

export function IO<T>(effect: () => T): IO<T> {
  return {
    __type: IOSymbol,
    map: <E>(f: (value: T) => E): IO<E> => IO(() => f(effect())),
    flatMap: <E>(f: (value: T) => IO<E>): IO<E> =>
      IO(() => f(effect()).unwrap()),
    toString: () => `IO(${effect})`,
    unwrap: () => effect(),
  };
}

IO.isIO = <T>(value: T | IO<T>): value is IO<T> => {
  if (!value) return false;

  if (typeof value === 'object' && '__type' in value) {
    return Boolean(value?.__type === IOSymbol);
  }

  return false;
};

IO.do = <T, R = T>(f: () => Generator<IO<T>, IO<R>, T>): IO<R> => {
  const generator = f();

  return IO<R>(() => {
    let next = generator.next();

    while (!next.done) {
      next = generator.next(next.value.unwrap());
    }

    return next.value.unwrap();
  });
};

IO.sequence = <T>(effects: Array<IO<T>>): IO<Array<T>> => {
  return IO(() => effects.map((effect) => effect.unwrap()));
};
