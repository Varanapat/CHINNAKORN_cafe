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


app.post("/add-to-cart", (req, res) => {
  const { menu_id, quantity, options, unitPrice, totalPrice } = req.body;
  console.log('menu_id',typeof menu_id);
  console.log('quantity',typeof quantity);
  // มันน่าจะเพราะว่า มันส่งเข้ามาเป็น object
  console.log('option',typeof option);
  // ไม่มีเเต่ใส่เข้ามา 
  console.log('unitPrice',typeof unitPrice);
  console.log('totalPrice',typeof totalPrice);

  if (!req.session.cart) req.session.cart = [];

    // options ที่ได้มามันเป็น obj เราต้องเเปลงเป็น string ก่อน เลยสร้างตัวเเปรมาใหม่เพื่อเอามาเทียบ
  const optionsStr = JSON.stringify(options);
  console.log('optionsStr',optionsStr,typeof optionsStr)

  const existingItem = req.session.cart.find(
                                //  ตรงงนี้คือเเปลงกลับมาเพื่อเทียบ ว่ามันเท่ากับตัวเก่าไหม
    i => i.menu_id === menu_id && JSON.stringify(i.options) === optionsStr
  );
  
  // ทำให้มั่นใจว่า quantity มันเป็น ตัวเลขจริงๆ
  const qty = Number(quantity);
  const uPrice = unitPrice !== undefined 
    ? Number(unitPrice) 
    : (totalPrice ? Number(totalPrice) / qty : 0);


  // ถ้าเจอตัวเก่า ให้เพิ่มจำนวนเเทน เเล้วก็เพิ่ม totalPrice 
  if (existingItem) {
    existingItem.quantity += qty;
    existingItem.totalPrice_forMenu = existingItem.unitPrice * existingItem.quantity;
  } else {
  // ถ้าไม่เจอตัวเก่า ให้ push สินค้าใหม่เข้าไป
    req.session.cart.push({
      menu_id,
      options,
      quantity: qty,
      unitPrice: uPrice,
      totalPrice_forMenu: uPrice * qty
    });
  }
  console.log('This is session cart',req.session.cart)

  req.session.total = req.session.cart.reduce(
    (sum, item) => sum + (item.totalPrice_forMenu || 0),
    0
  );
  console.log('This is session total',req.session.total)

  const cartCount = req.session.cart.reduce((sum, i) => sum + i.quantity, 0);

  res.json({
    success: true,
    cart: req.session.cart,
    cartCount,
    total: req.session.total,
    message: "เพิ่มลงตะกร้าเรียบร้อย!"
  });

  // console.log(req.session.cart)
});




//listen
app.listen(port, (req, res) => {
    console.log(`Starting on port ${port}`)
})
