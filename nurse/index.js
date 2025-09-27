const path = require('path')
const port = 3000;
const express = require('express')
const sqlite3 = require('sqlite3').verbose();

const app = express();

let db = new sqlite3.Database('Test_TH.db', (err) => {    
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


app.get('/',(req,res) =>{
    console.log('Web staring')
    res.redirect('/category')
})


app.get('/category',(req,res) =>{
    const cate_select_sql = `SELECT * FROM Category`
    // console.log(cate_select_sql)
    db.all(cate_select_sql,(err,cate) =>{
        if (err) {
            console.log(err.message)
        }
        // console.log(cate)
        res.render('header_category', { data: cate })
        });

})

app.get('/category/:id' , (req,res) =>{
    const cate_select_sql = `SELECT * FROM Category`
    let menu_select_sql = `SELECT * FROM MENU
    WHERE category_id = ${req.params.id};`
    // console.log(menu_select_sql)
    db.all(cate_select_sql,(err,cate) => {
        if (err) {
            console.log(err.message)
        }

        db.all(menu_select_sql, (err,data_menu) =>{
            if (err) {
                console.log(err.message)
            }
        console.log(data_menu)
        res.render('selecting_menu', { 
            data: cate,
            menu: data_menu
        })
    })
    });
})



//listen
app.listen(port, (req,res) =>{
    console.log(`Starting on port ${port}`)
})