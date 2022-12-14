import { Identity } from './Identity';

describe('Identity Monad', () => {
  test('Identity Monad', () => {
    const monad: Identity<number> = Identity(1);
    expect(Identity.isIdentity(monad)).toBe(true);
    expect(monad.toString()).toBe('Identity(1)');
  });

  test('Identity#map', () => {
    const monad = Identity(1);

    const result = monad.map((x) => x + 1).map((x) => x + 1);

    expect(result.unwrap()).toBe(3);
    expect(result.toString()).toBe('Identity(3)');
  });

  test('Identity#chain', () => {
    const monadA = Identity(1);
    const monadB = Identity(2);

    const result = monadA.flatMap((x) => monadB.map((y) => x + y));

    expect(result.unwrap()).toBe(3);
    expect(result.toString()).toBe('Identity(3)');
  });

  test('do notation', () => {
    const result = Identity.do<number>(function*() {
      const x = yield Identity(5);
      const y = yield x + 5;
      const i = yield Identity(y + 5);
      const t = yield i + 5;

      return t;
    });

    expect(result.unwrap()).toBe(20);
    expect(result.toString()).toBe('Identity(20)');
  });
});
