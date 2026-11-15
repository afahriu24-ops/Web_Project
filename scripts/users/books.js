// Books Management

class Books {
    constructor() {
        this.books = store.getBooks();
        this.genres = store.getGenres();

        this.attachEventListeners();
        this.populateGenreDropdown();
        this.updateGenresList();
        this.updateStats();
        this.displayBooks();
    }

    attachEventListeners() {
        const self = this;

        $('#manageGenresBtn').click(function() {
            self.showGenresModal();
        });
        $('#addGenreBtn').click(function() {
            self.addGenre();
        });
        $('#addBookBtn').click(function() {
            self.showAddBookModal();
        });
        $('#saveBookBtn').click(function() {
            self.saveNewBook();
        });
        $('.modal-close').click(function() {
            $(this).closest('.modal').removeClass('open');
        });

        // The rows are created later, so the clicks are caught on the table body
        $('#booksTableBody').on('click', '.btn-view', function() {
            self.viewBook($(this).data('index'));
        });
        $('#booksTableBody').on('click', '.btn-edit', function() {
            self.editBook($(this).data('index'));
        });
        $('#booksTableBody').on('click', '.btn-delete', function() {
            self.deleteBook($(this).data('index'));
        });
        $('#genresList').on('click', '.btn-delete', function() {
            self.deleteGenre($(this).data('index'));
        });
    }

    populateGenreDropdown() {
        const select = $('#bookGenre');
        const currentValue = select.val();

        let html = '<option value="">Select a genre</option>';
        for (let i = 0; i < this.genres.length; i++) {
            const genre = store.escapeHtml(this.genres[i]);
            html = html + '<option value="' + genre + '">' + genre + '</option>';
        }
        select.html(html);

        if (currentValue && this.genres.includes(currentValue)) {
            select.val(currentValue);
        }
    }

    updateGenresList() {
        if (this.genres.length === 0) {
            $('#genresList').html('<p class="empty-text">No genres added yet.</p>');
            return;
        }

        let html = '';
        for (let i = 0; i < this.genres.length; i++) {
            html = html
                + '<div class="category-row">'
                + '<span>' + store.escapeHtml(this.genres[i]) + '</span>'
                + '<button class="btn btn-delete" data-index="' + i + '">Delete</button>'
                + '</div>';
        }
        $('#genresList').html(html);
    }

    updateStats() {
        const totalBooks = this.books.length;
        const inStockBooks = this.books.filter(function(b) {
            return b.stock > 0;
        }).length;
        const lowStockBooks = this.books.filter(function(b) {
            return b.stock > 0 && b.stock < store.LOW_STOCK;
        }).length;
        const outOfStockBooks = this.books.filter(function(b) {
            return b.stock === 0;
        }).length;

        $('#totalProductsCount').text(totalBooks);
        $('#inStockCount').text(inStockBooks);
        $('#lowStockCount').text(lowStockBooks);
        $('#outOfStockCount').text(outOfStockBooks);

        $('#totalProductsChange').text(totalBooks + ' total books');
        $('#inStockChange').text(inStockBooks > 0 ? 'Good availability' : 'No books in stock');
        $('#lowStockChange').text(lowStockBooks > 0 ? 'Fewer than ' + store.LOW_STOCK + ' copies, reorder soon' : 'All stocked well');
        $('#outOfStockChange').text(outOfStockBooks + ' out of stock');
    }

    displayBooks() {
        if (this.books.length === 0) {
            $('#booksTableBody').html('<tr><td colspan="9" class="empty-text">No books yet</td></tr>');
            return;
        }

        let html = '';
        for (let i = 0; i < this.books.length; i++) {
            const book = this.books[i];

            let stockBadge = 'badge-green';
            if (book.status === 'Out of Stock') {
                stockBadge = 'badge-red';
            } else if (book.status === 'Low Stock') {
                stockBadge = 'badge-yellow';
            }

            html = html
                + '<tr>'
                + '<td>' + store.escapeHtml(book.id) + '</td>'
                + '<td><strong>' + store.escapeHtml(book.title) + '</strong></td>'
                + '<td>' + store.escapeHtml(book.author) + '</td>'
                + '<td>' + store.escapeHtml(book.genre) + '</td>'
                + '<td>' + store.escapeHtml(book.price) + '</td>'
                + '<td><span class="badge ' + stockBadge + '">' + book.stock + ' copies</span></td>'
                + '<td>' + book.sales + '</td>'
                + '<td>♥ ' + store.countWishes(book.id) + '</td>'
                + '<td>'
                + '<button class="btn btn-view" data-index="' + i + '">View</button>'
                + '<button class="btn btn-edit" data-index="' + i + '">Edit</button>'
                + '<button class="btn btn-delete" data-index="' + i + '">Delete</button>'
                + '</td>'
                + '</tr>';
        }
        $('#booksTableBody').html(html);
    }

    viewBook(index) {
        const book = this.books[index];
        alert('Book Details:\n\nID: ' + book.id
            + '\nTitle: ' + book.title
            + '\nAuthor: ' + book.author
            + '\nGenre: ' + book.genre
            + '\nPrice: ' + book.price
            + '\nStock: ' + book.stock + ' copies'
            + '\nCopies sold: ' + book.sales
            + '\nOn wishlists: ' + store.countWishes(book.id)
            + '\nStatus: ' + book.status);
    }

    editBook(index) {
        const book = this.books[index];
        const newStock = prompt('Edit Stock for "' + book.title + '":\n\nCurrent Stock: ' + book.stock + '\n\nEnter new number of copies:', book.stock);

        if (newStock === null) {
            return;
        }
        if (newStock.trim().length === 0 || isNaN(newStock) || parseInt(newStock, 10) < 0) {
            alert('Please enter a valid stock quantity (cannot be negative)');
            return;
        }

        book.stock = parseInt(newStock, 10);
        book.status = store.stockStatus(book.stock);
        store.saveBooks(this.books);
        this.displayBooks();
        this.updateStats();
        alert('Book updated successfully!');
    }

    deleteBook(index) {
        const book = this.books[index];
        if (confirm('Are you sure you want to delete "' + book.title + '"?')) {
            this.books.splice(index, 1);
            store.saveBooks(this.books);
            store.forgetBooks([book.id]);
            this.displayBooks();
            this.updateStats();
            alert('Book deleted successfully!');
        }
    }

    showAddBookModal() {
        $('#bookTitle').val('');
        $('#bookAuthor').val('');
        $('#bookGenre').val('');
        $('#bookPrice').val('');
        $('#bookStock').val('');
        $('#addBookModal').addClass('open');
    }

    saveNewBook() {
        const title = $('#bookTitle').val().trim();
        const author = $('#bookAuthor').val().trim();
        const genre = $('#bookGenre').val();
        const priceText = $('#bookPrice').val().trim();
        const stockValue = $('#bookStock').val().trim();

        if (title.length === 0) {
            alert('Please enter a book title');
            return;
        }
        if (author.length === 0) {
            alert('Please enter the author');
            return;
        }

        const existingBook = this.books.find(function(b) {
            return b.title.toLowerCase() === title.toLowerCase() && b.author.toLowerCase() === author.toLowerCase();
        });
        if (existingBook) {
            alert('"' + title + '" by ' + author + ' is already in the store.');
            return;
        }

        if (!genre) {
            alert('Please select a genre');
            return;
        }

        const price = store.formatPrice(priceText);
        if (price === '') {
            alert('Please enter a valid price, for example 12.99');
            return;
        }

        if (stockValue.length === 0 || isNaN(stockValue) || parseInt(stockValue, 10) < 0) {
            alert('Please enter a valid stock quantity (cannot be negative)');
            return;
        }

        const stock = parseInt(stockValue, 10);

        this.books.push({
            id: store.nextBookId(),
            title: title,
            author: author,
            genre: genre,
            price: price,
            stock: stock,
            sales: 0,
            status: store.stockStatus(stock)
        });
        store.saveBooks(this.books);
        this.displayBooks();
        this.updateStats();

        $('#addBookModal').removeClass('open');
        alert('Book added successfully!');
    }

    showGenresModal() {
        this.updateGenresList();
        $('#newGenre').val('');
        $('#manageGenresModal').addClass('open');
    }

    addGenre() {
        const genreName = $('#newGenre').val().trim();

        if (genreName.length === 0) {
            alert('Please enter a genre name');
            return;
        }

        if (this.genres.includes(genreName)) {
            alert('This genre already exists');
            return;
        }

        this.genres.push(genreName);
        store.saveGenres(this.genres);
        this.populateGenreDropdown();
        this.updateGenresList();
        $('#newGenre').val('');
    }

    deleteGenre(index) {
        const genre = this.genres[index];
        const booksInGenre = this.books.filter(function(b) {
            return b.genre === genre;
        });

        let confirmMessage = 'Are you sure you want to delete "' + genre + '"?';
        if (booksInGenre.length > 0) {
            confirmMessage = confirmMessage + ' This will also delete ' + booksInGenre.length + ' book(s) in this genre.';
        }

        if (confirm(confirmMessage)) {
            this.books = this.books.filter(function(b) {
                return b.genre !== genre;
            });
            store.saveBooks(this.books);
            store.forgetBooks(booksInGenre.map(function(b) {
                return b.id;
            }));

            this.genres.splice(index, 1);
            store.saveGenres(this.genres);

            this.populateGenreDropdown();
            this.updateGenresList();
            this.displayBooks();
            this.updateStats();

            alert('Genre "' + genre + '" and ' + booksInGenre.length + ' book(s) deleted successfully!');
        }
    }
}

$(document).ready(function() {
    new Books();
});
