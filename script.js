const pasteButton = document.getElementById('pasteButton');
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const confirmation = document.getElementById('confirmation');

function validateInput(input) {
  return input.length > 0;
}

function extractIds(inputText) {
  return inputText.match(/[a-zA-Z]+[^a-zA-Z]*/g) || [];
}

function truncateToLastDigit(s) {
  const match = s.match(/\d(?!.*\d)/);
  return match ? s.slice(0, match.index + 1) : undefined;
}

function cleanLetterNumberBoundary(s) {
  const match = s.match(/^([a-zA-Z]+)[^0-9]*([0-9].*)$/);
  return match ? [match[1], match[2]] : [null, null];
}

function removeAllSpaces(text) {
  return text.replace(/ /g, '');
}

function removeUnwantedPunctuation(s) {
  const allowed = '\\-–—\\.,:;';
  const regex = new RegExp(`[^\\w\\s${allowed}]`, 'g');
  return s.replace(regex, '');
}

function countNumericSequences(s) {
  const matches = s.match(/\d+/g);
  return matches ? matches.length : 0;
}

pasteButton.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    searchInput.value = text;
  } catch (err) {
    alert('Failed to read clipboard: ' + err);
  }
});

const lengthBook = {
  Ddd: 50,
  Jn: 21,
  Mc: 16,
  Mt: 28,
  // Add more books as needed
};

searchButton.addEventListener('click', () => {
  const query = searchInput.value.trim();

  if (!validateInput(query)) {
    confirmation.textContent = 'Please enter a search query.';
    return;
  }

  const ids = extractIds(query);
  let results = [];

  for (let rawId of ids) {
    let id = truncateToLastDigit(rawId);
    if (!id || id === '') continue;

    const [bookRaw, rest] = cleanLetterNumberBoundary(id);
    if (!bookRaw || !rest) continue;

    const book = bookRaw.charAt(0).toUpperCase() + bookRaw.slice(1).toLowerCase();
    if (!(book in lengthBook)) continue;

    const count1 = countNumericSequences(rest);
    const idNoSpaces = removeAllSpaces(rest);
    const count2 = countNumericSequences(idNoSpaces);

    if (count2 !== count1) {
      console.log('Erreur de format potentielle');
    }

    const cleanedId = removeUnwantedPunctuation(idNoSpaces);

    results.push(`Book: ${book}, ID: ${cleanedId}`);
  }

  confirmation.textContent = results.length > 0
    ? `Search confirmed: ${results.join('; ')}`
    : 'No valid IDs found.';
});
