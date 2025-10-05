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
            res.redirect(`/main_for_cashier`);
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

app.get('/cart_customer' , (req,res) =>{
  // res.send('Is this all you need : ',req.session.cart)
  // res.send('Total Price : ',req.session.total)
  // console.log('Is this all you need : ',req.session.cart)
  // console.log('Total Price : ',req.session.total)
  // res.send('You are on the cart views')
  // res.render('cart' ,{data :req.session.cart})
  const cart = req.session.cart || [];
  const total = req.session.total || 0;
  res.render("cart_for_customer", { cart, total });

  // console.log('This is Cart menu',cart)



  
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

const qrcode = require('qrcode');
const generatePayload = require('promptpay-qr'); // ใช้จาก promptpay-qr


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



app.get('/main_for_cashier', (req, res) => {
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
                console.log(check_option); // ตรวจสอบ

                console.log(optionAvailability); // ตรวจสอบ
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
          });
        });
        });
      });
    });
  });
});


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
                console.log(check_option); // ตรวจสอบ

                console.log(optionAvailability); // ตรวจสอบ
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


app.get('/canceled_order', (req, res) => {
    req.session.cart = [];
    req.session.total = 0;
    res.redirect(`/main_for_cashier`);
});


app.get('/confirm_order', (req, res) => {
  // ถ้าไม่มี cart ให้กลับไปหน้าแรก
  if (!req.session.cart || req.session.cart.length === 0) {
    return res.redirect('/main_for_cashier');
  }
  // ส่งข้อมูลไป render
  res.render('confirm_order', {
    cart: req.session.cart,
    total:  req.session.total
  });
});

//listen
app.listen(port, (req, res) => {
    console.log(`Starting on port ${port}`)
})
