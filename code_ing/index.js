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


const qrcode = require('qrcode');
const generatePayload = require('promptpay-qr'); // ใช้จาก promptpay-qr

// เอาไว้เปลี่ยน path
// const dbPath = path.join(__dirname, 'Database', 'CHINNAKORN_blueprint.db');
const dbPath = path.join(__dirname, 'Database', 'CHINNAKORN_cafe_TH.db');
let db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error('❌ Database connection error:', err.message);
    }
    console.log('✅ Connected to SQLite database at', dbPath);
});

// static resourse & templating engine
app.use(express.static('public'));
// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// rounting
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

                db.all(item_selector_sql, (err,item_selector) =>{
                    if (err) return console.log(err.message);
                    
                    // console.log('Selector : ',selector)
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
            res.redirect(`/where`);
            // console.log('/ WORK!!!!')

        } else {
          // ดักว่าไม่มีหมวดหมู่ เพื่อไม่ให้เกิด error
            res.send("No categories found");
            // console.log('/ WORK!!!!')

        }
    });
});
app.get('/main_cas/:where' , (req,res) =>{
  req.session.where = req.params.where;
  console.log(req.session.where)
  res.redirect(`/main_for_cashier`);
})
app.get('/cashier', (req, res) => {
  const cart = req.session.cart || [];
  const total = req.session.total || 0;

  // ดึงข้อมูล category / menu / options เหมือน route /category
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
  og.option_group_id,
  it.option_id,
  it.option_name,
  it.extra_price,
  ioi.ingredient_id -- เพิ่ม ingredient_id
FROM OptionGroup og
INNER JOIN ItemOption it
  ON og.option_group_id = it.option_group_id
LEFT JOIN ItemOptionIngredient ioi
  ON it.option_id = ioi.option_id;`;

  const check_if_there_available = `
  SELECT 
    m.menu_id,
    m.ingredient_id,
    m.quantity,
    i.stock_qty
  FROM MenuIngredient m
  INNER JOIN Ingredient i
    ON m.ingredient_id = i.ingredient_id`;

  const check_if_there_option_available = `  SELECT 
    mo.menu_id,
    ioi.ingredient_id,
    ioi.quantity,
    i.stock_qty
  
  FROM Menu_OptionGroup mo
  NATURAL JOIN ItemOption io

  NATURAL JOIN ItemOptionIngredient ioi

  NATURAL JOIN Ingredient i
    
  WHERE mo.option_group_id BETWEEN 3 and 5
`;
  
  
  



  db.all(cate_select_sql, (err, cate) => {
    if (err) return console.log(err.message);

    db.all(menu_select_sql, (err, data_menu) => {
      if (err) return console.log(err.message);

      db.all(option_selector_sql, (err, selector) => {
        if (err) return console.log(err.message);

        db.all(item_selector_sql, (err, item_selector) => {
          if (err) return console.log(err.message);
            db.all(check_if_there_available , (err,check_qty) =>{
              if (err) return console.log(err.message);
              const menuAvailability = {};
              check_qty.forEach(row => {
                const { menu_id, quantity, stock_qty } = row;
                if (!menuAvailability[menu_id]) menuAvailability[menu_id] = true; // เริ่มต้นให้พร้อมขาย
                if (stock_qty < quantity) {
                  menuAvailability[menu_id] = false; // ถ้ามีอันใดไม่พอ → เมนูนี้หมด
                }
              });

              // ผนวก is_available ลงในแต่ละเมนู
              const data_menu_with_avail = data_menu.map(m => ({
                ...m,
                is_available: menuAvailability[m.menu_id] !== false // ถ้าไม่เจอใน false ถือว่ามีพอ
              }));

              // console.log("เมนูที่ขายได้/ไม่ได้:", data_menu_with_avail);

            
              // บอกว่าเเต่ละ menu ต้องการอะไรบ้าง 
              //  { menu_id: 1, ingredient_id: 1, quantity: 5, stock_qty: 100 },
            // console.log('check_qty เชคควยๆๆๆ : ' , check_qty);
            db.all(check_if_there_option_available, (err, check_option) => {
              if (err) return console.log(err.message);
              // console.log("check_option:", check_option);

              // console.log(check_option)

              // ความพร้อมของแต่ละ option group
                const optionAvailability = {}; 
                  check_option.forEach(row => {
                    const { menu_id, ingredient_id, quantity, stock_qty } = row;
                    const key = `${menu_id}_${ingredient_id}`;

                    // เริ่มต้นเป็น true ถ้ายังไม่มี key
                    if (!(key in optionAvailability)) optionAvailability[key] = true;

                    // ถ้า stock ไม่พอ -> false
                    if (stock_qty < quantity) optionAvailability[key] = false;
                  });
                // console.log(check_option); // หัวควย กว่าจะได้

                // console.log(optionAvailability); // เลิกเเล้วเขียนโค้ด ไปเลี้ยงควานดีกว่า
          res.render('main_for_cashier_before', {
            cart,
            total,
            cate,
            // menu: data_menu,
            menu: data_menu_with_avail,
            slt: selector,
            itslt: item_selector,
            optionAvailability,
            activeCateId: 1
          });
          });
        });
        });
      });
    });
  });
});
app.get('/main_for_cashier', (req, res) => {
  const cart = req.session.cart || [];
  const total = req.session.total || 0;
  // console.log('asd')

  // ดึงข้อมูล category / menu / options เหมือน route /category
  const cate_select_sql = `SELECT * FROM Category`;
  const menu_select_sql = `SELECT * FROM Menu;`;
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
  og.option_group_id,
  it.option_id,
  it.option_name,
  it.extra_price,
  ioi.ingredient_id -- เพิ่ม ingredient_id
FROM OptionGroup og
INNER JOIN ItemOption it
  ON og.option_group_id = it.option_group_id
LEFT JOIN ItemOptionIngredient ioi
  ON it.option_id = ioi.option_id;`;

  const check_if_there_available = `
  SELECT 
    m.menu_id,
    me.is_available,
    m.ingredient_id,
    m.quantity,
    i.stock_qty
  FROM MenuIngredient m
  INNER JOIN Ingredient i
    ON m.ingredient_id = i.ingredient_id
  INNER JOIN Menu me
    ON me.menu_id = m.menu_id;
`;

  const check_if_there_option_available = `  SELECT 
    mo.menu_id,
    ioi.ingredient_id,
    ioi.quantity,
    i.stock_qty
  
  FROM Menu_OptionGroup mo
  NATURAL JOIN ItemOption io

  NATURAL JOIN ItemOptionIngredient ioi

  NATURAL JOIN Ingredient i
    
  WHERE mo.option_group_id BETWEEN 3 and 5
`;
  


  db.all(cate_select_sql, (err, cate) => {
    if (err) return console.log(err.message);

    db.all(menu_select_sql, (err, data_menu) => {
      if (err) return console.log(err.message);

      db.all(option_selector_sql, (err, selector) => {
        if (err) return console.log(err.message);

        db.all(item_selector_sql, (err, item_selector) => {
          if (err) return console.log(err.message);

           // บอกว่ามีหมวดหมู่อะไรบ้าง
          // console.log('cate : ',cate)
          // บอกว่ามีอะไรบ้าง
          // console.log('data_menu : ',data_menu)
          // บอกว่าเมนูนี้ต้องการอะไรบ้าง เเล้วก็บบังคับใส่ไหม
          // console.log('Selector : ',selector)
          // บอกว่าแต่ละ option ,มีอะไรบ้าง เเล้วก็มีจ่ายเงินไหม
          // console.log('item_selector : ',item_selector)
            db.all(check_if_there_available , (err,check_qty) =>{
              if (err) return console.log(err.message);
              const menuAvailability = {};

              console.log(check_qty)


              check_qty.forEach(row => {
                const { menu_id, quantity, stock_qty,is_available } = row;
                if (!menuAvailability[menu_id]) menuAvailability[menu_id] = true; // เริ่มต้นให้พร้อมขาย
                if (stock_qty < quantity) {
                  menuAvailability[menu_id] = false; // ถ้ามีอันใดไม่พอ → เมนูนี้หมด
                }
                if (is_available == 0){
                  menuAvailability[menu_id] = false;
                }
              });

              // ผนวก is_available ลงในแต่ละเมนู
              const data_menu_with_avail = data_menu.map(m => ({
                ...m,
                is_available: menuAvailability[m.menu_id] !== false // ถ้าไม่เจอใน false ถือว่ามีพอ
              }));

              // console.log("เมนูที่ขายได้/ไม่ได้:", data_menu_with_avail);

            
              // บอกว่าเเต่ละ menu ต้องการอะไรบ้าง 
              //  { menu_id: 1, ingredient_id: 1, quantity: 5, stock_qty: 100 },
            // console.log('check_qty : ' , check_qty);
            db.all(check_if_there_option_available, (err, check_option) => {
              if (err) return console.log(err.message);
              // console.log("check_option:", check_option);

              // console.log(check_option)

              // ตรวจวัดความพร้อมของแต่ละ option group
                const optionAvailability = {}; 
                  check_option.forEach(row => {
                    const { menu_id, ingredient_id, quantity, stock_qty } = row;
                    const key = `${menu_id}_${ingredient_id}`;

                    // เริ่มต้นเป็น true ถ้ายังไม่มี key
                    if (!(key in optionAvailability)) optionAvailability[key] = true;

                    // ถ้า stock ไม่พอ → false
                    if (stock_qty < quantity) optionAvailability[key] = false;
                  });
                // console.log(check_option); // ตรวจสอบ

                // console.log(optionAvailability); // ตรวจสอบ
          res.render('main_for_cashier', {
            cart,
            total,
            cate,
            // menu: data_menu,
            menu: data_menu_with_avail,
            slt: selector,
            itslt: item_selector,
            optionAvailability,
            activeCateId: 1
          });
            
          // console.log(data_menu_with_avail)



          });
        });
        });
      });
    });
  });
});
app.get('/confirm_order', (req, res) => {
  // ถ้าไม่มี cart ให้กลับไปหน้าแรก
  if (!req.session.cart || req.session.cart.length === 0) {
    return res.redirect('/main_for_cashier');
  }
  const promotion_sql = `SELECT * FROM Promotion`;
  db.all(promotion_sql, (err,promotion) =>{
    if (err) return console.log(err.message);
    // console.log(promotion)

    // ส่งข้อมูลไป render
  res.render('confirm_order', {
    cart: req.session.cart,
    total:  req.session.total,
    pro: promotion
  });

  })
});
app.get("/cash/:amount", async (req, res) => {
  try {
    const cart = req.session.cart || [];
    const total = req.session.total || 0;
    const amount = parseInt(req.params.amount, 10);
    const left = amount - total;

    console.log("🛒 เริ่มบันทึกคำสั่งซื้อ, ตะกร้าปัจจุบัน:", JSON.stringify(cart, null, 2));

    if (cart.length === 0) {
      return res.status(400).send("ไม่มีสินค้าในตะกร้า");
    }

    // 🕒 สร้าง prefix วันที่ เช่น 20251006
    const now = new Date();
    const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, "");

    // หาคำสั่งซื้อสุดท้ายของวันเดียวกัน
    db.get(
  `SELECT order_id FROM "Order"
   WHERE order_id LIKE ?
   ORDER BY order_id DESC LIMIT 1`,
  [`${datePrefix}-%`],
  (err, row) => {
    if (err) {
      console.error("❌ Query last order error:", err);
      return res.status(500).send("เกิดข้อผิดพลาดในการอ่านเลขคำสั่งซื้อ");
    }

    let nextNumber = 1;
    if (row && row.order_id) {
      const lastNum = parseInt(row.order_id.split("-")[1], 10);
      nextNumber = lastNum + 1;
    }

    const orderId = `${datePrefix}-${String(nextNumber).padStart(3, "0")}`;
    console.log("🆕 สร้าง orderId:", orderId);

    db.run(
      `INSERT INTO "Order" (order_id, total_price, order_type)
       VALUES (?, ?, 'TAKEAWAY')`,
      [orderId, total],
      function (err) {
        if (err) {
          console.error("❌ Insert order error:", err);
          return res.status(500).send("บันทึกคำสั่งซื้อไม่สำเร็จ");
        }

            // --- บันทึกเมนูแต่ละรายการในตะกร้า ---
            cart.forEach((item) => {
              db.run(
                `INSERT INTO "OrderItem" (order_id, menu_id, quantity, price)
                 VALUES (?, ?, ?, ?)`,
                [orderId, item.menu_id, item.quantity, item.unitPrice],
                function (err2) {
                  if (err2) {
                    console.error("❌ Insert order item error:", err2);
                    return;
                  }

                  const orderItemId = this.lastID;
                  console.log(`📦 เพิ่มเมนู ${item.menu_name} (order_item_id=${orderItemId})`);

                  // --- ถ้ามี options ---
                  if (item.options && item.options.length > 0) {
                    console.log(`🧩 เมนู ${item.menu_name} มี options:`, item.options);

                    item.options.forEach((opt) => {
                      db.get(
                        `SELECT option_id, extra_price FROM ItemOption WHERE option_name = ?`,
                        [opt.name],
                        (err3, row2) => {
                          if (err3) {
                            console.error("❌ Error finding option:", err3.message);
                            return;
                          }

                          if (row2) {
                            const finalExtra = opt.extra || row2.extra_price || 0;
                            db.run(
                              `INSERT INTO "OrderItemOption" (order_item_id, option_id, extra_price)
                               VALUES (?, ?, ?)`,
                              [orderItemId, row2.option_id, finalExtra],
                              (err4) => {
                                if (err4) {
                                  console.error("❌ Insert option error:", err4.message);
                                } else {
                                  console.log(
                                    `✅ เพิ่ม option '${opt.name}' (option_id=${row2.option_id}) extra=${finalExtra}`
                                  );
                                }
                              }
                            );
                          } else {
                            console.warn("⚠️ ไม่พบ option ในฐานข้อมูล:", opt.name);
                          }
                        }
                      );
                    });
                  }
                }
              );
            });

            // --- เคลียร์ session หลังบันทึกเสร็จ ---
            req.session.cart = [];
            req.session.total = 0;

            // --- แสดงหน้า payment_success ---
            res.render("payment_success", {
              total,
              left,
              orderId,
            });

            console.log("✅ บันทึกคำสั่งซื้อสำเร็จ:", orderId);
          }
        );
      }
    );
  } catch (err) {
    console.error("❌ Error inserting order:", err);
    res.status(500).send("เกิดข้อผิดพลาดระหว่างบันทึกข้อมูลคำสั่งซื้อ");
  }
});
app.get('/pay_qr', async (req, res) => {
  // const amount = 100000000000000000000;
// const amount = req.session.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const amount = req.session.total;
  const promptPayID = '0984242409'; // ใส่เบอร์พร้อมเพย์

  // ถ้าไม่มี amount ให้ default เป็น 1 บาท
  const finalAmount = amount ? parseFloat(amount) : 1;

  const payload = generatePayload(promptPayID, { amount: finalAmount });
  const qrDataUrl = await qrcode.toDataURL(payload);
  // console.log(cart)

  // res.send(`
  //   <h1>สแกนเพื่อชำระเงิน</h1>
  //   <p>จำนวนเงิน: ${finalAmount} บาท</p>
  //   <img src="${qrDataUrl}" alt="QR Code" />
  // `);
  res.render('pay_qr',{amount: finalAmount, qr :qrDataUrl})

//   const cart = req.session.cart || [];

// // console.log(cart)
//   res.send(cart)
});


// ================== Helper Function ==================
function recalcCart(session) {
  session.total = session.cart.reduce(
    (sum, item) => sum + (item.totalPrice_forMenu || 0),
    0
  );
  return session.cart.reduce((sum, item) => sum + item.quantity, 0);
}
app.post("/add-to-cart", (req, res) => {
  const { menu_id, quantity, options, unitPrice, totalPrice } = req.body;
  const qty = Number(quantity) || 1;
  const uPrice = unitPrice !== undefined
    ? Number(unitPrice)
    : totalPrice ? Number(totalPrice) / qty : 0;

  if (!req.session.cart) req.session.cart = [];

  const optionsStr = JSON.stringify(options);

  // หา existing item
  const existingItem = req.session.cart.find(
    item => item.menu_id === menu_id && JSON.stringify(item.options) === optionsStr
  );

  if (existingItem) {
    existingItem.quantity += qty;
    if (!existingItem.unitPrice || existingItem.unitPrice === 0) {
      existingItem.unitPrice = uPrice;
    }
    existingItem.totalPrice_forMenu = existingItem.unitPrice * existingItem.quantity;

    const cartCount = recalcCart(req.session);
    console.log("✅ session cart:", req.session.cart);
    console.log("✅ session total:", req.session.total);

    // render cart partial ส่ง HTML กลับ client
    return res.render("cart", { cart: req.session.cart, total: req.session.total }, (err, html) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, cartHtml: html, cartCount, total: req.session.total, message: "อัปเดตสินค้าเรียบร้อย!" });
    });
  }

  // เพิ่มสินค้าใหม่จาก DB
  const sql = "SELECT menu_id, menu_name, menu_image FROM Menu WHERE menu_id = ?";
  db.get(sql, [menu_id], (err, menu_detail) => {
    if (err) return res.status(500).json({ success: false, message: "DB error" });
    if (!menu_detail) return res.status(404).json({ success: false, message: "ไม่พบเมนู" });

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

    // render cart partial ส่ง HTML กลับ client
    return res.render("cart", { cart: req.session.cart, total: req.session.total }, (err, html) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, cartHtml: html, cartCount, total: req.session.total, message: "เพิ่มลงตะกร้าเรียบร้อย!" });
    });
  });
});
app.post("/update-cart", (req, res) => {
    const { menu_id, options, quantity } = req.body;
    const qty = Number(quantity);

    if (!req.session.cart) req.session.cart = [];

    const optionsStr = JSON.stringify(options);

    console.log(optionsStr)
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
app.get('/cart' , (req,res) =>{
  // res.send('Is this all you need : ',req.session.cart)
  // res.send('Total Price : ',req.session.total)
  // console.log('Is this all you need : ',req.session.cart)
  // console.log('Total Price : ',req.session.total)
  // res.send('You are on the cart views')
  // res.render('cart' ,{data :req.session.cart})
  const cart = req.session.cart || [];
  const total = req.session.total || 0;
  res.render("cart", { cart, total });

  // console.log('This is Cart menu',cart)
});

app.get('/canceled_order', (req, res) => {
    req.session.cart = [];
    req.session.total = 0;
    res.redirect(`/main_for_cashier`);
});
app.post('/update-total', (req, res) => {
  const { promotion_id, discountedTotal, discountValue } = req.body;
  req.session.total = discountedTotal;
  req.session.promotion_id = promotion_id;
  req.session.discount = discountValue;
  res.json({ success: true });
});


// ================== customer ==================

app.get('/where' ,(req,res) =>{
  res.render('where_to_eat');
})
app.get('/main_for_customer', (req, res) => {
  const cart = req.session.cart || [];
  const total = req.session.total || 0;

  // ดึงข้อมูล category / menu / options เหมือน route /category
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
  og.option_group_id,
  it.option_id,
  it.option_name,
  it.extra_price,
  ioi.ingredient_id -- เพิ่ม ingredient_id
FROM OptionGroup og
INNER JOIN ItemOption it
  ON og.option_group_id = it.option_group_id
LEFT JOIN ItemOptionIngredient ioi
  ON it.option_id = ioi.option_id;`;

  const check_if_there_available = `
  SELECT 
    m.menu_id,
    m.ingredient_id,
    m.quantity,
    i.stock_qty
  FROM MenuIngredient m
  INNER JOIN Ingredient i
    ON m.ingredient_id = i.ingredient_id`;

  const check_if_there_option_available = `  SELECT 
    mo.menu_id,
    ioi.ingredient_id,
    ioi.quantity,
    i.stock_qty
  
  FROM Menu_OptionGroup mo
  NATURAL JOIN ItemOption io

  NATURAL JOIN ItemOptionIngredient ioi

  NATURAL JOIN Ingredient i
    
  WHERE mo.option_group_id BETWEEN 3 and 5
`;
  
  
  



  db.all(cate_select_sql, (err, cate) => {
    if (err) return console.log(err.message);

    db.all(menu_select_sql, (err, data_menu) => {
      if (err) return console.log(err.message);

      db.all(option_selector_sql, (err, selector) => {
        if (err) return console.log(err.message);

        db.all(item_selector_sql, (err, item_selector) => {
          if (err) return console.log(err.message);

           // บอกว่ามีหมวดหมู่อะไรบ้าง
          // console.log('cate : ',cate)
          // บอกว่ามีอะไรบ้าง
          // console.log('data_menu : ',data_menu)
          // บอกว่าเมนูนี้ต้องการอะไรบ้าง เเล้วก็บบังคับใส่ไหม
          // console.log('Selector : ',selector)
          // บอกว่าแต่ละ option ,มีอะไรบ้าง เเล้วก็มีจ่ายเงินไหม
          // console.log('item_selector : ',item_selector)
            db.all(check_if_there_available , (err,check_qty) =>{
              if (err) return console.log(err.message);
              const menuAvailability = {};

              // console.log(check_qty)


              check_qty.forEach(row => {
                const { menu_id, quantity, stock_qty } = row;
                if (!menuAvailability[menu_id]) menuAvailability[menu_id] = true; // เริ่มต้นให้พร้อมขาย
                if (stock_qty < quantity) {
                  menuAvailability[menu_id] = false; // ถ้ามีอันใดไม่พอ → เมนูนี้หมด
                }
              });

              // ผนวก is_available ลงในแต่ละเมนู
              const data_menu_with_avail = data_menu.map(m => ({
                ...m,
                is_available: menuAvailability[m.menu_id] !== false // ถ้าไม่เจอใน false ถือว่ามีพอ
              }));

              // console.log("เมนูที่ขายได้/ไม่ได้:", data_menu_with_avail);

            
              // บอกว่าเเต่ละ menu ต้องการอะไรบ้าง 
              //  { menu_id: 1, ingredient_id: 1, quantity: 5, stock_qty: 100 },
            // console.log('check_qty : ' , check_qty);
            db.all(check_if_there_option_available, (err, check_option) => {
              if (err) return console.log(err.message);
              // console.log("check_option:", check_option);

              // console.log(check_option)

              // ตรวจวัดความพร้อมของแต่ละ option group
                const optionAvailability = {}; 
                  check_option.forEach(row => {
                    const { menu_id, ingredient_id, quantity, stock_qty } = row;
                    const key = `${menu_id}_${ingredient_id}`;

                    // เริ่มต้นเป็น true ถ้ายังไม่มี key
                    if (!(key in optionAvailability)) optionAvailability[key] = true;

                    // ถ้า stock ไม่พอ → false
                    if (stock_qty < quantity) optionAvailability[key] = false;
                  });
                // console.log(check_option); // ตรวจสอบ

                // console.log(optionAvailability); // ตรวจสอบ
          res.render('main_for_customer', {
            cart,
            total,
            cate,
            // menu: data_menu,
            menu: data_menu_with_avail,
            slt: selector,
            itslt: item_selector,
            optionAvailability,
            activeCateId: 1
          });
          });
        });
        });
      });
    });
  });
});
app.get('/main/:where' , (req,res) =>{
  req.session.where = req.params.where;
  console.log(req.session.where)
  res.redirect(`/main_for_customer`);
})
app.get('/confirm_order-customer', (req, res) => {
  // ถ้าไม่มี cart ให้กลับไปหน้าแรก
  if (!req.session.cart || req.session.cart.length === 0) {
    return res.redirect('/main_for_customer');
  }
  const promotion_sql = `SELECT * FROM Promotion`;
  db.all(promotion_sql, (err,promotion) =>{
    if (err) return console.log(err.message);
    // console.log(promotion)

    // ส่งข้อมูลไป render
  res.render('confirm_order-customer', {
    cart: req.session.cart,
    total:  req.session.total,
    pro: promotion
  });

  })
});
app.get('/canceled_order-customer', (req, res) => {
    req.session.cart = [];
    req.session.total = 0;
    res.redirect(`/where`);
});
app.get("/cash-customer/:amount", async (req, res) => {
  try {
    const cart = req.session.cart || [];
    const total = req.session.total || 0;
    const where = req.session.where || 'TAKE AWAY';
    const amount = parseInt(req.params.amount, 10);
    const left = amount - total;

    console.log(" เริ่มบันทึกคำสั่งซื้อ, ตะกร้าปัจจุบัน:", JSON.stringify(cart, null, 2));

    if (cart.length === 0) {
      return res.status(400).send("ไม่มีสินค้าในตะกร้า");
    }

    // 🕒 สร้าง prefix วันที่ เช่น 20251006
    const now = new Date();
    const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, "");

    // หาคำสั่งซื้อสุดท้ายของวันเดียวกัน
    db.get(
  `SELECT order_id FROM "Order"
   WHERE order_id LIKE ?
   ORDER BY order_id DESC LIMIT 1`,
  [`${datePrefix}-%`],
  (err, row) => {
    if (err) {
      console.error("❌ Query last order error:", err);
      return res.status(500).send("เกิดข้อผิดพลาดในการอ่านเลขคำสั่งซื้อ");
    }

    let nextNumber = 1;
    if (row && row.order_id) {
      const lastNum = parseInt(row.order_id.split("-")[1], 10);
      nextNumber = lastNum + 1;
    }

    const orderId = `${datePrefix}-${String(nextNumber).padStart(3, "0")}`;
    console.log("สร้าง orderId:", orderId);

    db.run(
      `INSERT INTO "Order" (order_id, total_price, order_type, status)
      VALUES (?, ?, ?, 'pending')`,
      [orderId, total,where],
      function (err) {
        if (err) {
          console.error("❌ Insert order error:", err);
          return res.status(500).send("บันทึกคำสั่งซื้อไม่สำเร็จ");
        }

            // --- บันทึกเมนูแต่ละรายการในตะกร้า ---
            cart.forEach((item) => {
              db.run(
                `INSERT INTO "OrderItem" (order_id, menu_id, quantity, price)
                 VALUES (?, ?, ?, ?)`,
                [orderId, item.menu_id, item.quantity, item.unitPrice],
                function (err2) {
                  if (err2) {
                    console.error("❌ Insert order item error:", err2);
                    return;
                  }

                  const orderItemId = this.lastID;
                  console.log(`เพิ่มเมนู ${item.menu_name} (order_item_id=${orderItemId})`);

                  // --- ถ้ามี options ---
                  if (item.options && item.options.length > 0) {
                    console.log(`🧩 เมนู ${item.menu_name} มี options:`, item.options);

                    item.options.forEach((opt) => {
                      db.get(
                        `SELECT option_id, extra_price FROM ItemOption WHERE option_name = ?`,
                        [opt.name],
                        (err3, row2) => {
                          if (err3) {
                            console.error("❌ Error finding option:", err3.message);
                            return;
                          }

                          if (row2) {
                            const finalExtra = opt.extra || row2.extra_price || 0;
                            db.run(
                              `INSERT INTO "OrderItemOption" (order_item_id, option_id, extra_price)
                               VALUES (?, ?, ?)`,
                              [orderItemId, row2.option_id, finalExtra],
                              (err4) => {
                                if (err4) {
                                  console.error("❌ Insert option error:", err4.message);
                                } else {
                                  console.log(
                                    `เพิ่ม option '${opt.name}' (option_id=${row2.option_id}) extra=${finalExtra}`
                                  );
                                }
                              }
                            );
                          } else {
                            console.warn("ไม่พบ option ในฐานข้อมูล:", opt.name);
                          }
                        }
                      ); 
                    });
                  }
                  db.run(
                        `UPDATE Ingredient 
                        SET stock_qty = stock_qty - ? 
                        WHERE ingredient_name = (SELECT menu_name FROM Menu WHERE menu_id = ?)`,
                        [item.quantity, item.menu_id],
                        (err5) => {
                          if (err5) console.error("❌ Update stock error:", err5.message);
                          else console.log(`ลด stock ของเมนู ${item.menu_id} ลง ${item.quantity}`);
                        }
                      );
                }
              );
            });

            // --- เคลียร์ session หลังบันทึกเสร็จ ---
            req.session.cart = [];
            req.session.total = 0;

            // --- แสดงหน้า payment_success ---
            res.render("payment_success-customer", {
              total,
              left,
              orderId,
            });

            console.log("✅ บันทึกคำสั่งซื้อสำเร็จ:", orderId);
          }
        );
      }
    );
  } catch (err) {
    console.error("❌ Error inserting order:", err);
    res.status(500).send("เกิดข้อผิดพลาดระหว่างบันทึกข้อมูลคำสั่งซื้อ");
  }
});
app.get('/pay_qr-customer', async (req, res) => {
  // const amount = 100000000000000000000;
// const amount = req.session.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const amount = req.session.total;
  const promptPayID = '0984242409'; // ใส่เบอร์พร้อมเพย์

  // ถ้าไม่มี amount ให้ default เป็น 1 บาท
  const finalAmount = amount ? parseFloat(amount) : 1;

  const payload = generatePayload(promptPayID, { amount: finalAmount });
  const qrDataUrl = await qrcode.toDataURL(payload);
  // console.log(cart)

  // res.send(`
  //   <h1>สแกนเพื่อชำระเงิน</h1>
  //   <p>จำนวนเงิน: ${finalAmount} บาท</p>
  //   <img src="${qrDataUrl}" alt="QR Code" />
  // `);
  res.render('pay_qr-customer',{amount: finalAmount, qr :qrDataUrl})

//   const cart = req.session.cart || [];

// // console.log(cart)
//   res.send(cart)
});

// ================== bartender ==================
// แสดงออเดอร์ทั้งหมด


// แสดงออเดอร์ทั้งหมด
  app.get('/bartender', function (req, res) {
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
          FROM 'Order' o
          LEFT JOIN OrderItem oi 
          ON oi.order_id = o.order_id
          LEFT JOIN Menu m 
          ON oi.menu_id = m.menu_id
          LEFT JOIN OrderItemOption oip 
          ON oip.order_item_id = oi.order_item_id
          LEFT JOIN ItemOption i ON i.option_id = oip.option_id
          WHERE m.category_id != 7 and o.status = 'pending'
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

app.post("/complete-order/:id", (req, res) => {
    const orderId = req.params.id;
    const sql = `UPDATE 'Order' SET status = 'complete' WHERE order_id = ?`;

    db.run(sql, [orderId], function(err) {
        if (err) {
            console.error(err.message);
            return res.json({ success: false, error: err.message });
        }
        res.json({ success: true });
    });
});

app.get('/inventory_for_barrista', (req, res) => {
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
        FROM 'Order' o
        LEFT JOIN OrderItem oi 
            ON oi.order_id = o.order_id
        LEFT JOIN Menu m 
            ON oi.menu_id = m.menu_id
        LEFT JOIN OrderItemOption oip 
            ON oip.order_item_id = oi.order_item_id
        LEFT JOIN ItemOption i 
            ON i.option_id = oip.option_id
        WHERE m.category_id != 7 and o.status = 'pending'
        GROUP BY o.order_id
        ORDER BY o.order_time
    `;

    // Query เมนู
    const menuQuery = `SELECT m.menu_image,m.category_id, m.menu_id, m.menu_name, m.base_price, m.is_avaliable, i.stock_qty 
                  FROM Menu m
                  LEFT JOIN Ingredient i
                    on (m.menu_name = i.ingredient_name)`;
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
            console.log(drinks);
            

            // bakery.forEach(b => b.is_available = !!b.is_available);
            // drinks.forEach(d => d.is_available = !!d.is_available);

            // console.log(drinks);
          
            const format_bakery = bakery.map(d => ({
                menu_image: d.menu_image,
                menu_id: d.menu_id,
                menu_name: d.menu_name,
                base_price: d.base_price,
                is_avaliable: d.is_avaliable === 1 ? true : false,
                stock_qty: d.stock_qty
            }));

            const format_drink = drinks.map(d => ({
                menu_image: d.menu_image,
                menu_id: d.menu_id,
                menu_name: d.menu_name,
                base_price: d.base_price,
                is_avaliable: d.is_avaliable === 1 ? true : false,
                stock_qty: d.stock_qty
            }));

            // console.log(format_drink);
            console.log(format_bakery);

            // ส่ง data ทั้งหมดไป render
            res.render('inventory_for_barrista', {
                data,   // ออเดอร์ทั้งหมด
                drinks : format_drink,   // เมนูเครื่องดื่ม
                bakery : format_bakery  // เมนู bakery
            });
        });
    });
});
//  toggle เครื่องดื่ม
app.post('/inventory/toggle/:id', (req, res) => {
  const id = req.params.id;
  const { is_avaliable } = req.body;

  if (typeof is_avaliable === 'undefined') {
    return res.status(400).json({ success: false, message: 'Missing is_avaliable field' });
  }

  const sql = `UPDATE Menu SET is_avaliable = ? WHERE menu_id = ?`;
  // console.log(sql);
  db.all(sql, [is_avaliable ? 1 : 0, id], function (err) {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ success: false, message: 'Database update failed' });
    }

    res.json({ success: true, is_avaliable });
  });
});
// ดึง stock จาก DB
app.get('/api/stock/:id', (req, res) => {
  const id = req.params.id;
  // console.log(id);
  const sql = `SELECT stock_qty FROM ingredient WHERE ingredient_name = (select menu_name from menu where menu_id = ${req.params.id})`;
  console.log(sql);

  db.get(sql, (err, row) => {

    console.log(row)
    if (err) return res.status(500).json({ error: err.message });
    res.json({ stock_qty: row ? row.stock_qty : 0 });
  });
});

// เพิ่ม/ลดจำนวนเบเกอรี่ (เก็บ stock ที่ Ingredient)
app.post('/inventory/stock/:id', (req, res) => {
  const id = req.params.id;
  const { change } = req.body;

  if (typeof change !== 'number') {
    return res.status(400).json({ success: false, message: 'Invalid or missing change value' });
  }

  const sqlGet = `
    SELECT m.menu_id, m.menu_name, i.stock_qty 
    FROM Menu m
    JOIN Ingredient i ON i.ingredient_name = m.menu_name
    WHERE m.menu_id = ? AND m.category_id = 7
  `;

  db.get(sqlGet, [id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: 'Database query failed' });
    if (!row) return res.status(404).json({ success: false, message: 'Bakery not found' });

    const newStock = Math.max(0, row.stock_qty + change);

    const sqlUpdate = `UPDATE Ingredient SET stock_qty = ? WHERE ingredient_name = ?`;
    db.run(sqlUpdate, [newStock, row.menu_name], function (err2) {
      if (err2) return res.status(500).json({ success: false, message: 'Database update failed' , error: err2.message});

      res.json({
        success: true,
        menu_id: row.menu_id,
        menu_name: row.menu_name,
        newStock
      });
    });
  });
});

// inventory_for_cashier
app.get('/inventory_for_cashier', (req, res) => {
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
        FROM 'Order' o
        LEFT JOIN OrderItem oi 
            ON oi.order_id = o.order_id
        LEFT JOIN Menu m 
            ON oi.menu_id = m.menu_id
        LEFT JOIN OrderItemOption oip 
            ON oip.order_item_id = oi.order_item_id
        LEFT JOIN ItemOption i 
            ON i.option_id = oip.option_id
        WHERE m.category_id != 7 and o.status = 'pending'
        GROUP BY o.order_id
        ORDER BY o.order_time
    `;

    // Query เมนู
    const menuQuery = `SELECT m.menu_image,m.category_id, m.menu_id, m.menu_name, m.base_price, m.is_avaliable, i.stock_qty 
                  FROM Menu m
                  LEFT JOIN Ingredient i
                    on (m.menu_name = i.ingredient_name)`;
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
            console.log(drinks);
            

            // bakery.forEach(b => b.is_available = !!b.is_available);
            // drinks.forEach(d => d.is_available = !!d.is_available);

            // console.log(drinks);
          
            const format_bakery = bakery.map(d => ({
                menu_image: d.menu_image,
                menu_id: d.menu_id,
                menu_name: d.menu_name,
                base_price: d.base_price,
                is_avaliable: d.is_avaliable === 1 ? true : false,
                stock_qty: d.stock_qty
            }));

            const format_drink = drinks.map(d => ({
                menu_image: d.menu_image,
                menu_id: d.menu_id,
                menu_name: d.menu_name,
                base_price: d.base_price,
                is_avaliable: d.is_avaliable === 1 ? true : false,
                stock_qty: d.stock_qty
            }));

            // console.log(format_drink);
            console.log(format_bakery);

            // ส่ง data ทั้งหมดไป render
            res.render('inventory_for_cashier', {
                data,   // ออเดอร์ทั้งหมด
                drinks : format_drink,   // เมนูเครื่องดื่ม
                bakery : format_bakery  // เมนู bakery
            });
        });
    });
});

//  toggle เครื่องดื่ม
app.post('/inventory/toggle/:id', (req, res) => {
  const id = req.params.id;
  const { is_avaliable } = req.body;

  if (typeof is_avaliable === 'undefined') {
    return res.status(400).json({ success: false, message: 'Missing is_avaliable field' });
  }

  const sql = `UPDATE Menu SET is_avaliable = ? WHERE menu_id = ?`;
  // console.log(sql);
  db.all(sql, [is_avaliable ? 1 : 0, id], function (err) {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ success: false, message: 'Database update failed' });
    }

    res.json({ success: true, is_avaliable });
  });
});

// ดึง stock จาก DB
app.get('/api/stock/:id', (req, res) => {
  const id = req.params.id;
  // console.log(id);
  const sql = `SELECT stock_qty FROM ingredient WHERE ingredient_name = (select menu_name from menu where menu_id = ${req.params.id})`;
  console.log(sql);

  db.get(sql, (err, row) => {

    console.log(row)
    if (err) return res.status(500).json({ error: err.message });
    res.json({ stock_qty: row ? row.stock_qty : 0 });
  });
});

// เพิ่ม/ลดจำนวนเบเกอรี่ (เก็บ stock ที่ Ingredient)
app.post('/inventory/stock/:id', (req, res) => {
  const id = req.params.id;
  const { change } = req.body;

  if (typeof change !== 'number') {
    return res.status(400).json({ success: false, message: 'Invalid or missing change value' });
  }

  const sqlGet = `
    SELECT m.menu_id, m.menu_name, i.stock_qty 
    FROM Menu m
    JOIN Ingredient i ON i.ingredient_name = m.menu_name
    WHERE m.menu_id = ? AND m.category_id = 7
  `;

  db.get(sqlGet, [id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: 'Database query failed' });
    if (!row) return res.status(404).json({ success: false, message: 'Bakery not found' });

    const newStock = Math.max(0, row.stock_qty + change);

    const sqlUpdate = `UPDATE Ingredient SET stock_qty = ? WHERE ingredient_name = ?`;
    db.run(sqlUpdate, [newStock, row.menu_name], function (err2) {
      if (err2) return res.status(500).json({ success: false, message: 'Database update failed' , error: err2.message});

      res.json({
        success: true,
        menu_id: row.menu_id,
        menu_name: row.menu_name,
        newStock
      });
    });
  });
});


// app.listen(3000, () => console.log(' running on port 3000'));
// app.listen(4000, () => console.log('Customer running on port 4000'));

const os = require("os");
const ip = Object.values(os.networkInterfaces())
  .flat()
  .find(i => i.family === "IPv4" && !i.internal)?.address;

app.listen(3000, "0.0.0.0", () => {
  console.log(`✅ Server running on http://${ip}:3000`);
});
