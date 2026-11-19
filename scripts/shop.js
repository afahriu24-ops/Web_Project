const currentCustomer = store.getCurrentUser();
const accountButton = $('#account_button');
const accountLabel = $('#account_label');
const cartButton = $('#cart_button');
const cartPanel = $('#cart_panel');
const cartItemsContainer = $('#cart_items');
const cartClose = $('#cart_close');
const checkoutButton = $('#checkout_button');
const bookGrid = $('.product-grid');
const resultsCount = $('.results-count');
const categoryList = $('.category-list');
const bookSearch = $('.nav-search input');

const ALL_BOOKS = 'All Books';
const WISHLIST = '♥ My Wishlist';

let allBooks = [];
let categoryItems = [ALL_BOOKS];
let activeCategory = ALL_BOOKS;
let searchTerm = '';

function isLoggedIn() {
    return currentCustomer && currentCustomer.name;
}

function getCart() {
    if (currentCustomer && currentCustomer.shoppingCart) {
        return currentCustomer.shoppingCart;
    }
    return [];
}

// Saves the cart in the users list and in the session
function saveCurrentCustomer() {
    store.saveCart(currentCustomer.email, currentCustomer.shoppingCart);
    store.setCurrentUser(currentCustomer);
}

function calculateCartTotal(cart) {
    return cart.reduce(function(total, item) {
        return total + store.parseAmount(item.price) * item.quantity;
    }, 0);
}

function loadBooks() {
    allBooks = store.getBooks().map(function(book) {
        return {
            id: book.id,
            title: book.title,
            author: book.author,
            genre: book.genre,
            price: store.formatPrice(book.price) || '$0.00',
            stock: book.stock
        };
    });
}

function wishlistCount() {
    if (!isLoggedIn()) {
        return 0;
    }
    return allBooks.filter(function(book) {
        return store.isWished(currentCustomer, book.id);
    }).length;
}

function getFilteredBooks() {
    return allBooks.filter(function(book) {
        let matchesCategory = activeCategory === ALL_BOOKS || book.genre === activeCategory;
        if (activeCategory === WISHLIST) {
            matchesCategory = store.isWished(currentCustomer, book.id);
        }

        const matchesSearch = searchTerm.length === 0
            || book.title.toLowerCase().includes(searchTerm)
            || book.author.toLowerCase().includes(searchTerm)
            || book.genre.toLowerCase().includes(searchTerm)
            || book.id.toLowerCase().includes(searchTerm);

        return matchesCategory && matchesSearch;
    });
}

function renderCategories() {
    const counts = allBooks.reduce(function(genreCounts, book) {
        genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
        return genreCounts;
    }, {});

    categoryItems = [ALL_BOOKS];
    if (isLoggedIn()) {
        categoryItems.push(WISHLIST);
    }
    categoryItems = categoryItems.concat(Object.keys(counts).sort());

    let html = '';
    for (let i = 0; i < categoryItems.length; i++) {
        const category = categoryItems[i];
        let count = counts[category];
        if (category === ALL_BOOKS) {
            count = allBooks.length;
        }
        if (category === WISHLIST) {
            count = wishlistCount();
        }
        let activeClass = '';
        if (category === activeCategory) {
            activeClass = 'active';
        }

        html = html + '<li><a href="#" class="' + activeClass + '" data-index="' + i + '">'
            + store.escapeHtml(category) + ' <span class="count">' + count + '</span></a></li>';
    }
    categoryList.html(html);
}

function renderBooks() {
    const filteredBooks = getFilteredBooks();
    let countText = filteredBooks.length + ' book';
    if (filteredBooks.length !== 1) {
        countText = countText + 's';
    }
    resultsCount.text(countText);

    if (filteredBooks.length === 0) {
        let title = 'Try another search or genre.';
        if (activeCategory === WISHLIST && searchTerm.length === 0) {
            title = 'Tap the heart on a book to save it here.';
        }
        bookGrid.html(
            '<div class="product-card empty-message">'
            + '<p class="product-category">No books found</p>'
            + '<h3 class="product-name">' + title + '</h3>'
            + '</div>'
        );
        return;
    }

    let html = '';
    for (let i = 0; i < filteredBooks.length; i++) {
        const book = filteredBooks[i];
        const inStock = book.stock > 0;
        let stockLabel = 'Out of stock';
        let stockBadgeClass = 'badge-sale';
        let buttonDisabled = 'disabled';
        let buttonLabel = 'Unavailable';
        if (inStock) {
            stockLabel = book.stock + ' in stock';
            stockBadgeClass = 'badge-new';
            buttonDisabled = '';
            buttonLabel = 'Add to bag';
        }

        let heartClass = 'wish-btn';
        let heartSymbol = '♡';
        let heartTitle = 'Add to wishlist';
        if (isLoggedIn() && store.isWished(currentCustomer, book.id)) {
            heartClass = 'wish-btn active';
            heartSymbol = '♥';
            heartTitle = 'Remove from wishlist';
        }

        html = html
            + '<article class="product-card" data-id="' + store.escapeHtml(book.id) + '">'
            + '<div class="product-img">'
            + '<span class="product-badge ' + stockBadgeClass + '">' + stockLabel + '</span>'
            + '<button class="' + heartClass + '" title="' + heartTitle + '" aria-label="' + heartTitle + '">' + heartSymbol + '</button>'
            + '<div class="book-cover" style="background-color: ' + store.coverColor(book.genre) + ';">'
            + '<span class="cover-title">' + store.escapeHtml(book.title) + '</span>'
            + '<span class="cover-author">' + store.escapeHtml(book.author) + '</span>'
            + '</div>'
            + '</div>'
            + '<div class="product-info">'
            + '<p class="product-category">' + store.escapeHtml(book.genre) + '</p>'
            + '<h3 class="product-name">' + store.escapeHtml(book.title) + '</h3>'
            + '<p class="product-author">by ' + store.escapeHtml(book.author) + '</p>'
            + '<div class="product-footer">'
            + '<span class="price-current">' + store.escapeHtml(book.price) + '</span>'
            + '<button class="add-to-cart" ' + buttonDisabled + '>' + buttonLabel + '</button>'
            + '</div>'
            + '</div>'
            + '</article>';
    }
    bookGrid.html(html);
}

function refreshShop() {
    loadBooks();
    renderCategories();
    renderBooks();
}

function updateCartTotal(cart) {
    const total = calculateCartTotal(cart);
    $('#cart_total strong').text('$' + total.toFixed(2));
}

function renderCartItems() {
    const cart = getCart();
    if (cart.length === 0) {
        cartItemsContainer.html('<div class="cart-empty">Your bag is empty.</div>');
        checkoutButton.prop('disabled', true);
        updateCartTotal([]);
        return;
    }

    let html = '';
    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        html = html
            + '<div class="cart-item">'
            + '<div class="cart-item-content">'
            + '<div class="cart-item-name">' + store.escapeHtml(item.title) + '</div>'
            + '<div class="cart-item-meta">' + store.escapeHtml(item.author) + ' • Qty ' + item.quantity + '</div>'
            + '</div>'
            + '<div class="cart-item-price">' + store.escapeHtml(item.price) + '</div>'
            + '<button class="cart-item-delete" data-index="' + i + '">×</button>'
            + '</div>';
    }

    cartItemsContainer.html(html);
    checkoutButton.prop('disabled', false);
    updateCartTotal(cart);
}

function closeCart() {
    cartPanel.addClass('hidden');
}

if (isLoggedIn()) {
    accountLabel.text(currentCustomer.name);
    accountButton.attr('title', 'Account');
} else {
    accountLabel.text('Login');
    accountButton.attr('title', 'Login');
}

accountButton.click(function() {
    if (isLoggedIn()) {
        window.location.href = 'account.html';
    } else {
        window.location.href = 'login.html';
    }
});

cartButton.click(function(event) {
    event.stopPropagation();
    if (!isLoggedIn()) {
        alert('Please log in to view your shopping bag.');
        return;
    }

    renderCartItems();
    cartPanel.toggleClass('hidden');
});

cartClose.click(closeCart);

checkoutButton.click(function() {
    if (!isLoggedIn()) {
        return;
    }
    const cart = getCart();
    if (cart.length === 0) {
        return;
    }

    try {
        store.checkout(currentCustomer, cart);
        currentCustomer.shoppingCart = [];
        store.setCurrentUser(currentCustomer);
        refreshShop();
        renderCartItems();
        closeCart();
        alert('Your order has been placed.');
    } catch (error) {
        alert(error.message);
    }
});

// A click anywhere else closes the cart
$(document).click(function(event) {
    if (!cartPanel.hasClass('hidden') && $(event.target).closest('#cart_panel, #cart_button').length === 0) {
        closeCart();
    }
});

$(document).on('click', '.cart-item-delete', function() {
    const index = $(this).data('index');
    const cart = getCart();
    cart.splice(index, 1);
    currentCustomer.shoppingCart = cart;
    saveCurrentCustomer();
    renderCartItems();
});

$(document).on('click', '.category-list a', function(event) {
    event.preventDefault();
    activeCategory = categoryItems[$(this).data('index')];
    renderCategories();
    renderBooks();
});

bookSearch.on('input', function() {
    searchTerm = $(this).val().trim().toLowerCase();
    renderBooks();
});

// The heart on a book: add to / remove from the wishlist
$(document).on('click', '.wish-btn', function() {
    if (!isLoggedIn()) {
        alert('Please log in to save books to your wishlist.');
        return;
    }

    const bookId = $(this).closest('.product-card').data('id');
    store.toggleWishlist(currentCustomer, bookId);
    renderCategories();
    renderBooks();
});

$(document).on('click', '.add-to-cart', function() {
    if (!isLoggedIn()) {
        alert('Please log in to add books to your bag.');
        return;
    }

    const bookId = $(this).closest('.product-card').data('id');
    const book = allBooks.find(function(b) {
        return b.id === bookId;
    });
    if (!book || book.stock <= 0) {
        return;
    }

    try {
        store.addToCart(currentCustomer, book);
    } catch (error) {
        alert(error.message);
        return;
    }

    alert('Added "' + book.title + '" to your bag.');
    if (!cartPanel.hasClass('hidden')) {
        renderCartItems();
    }
});

// Initialize shop on page load
$(document).ready(function() {
    refreshShop();
});
