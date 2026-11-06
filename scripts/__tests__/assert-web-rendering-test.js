const { assertWebRendering } = require('../assert-web-rendering.cjs');

test('accepts server-rendered headings and escaped project content', () => {
  expect(() => assertWebRendering('<h1>Neo Rock ’Em Sock ’Em Robots</h1><p>Games &amp; experiments</p>', '/neo', 'Games & experiments')).not.toThrow();
});

test.each([
  '<!--$!--><template data-msg="Switched to client rendering because the server rendering errored: Invalid regular expression: Stack overflow"></template>',
  '<!--$!--><template></template>',
  '<template data-stck="renderElement"></template>',
  '<p>Failed to load loader data</p>',
])('rejects React server failures even when page content is also present', failure => {
  expect(() => assertWebRendering(`<h1>Quasicombo</h1>${failure}`, '/', 'Quasicombo')).toThrow('server rendering failed');
});

test('rejects a client-only shell even when metadata names the project', () => {
  expect(() => assertWebRendering('<head><title>Quasicombo</title></head><div id="root"></div><script>"<h1>Quasicombo</h1>"</script>', '/', 'Quasicombo')).toThrow('missing server-rendered page heading');
});

test('rejects the wrong page or project text present only in scripts and metadata', () => {
  expect(() => assertWebRendering('<head><title>Quasicombo</title></head><h1>Not found</h1><script>"Quasicombo"</script>', '/quasicombo', 'Quasicombo')).toThrow('missing server-rendered content');
});
