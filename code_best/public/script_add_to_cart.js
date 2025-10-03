document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".cart-form").forEach(form => {
    const modal = form; // ใช้ form เป็น modal
    const priceEl = modal.querySelector(".price");
    const selectedOptionsEl = modal.querySelector(".selected-options");
    const qtyEl = modal.querySelector(".qty");
    const qtyInput = modal.querySelector('input[name="quantity"]');
    const optionsInput = modal.querySelector('input[name="options"]');
    const totalPriceInput = modal.querySelector('input[name="totalPrice"]');
    const basePrice = parseFloat(priceEl.dataset.basePrice);

    let selectedOptions = {};
    let quantity = parseInt(qtyEl.innerText) || 1;
    const menuId = modal.dataset.menuId;

    function updateDisplay() {
      let totalExtra = Object.values(selectedOptions)
        .reduce((sum, opt) => sum + opt.extra, 0);

      let totalPrice = (basePrice + totalExtra) * quantity;
      priceEl.innerText = totalPrice + " ฿";

      let chosenList = [];
      modal.querySelectorAll(".option_container").forEach(container => {
        const input = container.querySelector("input[type=radio]:checked");
        if (input) {
          const opt = selectedOptions[input.name];
          if (opt) {
            chosenList.push(
              opt.extra > 0 ? `${opt.name} (+${opt.extra} ฿)` : opt.name
            );
          }
        }
      });

      // ถ้าไม่มีอะไรเลือก → เคลียร์ข้อความ
      selectedOptionsEl.innerText = chosenList.length > 0 ? chosenList.join(" , ") : "";

      // อัปเดต hidden inputs
      qtyInput.value = quantity;
      optionsInput.value = JSON.stringify(Object.values(selectedOptions));
      totalPriceInput.value = totalPrice;
    }

    // event change ของ radio
    // event change ของ radio
    modal.querySelectorAll("input[type=radio]").forEach(input => {
      input.addEventListener("click", e => {
        // ถ้ากดซ้ำใน radio ที่เลือกอยู่
        if (e.target.wasChecked) {
          e.target.checked = false;
          delete selectedOptions[e.target.name];
          updateDisplay();
        }
        // เก็บสถานะไว้ใช้รอบหน้า
        e.target.wasChecked = e.target.checked;
      });

      input.addEventListener("change", e => {
        const groupName = e.target.name;
        if (e.target.checked) {
          const label = e.target.nextElementSibling.innerText.trim();
          const spanEl = e.target.closest(".option_container")?.querySelector("span");
          const extraText = spanEl ? spanEl.innerText : "";
          const extraPrice = parseFloat(extraText.replace(/[^\d]/g, "")) || 0;

          selectedOptions[groupName] = {
            name: label,
            extra: extraPrice
          };
        } else {
          delete selectedOptions[groupName];
        }
        updateDisplay();
      });
    });


    // ปุ่ม + / -
    modal.querySelector(".qty-btn.plus")?.addEventListener("click", () => {
      quantity++;
      qtyEl.innerText = quantity;
      updateDisplay();
    });

    modal.querySelector(".qty-btn.minus")?.addEventListener("click", () => {
      if (quantity > 1) {
        quantity--;
        qtyEl.innerText = quantity;
        updateDisplay();
      }
    });

    // ส่ง POST เป็น JSON
    form.addEventListener("submit", e => {
      e.preventDefault();

      const payload = {
        menu_id: menuId,
        options: Object.values(selectedOptions),
        quantity,
        totalPrice: parseFloat(totalPriceInput.value)
      };

      fetch("/add-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(data => {
          alert("เพิ่มลงตะกร้าเรียบร้อย!");
          console.log("Server response:", data);

          // อัปเดตจำนวนในตะกร้า
          // if (data.cartCount !== undefined) {
          //   document.querySelector("#cart-count").innerText = data.cartCount;
          // }
          if (data.cartCount !== undefined) {
            document.querySelector("#cart-count").innerText = data.cartCount;
          }


          // ปิด modal
          closeModal(modal.closest(".modal"));
        })
        .catch(err => console.error(err));
    });

    updateDisplay();
  });
});