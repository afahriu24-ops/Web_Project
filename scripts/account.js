$(document).ready(function() {
    const currentUser = store.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Load user info
    $('#name').val(currentUser.name);
    $('#surname').val(currentUser.surname);
    $('#email').val(currentUser.email);
    $('#password').val(currentUser.password);

    let originalData = currentUser;

    function showReadOnly() {
        $('#name, #surname, #email, #password').prop('readonly', true);
        $('#edit-btn').show();
        $('#save-btn, #cancel-btn').hide();
    }

    // Edit button
    $('#edit-btn').click(function() {
        $('#name, #surname, #email, #password').prop('readonly', false);
        $('#edit-btn').hide();
        $('#save-btn, #cancel-btn').show();
    });

    // Cancel button
    $('#cancel-btn').click(function() {
        $('#name').val(originalData.name);
        $('#surname').val(originalData.surname);
        $('#email').val(originalData.email);
        $('#password').val(originalData.password);
        showReadOnly();
    });

    // Save button
    $('#save-btn').click(function() {
        const newName = $('#name').val().trim();
        const newSurname = $('#surname').val().trim();
        const newEmail = $('#email').val().trim();
        const newPassword = $('#password').val().trim();

        if (newName.length === 0 || newSurname.length === 0 || newEmail.length === 0 || newPassword.length === 0) {
            alert('All fields are required.');
            return;
        }

        try {
            const updatedUser = store.updateUser(originalData.email, {
                email: newEmail,
                name: newName,
                surname: newSurname,
                password: newPassword
            });

            store.setCurrentUser(updatedUser);
            originalData = updatedUser;
            showReadOnly();
            alert('Account updated successfully!');
        } catch (error) {
            alert(error.message);
        }
    });

    // ---------- wishlist (customers only) ----------

    function renderWishlist() {
        const user = store.getCurrentUser();
        const books = store.getWishlistBooks(user);

        if (books.length === 0) {
            $('#wishlist-items').html('<p class="wishlist-empty">No saved books yet. Tap the ♡ on a book in the <a href="shop.html">shop</a>.</p>');
            return;
        }

        let html = '';
        for (let i = 0; i < books.length; i++) {
            const book = books[i];
            let buttons = '<button class="btn btn-gray wish-remove" data-id="' + store.escapeHtml(book.id) + '">Remove</button>';
            let stockText = book.stock + ' in stock';
            if (book.stock > 0) {
                buttons = '<button class="btn btn-green wish-add" data-id="' + store.escapeHtml(book.id) + '">Add to bag</button>' + buttons;
            } else {
                stockText = 'Out of stock';
            }

            html = html
                + '<div class="wish-row">'
                + '<div class="wish-cover" style="background-color: ' + store.coverColor(book.genre) + ';">📖</div>'
                + '<div class="wish-info">'
                + '<strong>' + store.escapeHtml(book.title) + '</strong>'
                + '<span>' + store.escapeHtml(book.author) + ' • ' + store.escapeHtml(book.genre) + '</span>'
                + '<span>' + store.escapeHtml(book.price) + ' • ' + stockText + '</span>'
                + '</div>'
                + '<div class="wish-actions">' + buttons + '</div>'
                + '</div>';
        }
        $('#wishlist-items').html(html);
    }

    if (currentUser.role === 'customer') {
        renderWishlist();

        $('#wishlist-items').on('click', '.wish-remove', function() {
            store.toggleWishlist(store.getCurrentUser(), $(this).data('id'));
            renderWishlist();
        });

        $('#wishlist-items').on('click', '.wish-add', function() {
            const book = store.getBooks().find(function(b) {
                return b.id === $(this).data('id');
            }.bind(this));
            try {
                store.addToCart(store.getCurrentUser(), book);
                alert('Added "' + book.title + '" to your bag.');
            } catch (error) {
                alert(error.message);
            }
        });
    } else {
        $('#wishlist-section').hide();
    }

    const logoutDialog = document.getElementById('logout-dialog');

    $('#logout-btn').click(function() {
        logoutDialog.showModal();
    });

    $('#cancel-logout').click(function() {
        logoutDialog.close();
    });

    $('#confirm-logout').click(function() {
        store.removeCurrentUser();
        window.location.href = 'login.html';
    });
});
