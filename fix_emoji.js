const fs = require('fs');
const glob = require('fs').readdirSync('d:/Egrocer-Web-1/website/js').filter(f => f.endsWith('.js')).map(f => 'd:/Egrocer-Web-1/website/js/' + f);

const replacements = {
  'Ã°Å¸â€ºâ€™': '🛒',
  'Ã°Å¸â€œÂ¦': '📦',
  'Ã°Å¸â€”â€˜Ã¯Â¸Â ': '🗑️',
  'Ã¢â€ â€™': '→',
  'Ã°Å¸â€˜Â¤': '👤',
  'Ã¢Ë†â€™': '−',
  'Ã°Å¸Å½â€°': '🎉',
  'Ã¢Å“â€œ': '✓',
  'Ã¢Å“â€”': '✖',
  'Ã¢Â Å’': '❌',
  'Ã¢Å“â€¦': '✅',
  'Ã¢Å¡Â Ã¯Â¸Â ': '⚠️',
  'Ã¢â„¢Â¡': '♡',
  'Ã¢Â Â¤Ã¯Â¸Â ': '❤️',
  'Ã¢â‚¬â€ ': '—',
  'Ã¢â€ â‚¬': '─',
  'Ã˜Â§Ã™â€žÃ˜Â¹Ã˜Â±Ã˜Â¨Ã™Å Ã˜Â©': 'العربية'
};

for (const file of glob) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    for (const [bad, good] of Object.entries(replacements)) {
        if (content.includes(bad)) {
            content = content.split(bad).join(good);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed', file);
    }
}
