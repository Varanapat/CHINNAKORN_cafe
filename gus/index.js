const express = require("express");
const cookieParser = require("cookie-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const app = express();
const PORT = 3000;


// Middleware
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));


// Connect DB
const db = new sqlite3.Database("CHINNAKORN_cafe_EN.db", (err) => {
    if (err) {
        console.error("DB connection error:", err.message);
    } else {
        console.log("Connected to CHINNAKORN_cafe_EN.db");
    }
});


// แสดงออเดอร์ทั้งหมด
app.get('/', function (req, res) {
    const query = `
        SELECT 
            o.order_id,
            time(o.order_time) AS order_time, 
            o.order_type, 
            oi.quantity, 
            m.menu_name, 
            i.option_name
        FROM Orders o
        LEFT JOIN OrderItem oi
            ON oi.order_id = o.order_id
        LEFT JOIN Menu m
            ON oi.menu_id = m.menu_id
        LEFT JOIN OrderItemOption oip
            ON oip.order_item_id = oi.order_item_id
        LEFT JOIN ItemOption i
            ON i.option_id = oip.option_id
        WHERE m.category_id != 7
        ORDER BY o.order_time
    `;

    db.all(query, (err, rows) => {
        if (err) {
            console.log(err.message);
        }
        res.render('main', { data: rows });
    });
});


app.get('/inventory', function (req, res) {
    const query = `
        SELECT 
            o.order_id,
            time(o.order_time) AS order_time, 
            o.order_type, 
            oi.quantity, 
            m.menu_name, 
            i.option_name
        FROM Orders o
        LEFT JOIN OrderItem oi
            ON oi.order_id = o.order_id
        LEFT JOIN Menu m
            ON oi.menu_id = m.menu_id
        LEFT JOIN OrderItemOption oip
            ON oip.order_item_id = oi.order_item_id
        LEFT JOIN ItemOption i
            ON i.option_id = oip.option_id
        WHERE m.category_id != 7
        ORDER BY o.order_time
    `;

    db.all(query, (err, rows) => {
        if (err) {
            console.log(err.message);
        }
        res.render('inventory', { data: rows });
    });
});


// endpoint mark เสร็จสิ้น (ลบออเดอร์)
// app.post('/orders/complete/:id', (req, res) => {
//   const id = req.params.id;

//   db.run(`DELETE FROM order_items WHERE order_id = ?`, [id], function(err) {
//     if (err) return res.json({ success: false, error: err.message });

//     db.run(`DELETE FROM orders WHERE id = ?`, [id], function(err) {
//       if (err) return res.json({ success: false, error: err.message });
//       res.json({ success: true });
//     });
//   });
// });


// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});