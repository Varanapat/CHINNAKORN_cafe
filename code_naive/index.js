const path = require('path')
const port = 3000;
const express = require('express')
const sqlite3 = require('sqlite3').verbose();

const app = express();

let db = new sqlite3.Database('CHINNAKORN_blueprint.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQlite database.');
});

// static resourse & templating engine
app.use(express.static('public'));
// Set EJS as templating engine
app.set('view engine', 'ejs');


// rounting
app.get('/', (req, res) => {
    console.log('Web starting');
    const sql = `SELECT category_id FROM Category ORDER BY category_id ASC LIMIT 1;`;

    db.get(sql, (err, row) => {
        if (err) {
            console.log(err.message);
            return res.send("Error loading categories");
        }
        if (row) {
            res.redirect(`/category/${row.category_id}`);
        } else {
            res.send("No categories found");
        }
    });
});


app.get('/category', (req, res) => {
    const { id } = req.params;

    const cate_select_sql = `SELECT * FROM Category`;
    const menu_select_sql = `SELECT * FROM MENU;`;
    const option_selector_sql = `
        SELECT 
            m.menu_id, 
            m.menu_name, 
            og.group_name
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

                    res.render('selecting_menu', {
                        cate: cate,
                        menu: data_menu,
                        slt : selector,
                        itslt : item_selector,
                        activeCateId: id
                    })
                })
            })
        })
    });
});




//listen
app.listen(port, (req, res) => {
    console.log(`Starting on port ${port}`)
})