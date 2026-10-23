import { renderMarkdown } from './markdown-pipe';

describe('renderMarkdown', () => {
  it('sollte Hervorhebungen und Listen in HTML umwandeln', () => {
    const html = renderMarkdown('**wichtig**\n\n- eins\n- zwei');

    expect(html).toContain('<strong>wichtig</strong>');
    expect(html).toContain('<li>eins</li>');
    expect(html).toContain('<li>zwei</li>');
  });

  it('sollte einen einfachen Zeilenumbruch erhalten', () => {
    expect(renderMarkdown('erste Zeile\nzweite Zeile')).toContain('<br>');
  });
});
