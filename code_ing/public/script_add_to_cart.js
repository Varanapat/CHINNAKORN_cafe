// ===== ฟังก์ชันหลักสำหรับ bind event ให้ปุ่มในตะกร้า =====
function bindCartEvents() {
  document.querySelectorAll(".cart-plus").forEach(btn => {
    btn.addEventListener("click", async () => {
      const li = btn.closest("li");
      const menuId = li.dataset.menuId;

      const res = await fetch("/update-cart", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ menu_id: menuId, change: +1 })
      });

      const data = await res.json();
      if (data.cartHtml) {
        document.querySelector(".container_2").innerHTML = data.cartHtml;
        bindCartEvents(); // rebind ใหม่หลัง render
      }
    });
  });

  document.querySelectorAll(".cart-minus").forEach(btn => {
    btn.addEventListener("click", async () => {
      const li = btn.closest("li");
      const menuId = li.dataset.menuId;

      const res = await fetch("/update-cart", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ menu_id: menuId, change: -1 })
      });

      const data = await res.json();
      if (data.cartHtml) {
        document.querySelector(".container_2").innerHTML = data.cartHtml;
        bindCartEvents(); // rebind ใหม่หลัง render
      }
    });
  });
}

  document.querySelectorAll(".qty-btn.minus").forEach(btn => {
    btn.onclick = async () => {
      const li = btn.closest("li");
      const menuId = li.dataset.menuId;
      const options = JSON.parse(li.dataset.options || "[]");
      let qty = Number(li.querySelector(".qty").innerText) - 1;
      if (qty < 0) qty = 0;

      const res = await fetch("/update-cart", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ menu_id: menuId, options, quantity: qty })
      });

      const data = await res.json();
      if (data.success) {
        document.querySelector("#cart-container").outerHTML = data.cartHtml;
        document.querySelector("#cart-icon").textContent = `🛒 (${data.total})`;
        bindCartEvents();
      }
    };
  });

// ===== loop cart-form =====
document.querySelectorAll(".cart-form").forEach(form => {
  const modal = form.closest(".modal");
  const priceEl = form.querySelector(".price");
  const qtyEl = form.querySelector(".qty");
  const qtyInput = form.querySelector('input[name="quantity"]');
  const optionsInput = form.querySelector('input[name="options"]');
  const totalPriceInput = form.querySelector('input[name="totalPrice"]');

  let selectedOptions = {};
  let quantity = parseInt(qtyEl.innerText) || 1;
  const menuId = form.dataset.menuId;

  function updateDisplay() {
    let totalExtra = Object.values(selectedOptions).reduce((sum, opt) => sum + opt.extra, 0);
    let totalPrice = (parseFloat(priceEl.dataset.basePrice) + totalExtra) * quantity;
    priceEl.innerText = totalPrice + " ฿";

    qtyInput.value = quantity;
    optionsInput.value = JSON.stringify(Object.values(selectedOptions));
    totalPriceInput.value = totalPrice;
  }

  // quantity +/-
  form.querySelector(".qty-btn.plus")?.addEventListener("click", () => {
    quantity++;
    qtyEl.innerText = quantity;
    updateDisplay();
  });

  form.querySelector(".qty-btn.minus")?.addEventListener("click", () => {
    if (quantity > 1) {
      quantity--;
      qtyEl.innerText = quantity;
      updateDisplay();
    }
  });

  // radio option
  form.querySelectorAll("input[type=radio]").forEach(input => {
    input.addEventListener("change", e => {
      const groupName = e.target.name;
      if (e.target.checked) {
        const label = e.target.nextElementSibling.innerText.trim();
        const extra = parseFloat(e.target.dataset.extra || 0);
        selectedOptions[groupName] = {name: label, extra};
      } else {
        delete selectedOptions[groupName];
      }
      updateDisplay();
    });
  });

  // submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      menu_id: menuId,
      options: Object.values(selectedOptions),
      quantity,
      totalPrice: parseFloat(totalPriceInput.value)
    };

    const res = await fetch("/add-to-cart", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.cartHtml) {
      document.querySelector(".container_2").innerHTML = data.cartHtml;
      bindCartEvents(); // ⭐ ต้องเรียกตรงนี้ด้วย
    }

    closeModal(modal);
  });
  updateDisplay();


});
