// There is no server in this project, so all the data is kept in the browser.
//   localStorage   -> users, books, genres, orders (stay after the browser is closed)
//   sessionStorage -> the user that is logged in right now

const store = {

    // A book with fewer copies than this is shown as "Low Stock"
    LOW_STOCK: 10,

    // ---------- basic helpers ----------

    read: function(key, defaultValue) {
        try {
            const text = localStorage.getItem(key);
            if (text === null) {
                return defaultValue;
            }
            return JSON.parse(text);
        } catch (error) {
            return defaultValue;
        }
    },

    write: function(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    today: function() {
        return new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    },

    // "$12.50" -> 12.5
    parseAmount: function(text) {
        let value = String(text).trim();
        if (value.startsWith("$")) {
            value = value.substring(1);
        }
        return parseFloat(value) || 0;
    },

    // "12.5" or "$12.5" -> "$12.50" (returns "" when it is not a valid price)
    formatPrice: function(text) {
        const value = String(text).trim().replace("$", "");
        if (value.length === 0 || isNaN(value) || parseFloat(value) < 0) {
            return "";
        }
        return "$" + parseFloat(value).toFixed(2);
    },

    // 7 -> "007"
    pad: function(number, size) {
        let text = String(number);
        while (text.length < size) {
            text = "0" + text;
        }
        return text;
    },

    // Shows text on the page as text (so "<b>" is not read as HTML)
    escapeHtml: function(text) {
        return $("<div>").text(text).html();
    },

    stockStatus: function(stock) {
        if (stock === 0) {
            return "Out of Stock";
        }
        if (stock < this.LOW_STOCK) {
            return "Low Stock";
        }
        return "Active";
    },

    // Every genre gets its own cover color (same genre -> same color)
    coverColor: function(genre) {
        const colors = ["#7a2e3b", "#2f4a5c", "#4d6a4a", "#8a5a2b", "#58406b", "#2f5d5a"];
        let sum = 0;
        for (let i = 0; i < genre.length; i++) {
            sum = sum + genre.charCodeAt(i);
        }
        return colors[sum % colors.length];
    },

    // ---------- logged in user (sessionStorage) ----------

    getCurrentUser: function() {
        return JSON.parse(sessionStorage.getItem("currentUser"));
    },

    setCurrentUser: function(user) {
        sessionStorage.setItem("currentUser", JSON.stringify(user));
    },

    removeCurrentUser: function() {
        sessionStorage.removeItem("currentUser");
    },

    // ---------- users ----------

    getUsers: function() {
        return this.read("users", []);
    },

    saveUsers: function(users) {
        this.write("users", users);
    },

    findUser: function(email) {
        return this.getUsers().find(function(user) {
            return user.email === email;
        });
    },

    login: function(email, password) {
        return this.getUsers().find(function(user) {
            return user.email === email && user.password === password;
        });
    },

    addUser: function(user) {
        if (this.findUser(user.email)) {
            throw new Error("A user with this email already exists.");
        }
        const users = this.getUsers();
        users.push(user);
        this.saveUsers(users);
    },

    // changes = only the fields that must be changed, for example { status: "Inactive" }
    updateUser: function(oldEmail, changes) {
        const users = this.getUsers();
        const user = users.find(function(u) {
            return u.email === oldEmail;
        });
        if (!user) {
            throw new Error("User not found.");
        }
        if (changes.email && changes.email !== oldEmail && this.findUser(changes.email)) {
            throw new Error("Email already in use.");
        }
        for (const key in changes) {
            user[key] = changes[key];
        }
        this.saveUsers(users);
        return user;
    },

    deleteUser: function(email) {
        const users = this.getUsers().filter(function(user) {
            return user.email !== email;
        });
        this.saveUsers(users);
    },

    getCustomers: function() {
        return this.getUsers().filter(function(user) {
            return user.role === "customer";
        });
    },

    // ---------- books and genres ----------

    getBooks: function() {
        return this.read("books", []);
    },

    saveBooks: function(books) {
        this.write("books", books);
    },

    getGenres: function() {
        return this.read("genres", []);
    },

    saveGenres: function(genres) {
        this.write("genres", genres);
    },

    // #BK-001, #BK-002 ... (one more than the biggest number used)
    nextBookId: function() {
        const books = this.getBooks();
        let biggest = 0;
        for (let i = 0; i < books.length; i++) {
            const number = parseInt(books[i].id.substring(4), 10);
            if (number > biggest) {
                biggest = number;
            }
        }
        return "#BK-" + this.pad(biggest + 1, 3);
    },

    // ---------- shopping cart ----------

    saveCart: function(email, cart) {
        this.updateUser(email, { shoppingCart: cart });
    },

    // Puts one copy of the book in the cart of the user (in the users list and in the session)
    addToCart: function(user, book) {
        const cart = user.shoppingCart || [];
        const existing = cart.find(function(item) {
            return item.id === book.id;
        });

        if (existing) {
            if (existing.quantity >= book.stock) {
                throw new Error('Sorry, only ' + book.stock + ' cop' + (book.stock === 1 ? 'y' : 'ies') + ' of "' + book.title + '" available.');
            }
            existing.quantity = existing.quantity + 1;
        } else {
            cart.push({ id: book.id, title: book.title, author: book.author, price: book.price, quantity: 1 });
        }

        user.shoppingCart = cart;
        this.saveCart(user.email, cart);
        this.setCurrentUser(user);
    },

    // ---------- wishlist ----------
    // Every customer has a list of book ids: user.wishlist = ["#BK-001", "#BK-004"]

    isWished: function(user, bookId) {
        return (user.wishlist || []).indexOf(bookId) !== -1;
    },

    // Adds the book to the wishlist, or removes it when it is already there.
    // Returns true when the book is on the wishlist after the click.
    toggleWishlist: function(user, bookId) {
        const wishlist = (user.wishlist || []).slice();
        const position = wishlist.indexOf(bookId);
        if (position === -1) {
            wishlist.push(bookId);
        } else {
            wishlist.splice(position, 1);
        }

        this.updateUser(user.email, { wishlist: wishlist });
        user.wishlist = wishlist;
        this.setCurrentUser(user);
        return position === -1;
    },

    // The books of the wishlist (books that were deleted are skipped)
    getWishlistBooks: function(user) {
        const wishlist = user.wishlist || [];
        return this.getBooks().filter(function(book) {
            return wishlist.indexOf(book.id) !== -1;
        });
    },

    // How many customers have this book on their wishlist
    countWishes: function(bookId) {
        return this.getCustomers().filter(function(customer) {
            return (customer.wishlist || []).indexOf(bookId) !== -1;
        }).length;
    },

    // Called when books are deleted, so an old wishlist never points to a new book that gets the same id
    forgetBooks: function(bookIds) {
        const users = this.getUsers();
        users.forEach(function(user) {
            if (user.wishlist) {
                user.wishlist = user.wishlist.filter(function(id) {
                    return bookIds.indexOf(id) === -1;
                });
            }
        });
        this.saveUsers(users);
    },

    // ---------- orders ----------

    getOrders: function() {
        return this.read("orders", []);
    },

    saveOrders: function(orders) {
        this.write("orders", orders);
    },

    // Turns the cart of a customer into an order, lowers the stock and empties the cart
    checkout: function(user, cart) {
        if (cart.length === 0) {
            throw new Error("Your bag is empty.");
        }

        const books = this.getBooks();
        let total = 0;
        let summary = "";
        const items = [];

        for (let i = 0; i < cart.length; i++) {
            const item = cart[i];
            total = total + this.parseAmount(item.price) * item.quantity;

            if (i > 0) {
                summary = summary + ", ";
            }
            summary = summary + item.title + " × " + item.quantity;
            items.push({ title: item.title, quantity: item.quantity });

            const book = books.find(function(b) {
                return b.id === item.id;
            });
            if (book) {
                book.stock = Math.max(0, book.stock - item.quantity);
                book.sales = (book.sales || 0) + item.quantity;
                book.status = this.stockStatus(book.stock);
            }
        }

        const order = {
            id: "#ORD-" + Date.now(),
            customer: (user.name + " " + user.surname).trim(),
            books: summary,
            items: items,
            date: this.today(),
            amount: "$" + total.toFixed(2),
            status: "Delivered"
        };

        const orders = this.getOrders();
        orders.push(order);
        this.saveOrders(orders);
        this.saveBooks(books);
        this.saveCart(user.email, []);
        return order;
    },

    // Revenue of every month of this year: [Jan, Feb, ... Dec]
    monthlyRevenue: function(orders) {
        const months = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const currentYear = new Date().getFullYear();
        for (let i = 0; i < orders.length; i++) {
            const orderDate = new Date(orders[i].date);
            if (orderDate.getFullYear() === currentYear) {
                months[orderDate.getMonth()] = months[orderDate.getMonth()] + this.parseAmount(orders[i].amount);
            }
        }
        return months;
    },

    // ---------- first start ----------

    // The store always needs an admin and some genres.
    // The sample books are only added the very first time (an empty shelf stays empty).
    seed: function() {
        if (this.getUsers().length === 0) {
            this.saveUsers([new Admin("admin@gmail.com", "admin123", "admin", "admin")]);
        }
        if (this.getGenres().length === 0) {
            this.saveGenres(["Fiction", "Fantasy", "Sci-Fi", "Mystery", "Non-Fiction", "Children's"]);
        }
        if (localStorage.getItem("books") === null) {
            const samples = [
                ["The Great Gatsby", "F. Scott Fitzgerald", "Fiction", 9.99, 40],
                ["Pride and Prejudice", "Jane Austen", "Fiction", 8.99, 35],
                ["The Hobbit", "J.R.R. Tolkien", "Fantasy", 13.50, 18],
                ["A Wizard of Earthsea", "Ursula K. Le Guin", "Fantasy", 10.99, 7],
                ["Dune", "Frank Herbert", "Sci-Fi", 14.99, 22],
                ["Neuromancer", "William Gibson", "Sci-Fi", 12.00, 0],
                ["Murder on the Orient Express", "Agatha Christie", "Mystery", 9.50, 30],
                ["The Hound of the Baskervilles", "Arthur Conan Doyle", "Mystery", 8.00, 9],
                ["Sapiens", "Yuval Noah Harari", "Non-Fiction", 16.99, 15],
                ["A Brief History of Time", "Stephen Hawking", "Non-Fiction", 13.99, 12],
                ["Charlotte's Web", "E. B. White", "Children's", 7.99, 28],
                ["Matilda", "Roald Dahl", "Children's", 8.49, 20]
            ];
            const books = [];
            for (let i = 0; i < samples.length; i++) {
                books.push({
                    id: "#BK-" + this.pad(i + 1, 3),
                    title: samples[i][0],
                    author: samples[i][1],
                    genre: samples[i][2],
                    price: "$" + samples[i][3].toFixed(2),
                    stock: samples[i][4],
                    sales: 0,
                    status: this.stockStatus(samples[i][4])
                });
            }
            this.saveBooks(books);
        }
    }
};

store.seed();
