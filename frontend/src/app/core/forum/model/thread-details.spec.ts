import { toThreadId } from './thread-details';

describe('toThreadId', () => {
  it.each([undefined, '', 'abc', '0', '-1', '2.5', '..%2Faccounts'])(
    'sollte null liefern, wenn die ID %j ungültig ist',
    (value) => {
      expect(toThreadId(value)).toBeNull();
    },
  );

  it('sollte die Zahl übernehmen, wenn die ID gültig ist', () => {
    expect(toThreadId('1')).toBe(1);
    expect(toThreadId('42')).toBe(42);
  });
});
