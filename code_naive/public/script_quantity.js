document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".modal").forEach(modal => {
    const priceEl = modal.querySelector(".price");
    const selectedOptionsEl = modal.querySelector(".selected-options");
    const qtyEl = modal.querySelector(".qty");

    if (!priceEl || !qtyEl) return; // ถ้า modal นี้ไม่ครบข้ามไป

    const basePrice = parseFloat(priceEl.dataset.basePrice);
    let selectedOptions = {};
    let quantity = 1;

    // เลือก option
    modal.querySelectorAll("input[type=radio]").forEach(input => {
      input.addEventListener("change", e => {
        const label = e.target.nextElementSibling.innerText.trim();
        const spanEl = e.target.closest(".option_container")?.querySelector("span");
        const extraText = spanEl ? spanEl.innerText : "";
        const extraPrice = parseFloat(extraText.replace(/[^\d]/g, "")) || 0;

        selectedOptions[e.target.name] = { name: label, extra: extraPrice };
        updateDisplay();
        console.log("Modal:", modal.id, "เลือก:", label, "เพิ่มราคา:", extraPrice);
      });
    });

    // ปุ่ม + / –
    const plusBtn = modal.querySelector(".qty-btn.plus");
    const minusBtn = modal.querySelector(".qty-btn.minus");

    if (plusBtn) {
      plusBtn.addEventListener("click", () => {
        quantity++;
        qtyEl.innerText = quantity;
        updateDisplay();
      });
    }

    if (minusBtn) {
      minusBtn.addEventListener("click", () => {
        if (quantity > 1) {
          quantity--;
          qtyEl.innerText = quantity;
          updateDisplay();
        }
      });
    }

    function updateDisplay() {
      let totalExtra = Object.values(selectedOptions).reduce((sum, opt) => sum + opt.extra, 0);
      let totalPrice = (basePrice + totalExtra) * quantity;

      priceEl.innerText = totalPrice + " ฿";

      let chosenList = Object.values(selectedOptions).map(opt =>
        opt.extra > 0 ? `${opt.name} (+${opt.extra} ฿)` : `${opt.name}`
      );

      selectedOptionsEl.innerText = chosenList.join(" , ");
    }
  });
});
