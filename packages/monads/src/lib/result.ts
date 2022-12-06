const ResultSymbol = Symbol('Result');

export default interface Result<Ok, Err> {
  map<O>(f: (value: Ok) => O): Result<O, Err>;
  flatMap<O>(f: (value: Ok) => Result<O, Err>): Result<O, Err>;
  toString(): string;
  unwrap(): Ok;
  isOk(): boolean;
  isErr(): boolean;
  match<O>(x: { Ok: (v: Ok) => O; Err: (v: Err) => O }): O;
  __type: typeof ResultSymbol;
}

export default function Result<Ok, Err = any>(
  value: Ok | Err
): Result<Ok, Err> {
  if (value instanceof Error) {
    return Err<Ok, Err>(value as Err);
  }

  return Ok<Ok, Err>(value as Ok);
}

export const Ok = <Ok, Err = any>(value: Ok): Result<Ok, Err> => ({
  map: <O>(f: (value: Ok) => O): Result<O, Err> => {
    try {
      return Ok<O, Err>(f(value));
    } catch (e) {
      return Err<O, Err>(e as Err);
    }
  },
  flatMap: <O>(f: (value: Ok) => Result<O, Err>): Result<O, Err> => {
    try {
      return f(value);
    } catch (e) {
      return Err<O, Err>(e as Err);
    }
  },
  toString: () => `Ok(${value})`,
  unwrap: () => value,
  isOk: () => true,
  isErr: () => false,
  match: ({ Ok }) => Ok(value),
  __type: ResultSymbol,
});

export const Err = <Ok, Err = any>(value: Err): Result<Ok, Err> => ({
  map: <O>(_: (value: Ok) => O): Result<O, Err> => Err(value),
  flatMap: <O>(_f: (value: Ok) => Result<O, Err>): Result<O, Err> => Err(value),
  toString: () => `Err(${value})`,
  unwrap: () => {
    throw new Error('Tried to access an Err() value.');
  },
  isOk: () => false,
  isErr: () => true,
  match: ({ Err }) => Err(value),
  __type: ResultSymbol,
});

Result.isResult = <Ok, Err>(
  value: Result<Ok, Err> | Ok | Err
): value is Result<Ok, Err> => {
  if (!!value && typeof value === 'object' && '__type' in value) {
    return Boolean(value?.__type === ResultSymbol);
  }

  return false;
};

Result.do = <O, E>(
  f: () => Generator<Result<O, E> | O, Result<O, E> | O, O>
): Result<O, E> => {
  const generator = f();

  try {
    let step = generator.next();

    while (!step.done) {
      const value = step.value;

      if (Result.isResult(value)) {
        const eitherLeft = value.match({
          Ok: (x) => {
            step = generator.next(x);

            return Ok(x);
          },
          Err: (x) => {
            return Err<O, E>(x);
          },
        });

        if (eitherLeft.isErr()) return eitherLeft;
      } else {
        step = generator.next(value as O);
      }
    }

    const { value } = step;

    if (Result.isResult(value)) {
      return value;
    }

    return Ok<O, E>(value);
  } catch (e) {
    return Err<O, E>(e as E);
  }
};

Result.tryCatch = <O, E>(f: () => O): Result<O, E> => {
  try {
    return Ok<O, E>(f());
  } catch (e) {
    return Err<O, E>(e as E);
  }
};
