
// document.addEventListener("DOMContentLoaded", () => {
//     const cartList = document.getElementById("cart-list");

//     cartList.addEventListener("click", async (e) => {
//         const btn = e.target;
//         if (!btn.classList.contains("qty-btn")) return;

//         const li = btn.closest("li");
//         const menu_id = li.dataset.menuId;
//         const options = JSON.parse(li.dataset.options);
//         const qtyEl = li.querySelector(".qty");
//         let quantity = parseInt(qtyEl.textContent);

//         if (btn.classList.contains("plus")) quantity++;
//         if (btn.classList.contains("minus") && quantity > 1) quantity--;

//         // เรียก /update-cart ผ่าน fetch
//         const res = await fetch("/update-cart", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ menu_id, options, quantity })
//         });

//         const data = await res.json();
//         if (data.success) {
//             // อัปเดตหน้าเว็บ
//             qtyEl.textContent = data.cart.find(i => i.menu_id == menu_id && JSON.stringify(i.options) === JSON.stringify(options)).quantity;
//             li.querySelector(".totalPrice").textContent = data.cart.find(i => i.menu_id == menu_id && JSON.stringify(i.options) === JSON.stringify(options)).totalPrice_forMenu;
//             document.getElementById("cart-total").textContent = data.total;
//         } else {
//             alert("อัปเดตสินค้าไม่สำเร็จ");
//         }
//     });
// });




document.addEventListener("DOMContentLoaded", () => {
    const cartList = document.getElementById("cart-list");

    cartList.addEventListener("click", async (e) => {
        const btn = e.target;
        if (!btn.classList.contains("qty-btn")) return;

        const li = btn.closest("li");
        const menu_id = li.dataset.menuId;
        const options = JSON.parse(li.dataset.options);
        const qtyEl = li.querySelector(".qty");
        let quantity = parseInt(qtyEl.textContent);

        if (btn.classList.contains("plus")) quantity++;
        if (btn.classList.contains("minus")) quantity--;

        // quantity = 0 ก็ส่งไปลบ
        const res = await fetch("/update-cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ menu_id, options, quantity })
        });

        const data = await res.json();
        if (data.success) {
            if (quantity === 0) {
                li.remove(); // ลบ <li> ออกจากหน้าเว็บ
            } else {
                qtyEl.textContent = data.cart.find(i => i.menu_id == menu_id && JSON.stringify(i.options) === JSON.stringify(options)).quantity;
                li.querySelector(".totalPrice").textContent = data.cart.find(i => i.menu_id == menu_id && JSON.stringify(i.options) === JSON.stringify(options)).totalPrice_forMenu;
            }
            document.getElementById("cart-total").textContent = data.total;

            // ถ้า cart ว่าง เปลี่ยนข้อความ
            if (data.cart.length === 0) {
                document.getElementById("cart-list").innerHTML = "<li>ยังไม่มีสินค้าในตะกร้า</li>";
            }
        } else {
            alert("อัปเดตสินค้าไม่สำเร็จ");
        }
    });
});