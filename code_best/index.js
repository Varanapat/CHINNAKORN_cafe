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

                db.all(item_selector_sql, (err,item_selector) =>{
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


//listen
app.listen(port, (req, res) => {
    console.log(`Starting on port ${port}`)
})
