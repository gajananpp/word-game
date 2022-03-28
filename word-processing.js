import fs from 'fs';

const words = JSON.parse(fs.readFileSync('static/words.json', 'utf8'));
const processedWords = words
	.filter((word) => word.length > 4 && !word.includes('sex') && !/[-\s]/.test(word))
	.join(',');
fs.writeFileSync('static/words.txt', processedWords, 'utf8');
