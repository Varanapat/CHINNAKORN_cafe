const express = require("express");
const cookieParser = require("cookie-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;


// Middleware
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

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
            json_group_array(
                json_object(
                    'quantity', oi.quantity,
                    'menu_name', m.menu_name,
                    'option_name', i.option_name
                )
            ) AS items
        FROM Orders o
        LEFT JOIN OrderItem oi 
        ON oi.order_id = o.order_id
        LEFT JOIN Menu m 
        ON oi.menu_id = m.menu_id
        LEFT JOIN OrderItemOption oip 
        ON oip.order_item_id = oi.order_item_id
        LEFT JOIN ItemOption i ON i.option_id = oip.option_id
        WHERE m.category_id != 7
        GROUP BY o.order_id
        ORDER BY o.order_time
    `;

    db.all(query, (err, rows) => {
        if (err) {
            console.log(err.message);
        }
        res.render('main', { data: rows });
    });
});


//จำลอง event เมื่อมีออเดอร์ใหม่ (ในของจริงจะเรียกตอน insert)
app.post("/new-order", (req, res) => {
    const newOrder = { order_id: Date.now(), menu_name: "Latte" };
    io.emit("newOrder", newOrder); // แจ้งทุก client
    res.json({ success: true });
});


// Socket.io เชื่อมต่อ
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
});


app.get('/inventory', (req, res) => {
    // Query ออเดอร์
    const orderQuery = `
        SELECT 
            o.order_id,
            time(o.order_time) AS order_time,
            o.order_type,
            json_group_array(
                json_object(
                    'quantity', oi.quantity,
                    'menu_name', m.menu_name,
                    'option_name', i.option_name
                )
            ) AS items
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
        GROUP BY o.order_id
        ORDER BY o.order_time
    `;

    // Query เมนู
    const menuQuery = `SELECT * FROM Menu`;

    // รัน query ออเดอร์ก่อน
    db.all(orderQuery, (err, data) => {
        if (err) return res.send(err.message);

        // รัน query เมนู
        db.all(menuQuery, (err, menus) => {
            if (err) return res.send(err.message);

            // แยก bakery / drinks
            const bakery = menus.filter(m => m.category_id === 7);
            const drinks = menus.filter(m => m.category_id !== 7);
            // console.log(bakery);
            

            bakery.forEach(b => b.is_available = !!b.is_available);
            // drinks.forEach(d => d.is_available = !!d.is_available);

            // console.log(drinks);
            

            const format_drink = drinks.map(d => ({
                menu_image: d.menu_image,
                menu_id: d.menu_id,
                menu_name: d.menu_name,
                base_price: d.base_price,
                is_avaliable: d.is_avaliable === 1 ? true : false,
                stock_qty: d.stock_qty
            }));
            
            // ส่ง data ทั้งหมดไป render
            res.render('inventory', {
                data,   // ออเดอร์ทั้งหมด
                drinks : format_drink,   // เมนูเครื่องดื่ม
                bakery    // เมนู bakery
            });
        });
    });
});


//  toggle เครื่องดื่ม
app.post('/inventory/toggle/:id', (req, res) => {
  const id = req.params.id;
  
  const { is_avaliable } = req.body;

  if (typeof is_avaliable === 'undefined') {
    return res.status(400).json({ success: false, message: 'Missing is_available field' });
  }

  // ใช้ตาราง Menu และ column is_avaliable
  const sql = `UPDATE Menu SET is_avaliable = ? WHERE menu_id = ?`;
  db.run(sql, [is_avaliable ? 1 : 0, id], function (err) {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ success: false, message: 'Database update failed' });
    }

    res.json({ success: true, is_avaliable });
  });
});


//  เพิ่ม/ลดจำนวนเบเกอรี่
app.post('/inventory/stock/:id', (req, res) => {
  const id = req.params.id;
  const { change } = req.body;

  if (typeof change === 'undefined') {
    return res.status(400).json({ success: false, message: 'Missing change value' });
  }

  // ใช้ตาราง Menu และ column stock_qty
  const sqlGet = `SELECT stock_qty FROM Menu WHERE menu_id = ? AND category_id = 7`; // 7 = bakery
  db.get(sqlGet, [id], (err, row) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ success: false, message: 'Database query failed' });
    }

    if (!row) {
      return res.status(404).json({ success: false, message: 'Bakery not found' });
    }

    const newStock = Math.max(0, row.stock_qty + change); // ป้องกันติดลบ
    const sqlUpdate = `UPDATE Menu SET stock_qty = ? WHERE menu_id = ?`;
    db.run(sqlUpdate, [newStock, id], function (err2) {
      if (err2) {
        console.error('DB Error:', err2);
        return res.status(500).json({ success: false, message: 'Database update failed' });
      }

      res.json({ success: true, newStock });
    });
  });
});



// Start server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});