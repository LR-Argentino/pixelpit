import { formatFileSize } from './file-size-pipe';

describe('formatFileSize', () => {
  it.each([
    [512, '512 B'],
    [1234, '1,2 KB'],
    [3_565_158, '3,4 MB'],
  ])('sollte %i Bytes als „%s“ anzeigen', (bytes, expected) => {
    expect(formatFileSize(bytes, 'de')).toBe(expected);
  });
});
