// app.js (type="module")
import {
  // nothing to import; we will use window.__FIREBASE__ which index.html sets
} from './noop.js'; // noop; only to keep module context

// Get firebase objects exposed by index.html
const { db, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, getDocs } = window.__FIREBASE__;

// DOM references
const addBookForm = document.getElementById('addBookForm');
const booksContainer = document.getElementById('booksContainer');
const insertDummyBtn = document.getElementById('insertDummy');

const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');

closeModal.addEventListener('click', () => modal.classList.add('hidden'));

// Helper: render a single book card
function renderBook(id, data) {
  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.id = id;

  const img = document.createElement('img');
  img.src = data.coverImageURL || 'https://via.placeholder.com/120x160?text=No+Image';
  img.alt = data.title;

  const meta = document.createElement('div');
  meta.className = 'meta';

  const title = document.createElement('h3');
  title.textContent = data.title;

  const author = document.createElement('p');
  author.textContent = `Author: ${data.author}`;

  const price = document.createElement('div');
  price.className = 'price';
  price.textContent = `$${Number(data.price).toFixed(2)}`;

  const actions = document.createElement('div');
  actions.className = 'actions';

  const updateBtn = document.createElement('button');
  updateBtn.textContent = 'Update Author';

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';

  const viewBtn = document.createElement('button');
  viewBtn.textContent = 'View Details';
  viewBtn.className = 'primary';

  // action handlers
  updateBtn.addEventListener('click', async () => {
    const newAuthor = prompt('Enter new author name', data.author);
    if (newAuthor && newAuthor.trim()) {
      const docRef = doc(db, 'books', id);
      await updateDoc(docRef, { author: newAuthor.trim() });
      // realtime onSnapshot will re-render
    }
  });

  deleteBtn.addEventListener('click', async () => {
    if (confirm(`Delete "${data.title}"?`)) {
      const docRef = doc(db, 'books', id);
      await deleteDoc(docRef);
    }
  });

  viewBtn.addEventListener('click', () => {
    modalBody.innerHTML = `
      <h2>${data.title}</h2>
      <p><strong>Author:</strong> ${data.author}</p>
      <p><strong>Price:</strong> $${Number(data.price).toFixed(2)}</p>
      <img src="${data.coverImageURL || 'https://via.placeholder.com/300x400?text=No+Image'}" style="max-width:100%;margin-top:10px;border-radius:6px" />
    `;
    modal.classList.remove('hidden');
  });

  actions.appendChild(updateBtn);
  actions.appendChild(deleteBtn);
  actions.appendChild(viewBtn);

  meta.appendChild(title);
  meta.appendChild(author);
  meta.appendChild(price);
  meta.appendChild(actions);

  el.appendChild(img);
  el.appendChild(meta);

  return el;
}

// Re-render all books from docs array
function renderBooksList(docs) {
  booksContainer.innerHTML = '';
  docs.forEach(docSnap => {
    const id = docSnap.id;
    const data = docSnap.data();
    const card = renderBook(id, data);
    booksContainer.appendChild(card);
  });
}

// Realtime listener to books collection
const booksCol = collection(db, 'books');
const q = query(booksCol, orderBy('title')); // sort by title for stable display

onSnapshot(q, (snapshot) => {
  // snapshot is real-time; render all docs
  renderBooksList(snapshot.docs);
});

// Add Book
addBookForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const price = parseFloat(document.getElementById('price').value);
  const imageUrl = document.getElementById('imageUrl').value.trim();

  if (!title || !author || isNaN(price)) {
    alert('Please fill Title, Author and a valid Price');
    return;
  }

  try {
    await addDoc(collection(db, 'books'), {
      title,
      author,
      price,
      coverImageURL: imageUrl || ''
    });

    addBookForm.reset();
  } catch (err) {
    console.error('Add book failed', err);
    alert('Failed to add book. See console.');
  }
});

// Insert dummy data helper
insertDummyBtn.addEventListener('click', async () => {
  const dummy = [
    { title: "The Pragmatic Programmer", author: "Andy Hunt", price: 29.99, coverImageURL: "https://images-na.ssl-images-amazon.com/images/I/41as+WafrFL._SX396_BO1,204,203,200_.jpg" },
    { title: "You Don't Know JS", author: "Kyle Simpson", price: 19.99, coverImageURL: "https://images-na.ssl-images-amazon.com/images/I/51p+gWgE7VL._SX218_BO1,204,203,200_QL40_FMwebp_.jpg" },
    { title: "Clean Code", author: "Robert C. Martin", price: 34.50, coverImageURL: "https://images-na.ssl-images-amazon.com/images/I/41xShlnTZTL._SX374_BO1,204,203,200_.jpg" },
    { title: "Eloquent JavaScript", author: "Marijn Haverbeke", price: 24.00, coverImageURL: "https://eloquentjavascript.net/img/cover.svg" },
    { title: "Design Patterns", author: "Gang of Four", price: 39.99, coverImageURL: "" },
    { title: "JavaScript: The Good Parts", author: "Douglas Crockford", price: 15.00, coverImageURL: "" }
  ];

  try {
    for (const book of dummy) {
      await addDoc(collection(db, 'books'), book);
    }
    alert('Dummy books inserted.');
  } catch (err) {
    console.error(err);
    alert('Failed to insert dummy data');
  }
});
