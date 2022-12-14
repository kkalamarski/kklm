import { IO } from './io';

describe('IO Monad', () => {
  test('IO Monad', () => {
    const log = jest.fn();

    const io = IO(() => 'Hello')
      .map((x) => x + ' world!')
      .flatMap((x) => {
        return IO(() => log(x)).map<string>(() => x);
      });

    expect(log).not.toHaveBeenCalled();

    const result = io.unwrap();

    expect(log).toHaveBeenCalledWith('Hello world!');
    expect(result).toBe('Hello world!');
  });

  test('recursive IO action', () => {
    const log = jest.fn();
    const prompt = jest.fn(() => 5);

    const logAction = (message: string) => IO(() => log(message));
    const promptAction = () => IO(() => prompt());

    const guessTheNumber = (num: number): IO<number> =>
      logAction('Please guess the number 0-9')
        .flatMap(() => promptAction())
        .flatMap((val) =>
          val === num
            ? logAction('Correct!')
            : logAction('Wrong! Try again').flatMap(() => guessTheNumber(5))
        );

    const action = guessTheNumber(7);

    expect(log).not.toHaveBeenCalled();
    expect(prompt).not.toHaveBeenCalled();

    action.unwrap();

    expect(log).toHaveBeenCalledTimes(4);
    expect(prompt).toHaveBeenCalledTimes(2);
  });

  test('IO#do', () => {
    const log = jest.fn();
    const prompt = jest.fn(() => 5);

    const logAction = (message: string) => IO(() => log(message));
    const promptAction = () => IO(() => prompt());

    const action = IO.do<number | void>(function*() {
      yield logAction('Please guess the number');

      const result = yield promptAction();

      if (result === 5) {
        yield logAction('Correct!');
      } else {
        yield logAction('Wrong!');
      }

      return IO(() => 0);
    });

    expect(log).not.toHaveBeenCalled();
    expect(prompt).not.toHaveBeenCalled();

    action.unwrap();

    expect(log).toHaveBeenCalledTimes(2);
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  test('IO#sequence', () => {
    const log = jest.fn();
    const actions = [
      IO(() => log('Hello')),
      IO(() => log('world')),
      IO(() => log('!')),
    ];

    const action = IO.sequence(actions);

    expect(IO.isIO(action)).toBe(true);
    expect(log).not.toHaveBeenCalled();

    action.unwrap();

    expect(log).toHaveBeenCalledTimes(3);
  });
});
