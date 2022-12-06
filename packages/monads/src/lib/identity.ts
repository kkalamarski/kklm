const IdentitySymbol = Symbol('Identity');

export default interface Identity<T> {
  __type: typeof IdentitySymbol;
  map<E>(f: (value: T) => E): Identity<E>;
  flatMap<E>(f: (value: T) => Identity<E>): Identity<E>;
  toString(): string;
  unwrap(): T;
}

export default function Identity<T>(value: T): Identity<T> {
  return {
    __type: IdentitySymbol,
    map: <E>(f: (value: T) => E): Identity<E> => Identity(f(value)),
    flatMap: <E>(f: (value: T) => Identity<E>): Identity<E> => f(value),
    toString: () => `Identity(${value})`,
    unwrap: () => value,
  };
}

Identity.isIdentity = <T>(value: T | Identity<T>): value is Identity<T> => {
  if (!value) return false;

  if (typeof value === 'object' && '__type' in value) {
    return Boolean(value?.__type === IdentitySymbol);
  }

  return false;
};

Identity.do = <T>(
  f: () => Generator<Identity<T> | T, Identity<T> | T, T>
): Identity<T> => {
  const generator = f();

  let step = generator.next();

  while (!step.done) {
    const value = step.value;

    if (Identity.isIdentity(value)) {
      value.flatMap((val) => {
        step = generator.next(val);

        return Identity(val);
      });
    } else {
      step = generator.next(step.value as T);
    }
  }

  return Identity.isIdentity(step.value) ? step.value : Identity(step.value);
};
