const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// -----------------------------
// MIDDLEWARE
// -----------------------------

// Serve static assets from "public"
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON requests
app.use(express.json());

// Serve HTML files from "views"
app.use(express.static(path.join(__dirname, 'views')));

// -----------------------------
// API ROUTES
// -----------------------------

app.get('/api/products', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'products.json');

    try {
        if (!fs.existsSync(filePath)) {
            return res.status(500).json({ error: 'Products file not found' });
        }

        const productsData = fs.readFileSync(filePath, 'utf8');
        const products = JSON.parse(productsData);

        res.json(products);
    } catch (error) {
        console.error('Error reading products:', error);
        res.status(500).json({ error: 'Failed to load products' });
    }
});

// -----------------------------
// PAGE ROUTES
// -----------------------------

// Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Other pages (about.html, store.html, cart.html, contact.html)
app.get('/:page', (req, res) => {
    const page = req.params.page.toLowerCase();
    const validPages = ['about', 'store', 'cart', 'contact'];

    if (validPages.includes(page)) {
        return res.sendFile(path.join(__dirname, 'views', `${page}.html`));
    }

    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// -----------------------------
// START SERVER
// -----------------------------

app.listen(PORT, () => {
    console.log(`Belivers Fashion Brand server running on port ${PORT}`);
});
