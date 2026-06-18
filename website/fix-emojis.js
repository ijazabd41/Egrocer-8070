const fs = require('fs');
const path = require('path');

const win1252ToByte = {
  '\u20AC': 0x80, '\u201A': 0x82, '\u0192': 0x83, '\u201E': 0x84, '\u2026': 0x85,
  '\u2020': 0x86, '\u2021': 0x87, '\u02C6': 0x88, '\u2030': 0x89, '\u0160': 0x8A,
  '\u2039': 0x8B, '\u0152': 0x8C, '\u017D': 0x8E, '\u2018': 0x91, '\u2019': 0x92,
  '\u201C': 0x93, '\u201D': 0x94, '\u2022': 0x95, '\u2013': 0x96, '\u2014': 0x97,
  '\u02DC': 0x98, '\u2122': 0x99, '\u0161': 0x9A, '\u203A': 0x9B, '\u0153': 0x9C,
  '\u017E': 0x9E, '\u0178': 0x9F
};

function encodeToWin1252(str) {
    const buf = Buffer.alloc(str.length);
    for(let i = 0; i < str.length; i++) {
        const c = str[i];
        if (win1252ToByte[c] !== undefined) {
            buf[i] = win1252ToByte[c];
        } else {
            const code = str.charCodeAt(i);
            if (code <= 0xFF) {
                buf[i] = code;
            } else {
                return null; // Not a valid mojibake sequence if it contains true high unicode not in win1252
            }
        }
    }
    return buf;
}

function fixMojibake(text) {
    // We look for patterns like '🛒' which start with a typical UTF-8 first byte decoded as win1252.
    // Common first bytes for 4-byte emojis in win1252:
    // F0 is ð (U+00F0)
    // Common first bytes for 3-byte characters (e.g. Arabic, symbols):
    // E2 is â (U+00E2)
    // Common first bytes for 2-byte characters:
    // C2 is Â, C3 is Ã
    
    // We can try to replace all substrings that decode to valid UTF-8 and contain emojis/unicode.
    // Instead of regex, let's just attempt to decode the entire file from windows-1252 back to utf8.
    // But ONLY if it was completely Mojibaked.
    // Wait, let's just use regex to find sequences of win-1252 encoded utf-8 bytes.
    // Since mojibake usually creates consecutive "weird" characters:
    const regex = /[\x80-\xFF\u20AC\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178]+/g;
    
    return text.replace(regex, (match) => {
        const buf = encodeToWin1252(match);
        if (!buf) return match;
        const decoded = buf.toString('utf8');
        // If it successfully decodes to a valid UTF-8 string that is shorter than the mojibake
        // and doesn't contain replacement characters.
        // Valid utf-8 byte sequence always produces a string with fewer characters (or same if ascii, but our regex only matches >= 0x80).
        if (!decoded.includes('\uFFFD') && decoded.length < match.length) {
            return decoded;
        }
        return match;
    });
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                processDirectory(fullPath);
            }
        } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js') || fullPath.endsWith('.css') || fullPath.endsWith('.md')) {
            const original = fs.readFileSync(fullPath, 'utf8');
            const fixed = fixMojibake(original);
            if (original !== fixed) {
                console.log('Fixed:', fullPath);
                fs.writeFileSync(fullPath, fixed, 'utf8');
            }
        }
    }
}

processDirectory(__dirname);
console.log('Done');
