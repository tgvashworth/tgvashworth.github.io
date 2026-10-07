const writeGood = require('write-good');
let text = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { text += chunk; });
process.stdin.on('end', () => {
  // Keep offsets intact while hiding fenced/inline code and link targets.
  const prose = text
    .replace(/(^```[^\n]*\n[\s\S]*?^```[^\n]*$|^~~~[^\n]*\n[\s\S]*?^~~~[^\n]*$)/gm, match => match.replace(/[^\n]/g, ' '))
    .replace(/`[^`\n]+`/g, match => ' '.repeat(match.length))
    .replace(/\]\([^)]*\)/g, match => ']'.padEnd(match.length, ' '));
  const suggestions = writeGood(prose).map(suggestion => ({
    ...suggestion,
    line: text.slice(0, suggestion.index).split('\n').length,
    excerpt: text.slice(suggestion.index, suggestion.index + suggestion.offset),
  }));
  process.stdout.write(JSON.stringify(suggestions));
});
