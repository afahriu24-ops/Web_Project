// Admin dashboard

function displayMonthlyRevenue(orders) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenue = store.monthlyRevenue(orders);

    let html = '';
    for (let i = 0; i < monthNames.length; i++) {
        const revenue = monthlyRevenue[i];
        let boxClass = 'month-box';
        if (revenue > 0) {
            boxClass = 'month-box has-revenue';
        }
        let displayValue = '$' + revenue.toFixed(0);
        if (revenue >= 1000) {
            displayValue = '$' + (revenue / 1000).toFixed(1) + 'k';
        }

        html = html + '<div class="' + boxClass + '"><p>' + monthNames[i] + '</p><h6>' + displayValue + '</h6></div>';
    }
    $('#monthlyRevenueGrid').html(html);
}

function displayTopBooks(orders, books) {
    // how many copies of every book were sold
    const unitsSold = {};
    for (let i = 0; i < orders.length; i++) {
        const items = orders[i].items || [];
        for (let j = 0; j < items.length; j++) {
            unitsSold[items[j].title] = (unitsSold[items[j].title] || 0) + items[j].quantity;
        }
    }

    const names = Object.keys(unitsSold).sort(function(a, b) {
        return unitsSold[b] - unitsSold[a];
    }).slice(0, 5);

    if (names.length === 0) {
        $('#topProductsContainer').html('<p class="empty-text">No orders yet</p>');
        return;
    }

        let html = '';
    for (let i = 0; i < names.length; i++) {
        const title = names[i];
        const copies = unitsSold[title];
        const book = books.find(function(b) {
            return b.title === title;
        });

        let revenueDisplay = '—';
        let subtitle = 'Book';
        let coverColor = store.coverColor('');
        if (book) {
            subtitle = book.author;
            coverColor = store.coverColor(book.genre);
            const totalRevenue = store.parseAmount(book.price) * copies;
            if (totalRevenue > 0) {
                revenueDisplay = '$' + totalRevenue.toFixed(2);
            }
        }
        let unitText = copies + ' cop' + (copies === 1 ? 'y' : 'ies');

        html = html
            + '<div class="product-item">'
            + '<div class="product-img" style="background-color: ' + coverColor + ';">📖</div>'
            + '<div class="product-details">'
            + '<h6>' + store.escapeHtml(title) + '</h6>'
            + '<p>' + store.escapeHtml(subtitle) + '</p>'
            + '</div>'
            + '<div class="product-price">'
            + '<h6>' + revenueDisplay + '</h6>'
            + '<p>' + unitText + '</p>'
            + '</div>'
            + '</div>';
    }
    $('#topProductsContainer').html(html);
}

function displayRecentOrders(orders) {
    if (orders.length === 0) {
        $('#recentOrdersTableBody').html('<tr><td colspan="6" class="empty-text">No orders yet</td></tr>');
        return;
    }

    const recentOrders = orders.slice(-5).reverse();

    let html = '';
    for (let i = 0; i < recentOrders.length; i++) {
        const order = recentOrders[i];
        const initials = order.customer.substring(0, 2).toUpperCase();

        html = html
            + '<tr>'
            + '<td>' + store.escapeHtml(order.id) + '</td>'
            + '<td><span class="initials">' + store.escapeHtml(initials) + '</span>'
            + '<span class="customer-name">' + store.escapeHtml(order.customer) + '</span></td>'
            + '<td>' + store.escapeHtml(order.books) + '</td>'
            + '<td>' + store.escapeHtml(order.date) + '</td>'
            + '<td>' + store.escapeHtml(order.amount) + '</td>'
            + '<td><span class="badge badge-delivered">Completed</span></td>'
            + '</tr>';
    }
    $('#recentOrdersTableBody').html(html);
}

$(document).ready(function() {
    const customers = store.getCustomers();
    const orders = store.getOrders();
    const books = store.getBooks();

    const totalRevenue = orders.reduce(function(sum, order) {
        return sum + store.parseAmount(order.amount);
    }, 0);

    $('#dashboardTotalRevenue').text('$' + totalRevenue.toFixed(2));
    $('#dashboardTotalOrders').text(orders.length);
    $('#dashboardTotalCustomers').text(customers.length);
    $('#dashboardCompletedOrders').text(orders.length);

    displayMonthlyRevenue(orders);
    displayTopBooks(orders, books);
    displayRecentOrders(orders);
});
