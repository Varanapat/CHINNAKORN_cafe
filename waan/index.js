const path = require('path')
const port = 3000;
const express = require('express')
const sqlite3 = require('sqlite3').verbose();

const app = express();




app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// // session
const session = require('express-session');
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// const dbPath = path.join(__dirname, 'Database', 'CHINNAKORN_blueprint.db');
const dbPath = path.join(__dirname, 'Database', 'CHINNAKORN_cafe_TH.db');

let db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error('❌ Database connection error:', err.message);
    }
    console.log('✅ Connected to SQLite database at', dbPath);
});

// const Database = require("better-sqlite3");
// const db = new Database("/Users/moi/Desktop/PROJECT_cafe/code_naive/Database/CHINNAKORN_cafe_TH.db");


// static resourse & templating engine
app.use(express.static('public'));
// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// rounting

// หน้าเเรกเพื่อยอกว่าส่งเข้าไปที่เมนู
app.get('/', (req, res) => {
    console.log('Web starting');
    const sql = `SELECT category_id FROM Category ORDER BY category_id ASC LIMIT 1;`;

    db.get(sql, (err, row) => {
        if (err) {
            console.log(err.message);
            // console.log('/ not WORK!!!!')

            return res.send("Error loading categories");
        }
        if (row) {
            res.redirect(`/category`);
            // console.log('/ WORK!!!!')

        } else {
            // ดักว่าไม่มีหมวดหมู่ เพื่อไม่ให้เกิด error
            res.send("No categories found");
            // console.log('/ WORK!!!!')

        }
    });
});

// ส่วนที่ส่งเข้าไป เป็นตัวเลือกให้เลือกเมนู 
app.get('/category', (req, res) => {
    // const { id } = req.params;
    // console.log('cate WORK!!!!')

    const cate_select_sql = `SELECT * FROM Category`;
    const menu_select_sql = `SELECT * FROM MENU;`;
    const option_selector_sql = `
        SELECT 
            m.menu_id, 
            m.menu_name, 
            og.group_name,
            og.is_required
        FROM menu m
        INNER JOIN Menu_OptionGroup mo
            ON m.menu_id = mo.menu_id
        INNER JOIN OptionGroup og 
            ON mo.option_group_id = og.option_group_id`;

    const item_selector_sql = `
        SELECT 
            og.group_name,
            it.option_name,
            it.extra_price
        FROM OptionGroup og 
        INNER JOIN ItemOption it
            ON og.option_group_id = it.option_group_id;`;

    db.all(cate_select_sql, (err, cate) => {
        if (err) return console.log(err.message);

        db.all(menu_select_sql, (err, data_menu) => {
            if (err) return console.log(err.message);

            db.all(option_selector_sql, (err, selector) => {
                if (err) return console.log(err.message);

                db.all(item_selector_sql, (err, item_selector) => {
                    if (err) return console.log(err.message);

                    // console.log(selector)
                    // console.log(item_selector)

                    res.render('selecting_menu', {
                        cate: cate,
                        menu: data_menu,
                        slt: selector,
                        itslt: item_selector,
                        activeCateId: 1
                    })
                })
            })
        })
    });
});






// ส่วนที่เพิ่มเข้า ตะหร้าสินค้า
// app.post("/add-to-cart", (req, res) => {
//   const { menu_id, quantity, options, unitPrice, totalPrice } = req.body;
//   // console.log('menu_image',menu_image)
//   console.log('menu_id',typeof menu_id,menu_id);
//   console.log('quantity',typeof quantity,quantity);
//   // มันน่าจะเพราะว่า มันส่งเข้ามาเป็น object
//   // ไม่สามารถเเสดงได้เพราะว่า มัน่ส่งมาเป็น object ไม่เหมือน unitprice ที่เราสร้างขึ้นมา มันจะ undefined
//   console.log('options',typeof options);
//   // console.log(option); //ReferenceError: option is not defined

//   // ไม่มีเเต่ใส่เข้ามา 
//   console.log('unitPrice',typeof unitPrice,unitPrice); // unitPrice undefined undefined

//   // total price รวมราคากับ option ที่เลือกเพิ่มเข้ามาเล้ว
//   console.log('totalPrice',typeof totalPrice,totalPrice);

//   if (!req.session.cart) req.session.cart = [];

//     // options ที่ได้มามันเป็น obj เราต้องเเปลงเป็น string ก่อน เลยสร้างตัวเเปรมาใหม่เพื่อเอามาเทียบ
//   const optionsStr = JSON.stringify(options);
//   console.log('optionsStr',optionsStr,typeof optionsStr)

//   const existingItem = req.session.cart.find(
//                                 //  ตรงงนี้คือเเปลงกลับมาเพื่อเทียบ ว่ามันเท่ากับตัวเก่าไหม
//     i => i.menu_id === menu_id && JSON.stringify(i.options) === optionsStr
//   );

//   // ทำให้มั่นใจว่า quantity มันเป็น ตัวเลขจริงๆ
//   const qty = Number(quantity);
//   // const uPrice = unitPrice !== undefined 
//   //   ? Number(unitPrice) 
//   //   : (totalPrice ? Number(totalPrice) / qty : 0);
//   const uPrice = unitPrice !== undefined 
//     ? Number(unitPrice) 
//     : (totalPrice ? Number(totalPrice) / qty : 0);

//   // ถ้าเจอตัวเก่า ให้เพิ่มจำนวนเเทน เเล้วก็เพิ่ม totalPrice 
//   if (existingItem) {
//     existingItem.quantity += qty;
//     existingItem.totalPrice_forMenu = existingItem.unitPrice * existingItem.quantity;
//     req.session.total = req.session.cart.reduce(
//       (sum, item) => sum + (item.totalPrice_forMenu || 0),
//       0
//     );

//     const cartCount = req.session.cart.reduce((sum, i) => sum + i.quantity, 0);

//     return res.json({
//       success: true,
//       cart: req.session.cart,
//       cartCount,
//       total: req.session.total,
//       message: "เพิ่มลงตะกร้าเรียบร้อย!"
//     });
//   } else {
//     const menu = `SELECT menu_id, menu_name, menu_image FROM Menu WHERE menu_id = ?`;
//     db.get(menu, [menu_id], (err, menu_detail) => {
//       if (err) {
//         console.error(err.message);
//         return res.status(500).json({ success: false, message: "DB error" });
//       }
//       if (menu_detail) {
//         req.session.cart.push({
//           menu_name: menu_detail.menu_name,
//           menu_image: menu_detail.menu_image,
//           menu_id,
//           options,
//           quantity: qty,
//           unitPrice: uPrice,
//           totalPrice_forMenu: uPrice * qty
//         });
//         req.session.total = req.session.cart.reduce(
//           (sum, item) => sum + (item.totalPrice_forMenu || 0),
//           0
//         );

//         const cartCount = req.session.cart.reduce((sum, i) => sum + i.quantity, 0);

//         return res.json({
//           success: true,
//           cart: req.session.cart,
//           cartCount,
//           total: req.session.total,
//           message: "เพิ่มลงตะกร้าเรียบร้อย!"
//         });
//       } else {
//         return res.status(404).json({ success: false, message: "ไม่พบเมนู" });
//       }
//     });
//   }

//   // console.log('This is session cart2',req.session.cart)

//   // req.session.total = req.session.cart.reduce(
//   //   (sum, item) => sum + (item.totalPrice_forMenu || 0),
//   //   0
//   // );
//   // console.log('This is session total',req.session.total)

//   const cartCount = req.session.cart.reduce((sum, i) => sum + i.quantity, 0);


//   // ส่งกลับไปที่ json
//   res.json({
//     success: true,
//     cart: req.session.cart,
//     cartCount,
//     total: req.session.total,
//     message: "เพิ่มลงตะกร้าเรียบร้อย!"
//   });

//   // res.redirect(`/category`);


//   // console.log(req.session.cart)
//   // console.log('This is session total',req.session.total)

// });


// app.post("/add-to-cart", (req, res) => {
//   const { menu_id, quantity, options, unitPrice, totalPrice } = req.body;

//   if (!req.session.cart) req.session.cart = [];

//   const optionsStr = JSON.stringify(options);
//   const existingItem = req.session.cart.find(
//     i => i.menu_id === menu_id && JSON.stringify(i.options) === optionsStr
//   );

//   const qty = Number(quantity);
//   const uPrice = unitPrice !== undefined 
//     ? Number(unitPrice) 
//     : (totalPrice ? Number(totalPrice) / qty : 0);

//   if (existingItem) {
//     // อัปเดตสินค้าเดิม
//     existingItem.quantity += qty;
//     existingItem.totalPrice_forMenu = existingItem.unitPrice * existingItem.quantity;

//     const cartCount = recalcCart(req.session);

//     return res.json({   // ✅ ใช้ return ป้องกัน flow ไหลไปต่อ
//       success: true,
//       cart: req.session.cart,
//       cartCount,
//       total: req.session.total,
//       message: "เพิ่มลงตะกร้าเรียบร้อย!"
//     });
//   }

//   // ถ้าเป็นสินค้าใหม่
//   const menu = `SELECT menu_id, menu_name, menu_image FROM Menu WHERE menu_id = ?`;
//   db.get(menu, [menu_id], (err, menu_detail) => {
//     if (err) {
//       console.error(err.message);
//       return res.status(500).json({ success: false, message: "DB error" });
//     }
//     if (!menu_detail) {
//       return res.status(404).json({ success: false, message: "ไม่พบเมนู" });
//     }

//     req.session.cart.push({
//       menu_name: menu_detail.menu_name,
//       menu_image: menu_detail.menu_image,
//       menu_id,
//       options,
//       quantity: qty,
//       unitPrice: uPrice,
//       totalPrice_forMenu: uPrice * qty
//     });

//     const cartCount = recalcCart(req.session);

//     console.log("✅ session cart:", req.session.cart);
//   console.log("✅ session total:", req.session.total);


//     return res.json({   // ✅ ตอบกลับที่นี่อย่างเดียว
//       success: true,
//       cart: req.session.cart,
//       cartCount,
//       total: req.session.total,
//       message: "เพิ่มลงตะกร้าเรียบร้อย!"
//     });
//   });
//   // console.log('This is session cart',req.session.cart)
//   // console.log('This is session total',req.session.total)
// });


// ================== Helper Function ==================
function recalcCart(session) {
    session.total = session.cart.reduce(
        (sum, item) => sum + (item.totalPrice_forMenu || 0),
        0
    );
    return session.cart.reduce((sum, item) => sum + item.quantity, 0);
}

// add-to-cart
app.post("/add-to-cart", (req, res) => {
    const { menu_id, quantity, options, unitPrice, totalPrice } = req.body;
    const qty = Number(quantity) || 1;
    const uPrice = unitPrice !== undefined ?
        Number(unitPrice) :
        totalPrice ? Number(totalPrice) / qty : 0;

    if (!req.session.cart) req.session.cart = [];

    const optionsStr = JSON.stringify(options);

    // หา existing item
    const existingItem = req.session.cart.find(
        item => item.menu_id === menu_id && JSON.stringify(item.options) === optionsStr
    );

    if (existingItem) {
        // อัปเดตสินค้าเดิม
        existingItem.quantity += qty;

        // คำนวณ unitPrice ถ้ายังไม่มี
        if (!existingItem.unitPrice || existingItem.unitPrice === 0) {
            existingItem.unitPrice = uPrice;
        }

        existingItem.totalPrice_forMenu = existingItem.unitPrice * existingItem.quantity;

        const cartCount = recalcCart(req.session);
        console.log("✅ session cart:", req.session.cart);
        console.log("✅ session total:", req.session.total);

        return res.json({
            success: true,
            cart: req.session.cart,
            cartCount,
            total: req.session.total,
            message: "เพิ่มลงตะกร้าเรียบร้อย!"
        });
    }

    // เพิ่มสินค้าใหม่จาก DB
    const sql = "SELECT menu_id, menu_name, menu_image FROM Menu WHERE menu_id = ?";
    db.get(sql, [menu_id], (err, menu_detail) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "DB error" });
        }
        if (!menu_detail) {
            return res.status(404).json({ success: false, message: "ไม่พบเมนู" });
        }

        req.session.cart.push({
            menu_id,
            menu_name: menu_detail.menu_name,
            menu_image: menu_detail.menu_image,
            options,
            quantity: qty,
            unitPrice: uPrice,
            totalPrice_forMenu: uPrice * qty
        });

        const cartCount = recalcCart(req.session);

        console.log("✅ session cart:", req.session.cart);
        console.log("✅ session total:", req.session.total);


        return res.json({
            success: true,
            cart: req.session.cart,
            cartCount,
            total: req.session.total,
            message: "เพิ่มลงตะกร้าเรียบร้อย!"
        });
    });
});

app.get('/cart', (req, res) => {
    const cart = req.session.cart || [];
    const total = req.session.total || 0;

    res.render('cart', { cart, total });
});



// app.post("/update-cart", (req, res) => {
//     const { menu_id, options, quantity } = req.body;
//     const qty = Number(quantity);

//     if (!req.session.cart) req.session.cart = [];

//     const optionsStr = JSON.stringify(options);
//     const existingItem = req.session.cart.find(
//         item => item.menu_id === menu_id && JSON.stringify(item.options) === optionsStr
//     );

//     if (existingItem) {
//         existingItem.quantity = qty;
//         existingItem.totalPrice_forMenu = existingItem.unitPrice * existingItem.quantity;
//     }

//     // คำนวณ total
//     req.session.total = req.session.cart.reduce((sum, item) => sum + item.totalPrice_forMenu, 0);

//     res.json({ success: true, cart: req.session.cart, total: req.session.total });
//     console.log("✅ session cart for updating cart:", req.session.cart);
//     console.log("✅ session total for updating cart:", req.session.total);


// });
app.post("/update-cart", (req, res) => {
    const { menu_id, options, quantity } = req.body;
    const qty = Number(quantity);

    if (!req.session.cart) req.session.cart = [];

    const optionsStr = JSON.stringify(options);
    const existingItemIndex = req.session.cart.findIndex(
        item => item.menu_id === menu_id && JSON.stringify(item.options) === optionsStr
    );

    if (existingItemIndex !== -1) {
        if (qty > 0) {
            req.session.cart[existingItemIndex].quantity = qty;
            req.session.cart[existingItemIndex].totalPrice_forMenu = req.session.cart[existingItemIndex].unitPrice * qty;
        } else {
            // ลบ item เมื่อ quantity = 0
            req.session.cart.splice(existingItemIndex, 1);
        }
    }

    // คำนวณ total
    req.session.total = req.session.cart.reduce((sum, item) => sum + item.totalPrice_forMenu, 0);

    res.json({ success: true, cart: req.session.cart, total: req.session.total });
    console.log("✅ session cart for updating cart:", req.session.cart);
    console.log("✅ session total for updating cart:", req.session.total);
});

// หน้าเลือกประเภทการรับบริการ
app.get('/order-type', (req, res) => {
    res.render('order_type'); // สร้างไฟล์ views/order_type.ejs
});

// บันทึกประเภท order ลง session
app.post('/order-type', (req, res) => {
    const { orderType } = req.body; // dine-in / takeaway / delivery
    req.session.orderType = orderType;
    res.json({ success: true });
});

// app.get('/checkout', (req, res) => {
//     const cart = req.session.cart || [];
//     const total = req.session.total || 0;
//     const orderType = req.session.orderType || "none";
//     res.render('checkout', { cart, total, orderType });
// });

// app.get('/checkout', (req, res) => {
//     // ดึงข้อมูลจาก session
//     const cart = req.session.cart || [];
//     const total = req.session.total || 0;
//     const orderType = req.session.orderType || "none";

//     // ส่งข้อมูลไป render หน้า checkout.ejs
//     res.render('checkout', { cart, total, orderType });
// });
// ในไฟล์ index.js (ส่วนของ Server)



// หน้าเลือกการชำระเงิน
app.get('/payment', (req, res) => {
    const total = req.session.total || 0;
    res.render('payment', { total });
});

// POST ชำระเงินเงินสด
app.post('/payment/cash', (req, res) => {
    const { cashReceived } = req.body;
    const total = req.session.total || 0;
    const change = Number(cashReceived) - total;

    if (change < 0) {
        return res.json({ success: false, message: 'เงินไม่พอ' });
    }

    req.session.payment = { method: 'cash', cashReceived, change };
    res.json({ success: true, change });
});

// POST ชำระเงิน QR Code
app.post('/payment/qr', (req, res) => {
    const total = req.session.total || 0;

    const QRCode = require('qrcode');

    QRCode.toDataURL(total.toString(), (err, url) => {
        if (err) return res.status(500).json({ success: false, message: 'QR code error' });

        req.session.payment = { method: 'qr', qrData: url };
        res.json({ success: true, qrData: url, amount: total });
    });
});

app.get('/qr-payment', (req, res) => {
    const total = req.session.total || 0;
    const payment = req.session.payment || {};
    const qrData = payment.qrData || null;

    // สร้าง timestamp
    const expiryTime = new Date(Date.now() + 2 * 60000);
    const expiryTimeStr = expiryTime.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    res.render('qr-payment', {
        total: total,
        qrData: qrData,
        expiryTime: expiryTimeStr
    });
});

// Route สำหรับหน้าชำระเงินสำเร็จ
app.get('/payment-success', (req, res) => {
    const total = req.session.total || 0;
    const payment = req.session.payment || {};

    // เก็บค่าไว้ก่อนล้าง
    const displayTotal = total;
    const displayPayment = {...payment };

    // ล้างตะกร้าเมื่อจ่ายเสร็จ
    req.session.cart = [];
    req.session.total = 0;
    req.session.payment = {};

    res.render('payment-success', {
        total: displayTotal,
        payment: displayPayment
    });
});

// GETหน้า Inventory
// ======================= INVENTORY PAGE =======================
app.get('/inventory', (req, res) => {
    db.all("SELECT * FROM menu", [], (err, rows) => {
        if (err) return res.send(err.message);

        // แยกเครื่องดื่มกับเบเกอรี่
        const drinks = rows
            .filter(r => r.category === 'เครื่องดื่ม')
            .map(r => ({
                ...r,
                is_active: !!r.is_active // แปลงเป็น true/false
            }));

        const bakery = rows
            .filter(r => r.category === 'เบเกอรี่')
            .map(r => ({
                ...r,
                is_active: !!r.is_active
            }));

        res.render('inventory', { drinks, bakery });
    });
});

app.post('/inventory/toggle/:id', (req, res) => {
    const menu_id = req.params.id;
    const { is_active } = req.body; // boolean

    const sql = `UPDATE Menu SET is_active = ? WHERE menu_id = ?`;

    db.run(sql, [is_active ? 1 : 0, menu_id], function(err) {
        if (err) {
            console.error(err);
            return res.json({ success: false });
        }
        res.json({ success: true });
    });
});




// POST - บันทึกการอัพเดทสต็อก
app.post('/inventory/save', (req, res) => {
    const { products } = req.body;

    if (!products || Object.keys(products).length === 0) {
        return res.json({
            success: false,
            message: 'ไม่มีข้อมูลที่จะบันทึก'
        });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        let hasError = false;
        let completed = 0;
        const totalUpdates = Object.keys(products).length;

        Object.keys(products).forEach(ingredientId => {
            const product = products[ingredientId];

            // อัพเดทสต็อก (เพิ่มจำนวน)
            const updateQuery = `
                UPDATE Ingredient 
                SET stock_qty = stock_qty + ?
                WHERE ingredient_id = ? AND is_active = 1
            `;

            db.run(updateQuery, [product.quantity, ingredientId], function(err) {
                completed++;

                if (err) {
                    console.error('Update error:', err);
                    hasError = true;
                }

                // เมื่ออัพเดทครบทุกรายการ
                if (completed === totalUpdates) {
                    if (hasError) {
                        db.run('ROLLBACK');
                        res.json({
                            success: false,
                            message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
                        });
                    } else {
                        db.run('COMMIT');
                        console.log('✅ Inventory updated successfully');
                        res.json({
                            success: true,
                            message: 'บันทึกข้อมูลสำเร็จ'
                        });
                    }
                }
            });
        });
    });
});

// GET - ค้นหาวัตถุดิบ
app.get('/inventory/search/:keyword', (req, res) => {
    const keyword = req.params.keyword;

    const query = `
        SELECT 
            ingredient_id,
            ingredient_name,
            stock_qty,
            unit,
            is_active
        FROM Ingredient
        WHERE ingredient_name LIKE ? AND is_active = 1
        ORDER BY ingredient_name ASC
    `;

    db.all(query, [`%${keyword}%`], (err, ingredients) => {
        if (err) {
            return res.json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการค้นหา'
            });
        }

        res.json({
            success: true,
            data: ingredients
        });
    });
});



//listen
app.listen(port, (req, res) => {
    console.log(`Starting on port ${port}`)
})