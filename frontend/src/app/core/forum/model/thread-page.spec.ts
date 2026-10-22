import { toPageNumber } from './thread-page';

describe('toPageNumber', () => {
  it.each([undefined, '', 'abc', '0', '-3', '2.5'])(
    'sollte 1 liefern, wenn die Seitenangabe %j ungültig ist',
    (value) => {
      expect(toPageNumber(value)).toBe(1);
    },
  );

  it('sollte die Zahl übernehmen, wenn die Seitenangabe gültig ist', () => {
    expect(toPageNumber('1')).toBe(1);
    expect(toPageNumber('2')).toBe(2);
    expect(toPageNumber('17')).toBe(17);
  });
});
