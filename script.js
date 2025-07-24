const pasteButton = document.getElementById('pasteButton');
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const confirmation = document.getElementById('confirmation');

pasteButton.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    searchInput.value = text;
  } catch (err) {
    alert('Failed to read clipboard: ' + err);
  }
});

searchButton.addEventListener('click', () => {
  const query = searchInput.value.trim();
  if (query !== '') {
    confirmation.textContent = `Search confirmed: "${query}"`;
  } else {
    confirmation.textContent = '';
  }
});
