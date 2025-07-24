const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const confirmation = document.getElementById('confirmation');

async function makeRequest(book, ref) {
  const output = []; // result object to store results

  if (ref.length !== 1 && ref.length !== 3) {
    return output; // return empty if format is wrong
  }

  const user_input_1 = ref[0];
  let user_input_2, user_input_3;
  const without_refs = ref.length === 1;

  if (!without_refs) {
    user_input_2 = parseInt(ref[1], 10);
    user_input_3 = parseInt(ref[2], 10);
  }

  const url = `https://www.aelf.org/bible/${book}/${user_input_1}`;

  try {
    const response = await fetch(url);
    const json = await response.json();
    output.push(json);
    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const text = doc.body.textContent || '';

    // Split and group lines
    const lines = text.split('\n');
    const sections = [];
    let currentSection = [];

    for (const line of lines) {
      const stripped = line.trim();
      if (stripped) {
        currentSection.push(stripped);
      } else if (currentSection.length > 0) {
        sections.push(currentSection);
        currentSection = [];
      }
    }
    if (currentSection.length > 0) {
      sections.push(currentSection);
    }

    const section = sections[sections.length - 2] || [];
    const matchingLines = [];

    if (without_refs) {
      for (let i = 0; i < section.length; i++) {
        const parts = section[i].trim().split(' ', 2);
        if (parts.length < 2 || i === 0) continue;
        matchingLines.push(parts[1]);
      }
    } else {
      for (const line of section) {
        const parts = line.trim().split(' ', 2);
        if (parts.length < 2) continue;
        const num = parseInt(parts[0], 10);
        if (!isNaN(num) && num >= user_input_2 && num <= user_input_3) {
          matchingLines.push(parts[1]);
        }
      }
    }

    output.push(matchingLines);
    return output;

  } catch (error) {
    return [];
  }
}

function expandDashRanges(tupleOfLists, book) {
  const dashPattern = /[-–—]/; // hyphen, endash, emdash
  const result = [];

  for (const lst of tupleOfLists) {
    if (lst.length === 1) {
      const item = lst[0];
      if (dashPattern.test(item)) {
        const parts = item.split(dashPattern);
        if (parts.length === 2) {
          let start, end;
          try {
            start = parseInt(parts[0].trim(), 10);
            end = parseInt(parts[1].trim(), 10);
            if (isNaN(start) || isNaN(end)) throw new Error();
          } catch {
            result.push(lst);
            continue;
          }

          let low = Math.min(start, end);
          let high = Math.min(Math.max(start, end), lengthBook[book]);

          for (let i = low; i <= high; i++) {
            result.push([String(i)]);
          }
        } else {
          result.push(lst);
        }
      } else {
        result.push(lst);
      }

    } else if (lst.length === 2) {
      const [item1, item2] = lst;
      const item1HasDash = dashPattern.test(item1);
      const item2HasDash = dashPattern.test(item2);

      // Scenario 3: both have dash → error, return empty array immediately
      if (item1HasDash && item2HasDash) {
        return [];
      }

      // Scenario 1: both ints
      if (!item1HasDash && !item2HasDash) {
        try {
          if (isNaN(parseInt(item1, 10)) || isNaN(parseInt(item2, 10))) throw new Error();
          // Add third item same as item2
          result.push([item1, item2, item2]);
        } catch {
          // Not ints, keep empty array
          result.push([]);
        }

      // Scenario 2: item1 int, item2 with dash
      } else if (!item1HasDash && item2HasDash) {
        let start2, end2;
        try {
          if (isNaN(parseInt(item1, 10))) throw new Error();
          const parts = item2.split(dashPattern);
          if (parts.length !== 2) {
            result.push([]);
            continue;
          }
          start2 = parseInt(parts[0].trim(), 10);
          end2 = parseInt(parts[1].trim(), 10);
          if (isNaN(start2) || isNaN(end2)) throw new Error();
        } catch {
          result.push([]);
          continue;
        }
        let low2 = Math.min(start2, end2);
        let high2 = Math.min(Math.max(start2, end2), lengthBook[book]);
        result.push([item1, low2, high2]);

      // Scenario 4: item1 with dash, item2 int
      } else if (item1HasDash && !item2HasDash) {
        try {
          if (isNaN(parseInt(item2, 10))) throw new Error();
        } catch {
          result.push([]);
          continue;
        }

        const parts = item1.split(dashPattern);
        if (parts.length === 2) {
          let start, end;
          try {
            start = parseInt(parts[0].trim(), 10);
            end = parseInt(parts[1].trim(), 10);
            if (isNaN(start) || isNaN(end)) throw new Error();
          } catch {
            result.push([]);
            continue;
          }

          let low = Math.min(start, end);
          let high = Math.min(Math.max(start, end), lengthBook[book]);

          for (let i = low; i < high; i++) {
            result.push([String(i)]);
          }
          result.push([String(high), '1', item2]);
        } else {
          result.push(lst);
        }

      } else {
        // fallback, keep as is
        result.push(lst);
      }
    } else {
      throw new Error("Each list must have length 1 or 2.");
    }
  }

  // Filter out empty lists (like [])
  return result.filter(lst => lst.length > 0);
}



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

function collapseAndWarnOnMixedPunctuation(s) {
  const result = [];
  const punctuation = `!"#$%&'()*+,-./:;<=>?@[\\]^_\`{|}~`; // similar to string.punctuation in Python

  let i = 0;
  while (i < s.length) {
    const char = s[i];
    result.push(char);

    if (punctuation.includes(char)) {
      let j = i + 1;
      const cluster = [];

      while (j < s.length && punctuation.includes(s[j])) {
        cluster.push(s[j]);
        j++;
      }

      if (cluster.length > 0) {
        // Warn if there's a difference in punctuation
        if (cluster.some(c => c !== char)) {
          console.warn(`Warning: mixed punctuation '${char + cluster.join('')}' at position ${i}`);
        }
      }
      i = j; // Skip the rest of the cluster
    } else {
      i++;
    }
  }

  return result.join('');
}

function splitTextToOrderedTuple(text) {
  // Split on one or more semicolons or commas
  const parts = text.split(/[;,]+/);

  // For each non-empty trimmed part, split again on one or more colons or commas
  const filtered = parts
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .map(part => part.split(/[:,]+/));

  return filtered; // JS has no tuple, so return array of arrays
}

function enforceListLengths(tuplesOfLists) {
  const updatedLists = [];
  let lastFirstElem = null;
  let foundTwoLength = false;

  for (const lst of tuplesOfLists) {
    if (lst.length === 2) {
      foundTwoLength = true;
      lastFirstElem = lst[0];
      updatedLists.push(lst);
    } else if (lst.length === 1) {
      if (foundTwoLength) {
        // Prepend lastFirstElem
        updatedLists.push([lastFirstElem, ...lst]);
      } else {
        updatedLists.push(lst);
      }
    } else {
      throw new Error("Erreur de format");
    }
  }

  return updatedLists; // JS has no tuple, return array of arrays
}

const lengthBook = {
  Ddd: 50,
  Jn: 21,
  Mc: 16,
  Mt: 28,
  // Add more books as needed
};

searchButton.addEventListener('click', async () => {
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
    const collapsedId = collapseAndWarnOnMixedPunctuation(cleanedId);
    const arrayId = splitTextToOrderedTuple(collapsedId);
    const standArrayId = enforceListLengths(arrayId);
    const expandedId = expandDashRanges(standArrayId, book);

    for (const listee of expandedId) {
      if (parseInt(listee[0], 10) > lengthBook[book]) {
        continue;
      }
    
      if (listee.length === 1) {
        results.push(`${book} ${listee[0]}`);
      } else if (listee.length === 3) {
        results.push(`${book} ${listee[0]} : ${listee[1]}-${listee[2]}`);
      }
    
      const requestResult = await makeRequest(book, listee);
      results.push(requestResult);
    }

    // results.push(`Book: ${book}, ID: ${expandedId}`);
  }

  confirmation.textContent = results.length > 0
    ? `Search confirmed: ${results.join('; ')}`
    : 'No valid IDs found.';
});
