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
    console.log('Web staring')
    res.redirect('/category')
})


app.get('/category', (req, res) => {
    const cate_select_sql = `SELECT * FROM Category`
    // console.log(cate_select_sql)
    db.all(cate_select_sql, (err, cate) => {
        if (err) {
            console.log(err.message)
        }
        // console.log(cate)
        res.render('header_category', { data: cate })
    });

})

app.get('/category/:id', (req, res) => {
    const cate_select_sql = `SELECT * FROM Category`
    const menu_select_sql = `SELECT * FROM MENU
    WHERE category_id = ${req.params.id};`
    const option_selector_sql = `
    SELECT 
    m.menu_id, 
    m.menu_name, 
    og.group_name
    FROM menu m
    INNER JOIN Menu_OptionGroup mo
        ON m.menu_id = mo.menu_id
    INNER JOIN OptionGroup og 
        ON mo.option_group_id = og.option_group_id`

    const item_selector_sql = `
    SELECT 
        og.group_name,
        it.option_name,
        it.extra_price
    FROM OptionGroup og 
    INNER JOIN ItemOption it
        ON og.option_group_id = it.option_group_id;`
    // console.log(option_selector_sql)
    db.all(cate_select_sql, (err, cate) => {
        if (err) {
            console.log(err.message)
        }

        db.all(menu_select_sql, (err, data_menu) => {
            if (err) {
                console.log(err.message)
            }
            db.all(option_selector_sql, (err, selector) => {
                if (err) {
                    console.log(err.message)
                }
                db.all(item_selector_sql, (err,item_selector) =>{
                    if (err) {
                        console.log(err.message)
                    }
                    console.log(data_menu)
                    res.render('selecting_menu', {
                        data: cate,
                        menu: data_menu,
                        slt : selector,
                        itslt : item_selector
                    })
                })
            })
        })
    });
})



//listen
app.listen(port, (req, res) => {
    console.log(`Starting on port ${port}`)
})