import { supabase } from "./supabase.js";


/* =========================================================
   CART
   ========================================================= */

const cart = JSON.parse(
  localStorage.getItem("brewBeanCart") || "[]"
);


/* =========================================================
   ELEMENTS
   ========================================================= */

const checkoutContent =
  document.getElementById("checkoutContent");

const emptyCheckout =
  document.getElementById("emptyCheckout");

const checkoutItems =
  document.getElementById("checkoutItems");

const checkoutSubtotal =
  document.getElementById("checkoutSubtotal");

const checkoutTotal =
  document.getElementById("checkoutTotal");

const checkoutForm =
  document.getElementById("checkoutForm");

const placeOrderButton =
  document.getElementById("placeOrderButton");

const checkoutError =
  document.getElementById("checkoutError");

const orderSuccess =
  document.getElementById("orderSuccess");

const successMessage =
  document.getElementById("successMessage");


/* =========================================================
   CHECK CART
   ========================================================= */

if (!cart.length) {

  checkoutContent.classList.add("hidden");

  emptyCheckout.classList.remove("hidden");

} else {

  renderCheckout();

}


/* =========================================================
   RENDER BILL
   ========================================================= */

function renderCheckout() {

  checkoutItems.innerHTML = "";


  let subtotal = 0;


  cart.forEach(item => {

    const itemTotal =
      Number(item.price) *
      Number(item.quantity);


    subtotal += itemTotal;


    const row =
      document.createElement("div");


    row.style.cssText = `
      display: flex;
      gap: 12px;
      padding: 14px 0;
      border-bottom: 1px solid var(--border);
    `;


    row.innerHTML = `

      <img
        src="${escapeHtml(item.image_url || "")}"
        alt="${escapeHtml(item.name)}"
        style="
          width: 58px;
          height: 58px;
          object-fit: cover;
          border-radius: 9px;
        "
      >


      <div style="flex: 1;">

        <strong>
          ${escapeHtml(item.name)}
        </strong>

        <div
          style="
            color: var(--muted);
            font-size: 0.82rem;
            margin-top: 3px;
          "
        >
          ${item.quantity} × ₹${Number(item.price).toFixed(0)}
        </div>

      </div>


      <strong>
        ₹${itemTotal.toFixed(0)}
      </strong>

    `;


    checkoutItems.appendChild(row);

  });


  checkoutSubtotal.textContent =
    `₹${subtotal.toFixed(0)}`;

  checkoutTotal.textContent =
    `₹${subtotal.toFixed(0)}`;

}


/* =========================================================
   PLACE ORDER
   ========================================================= */

checkoutForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    checkoutError.classList.add("hidden");

    placeOrderButton.disabled = true;

    placeOrderButton.textContent =
      "Placing Order...";


    try {

      const formData =
        new FormData(checkoutForm);


      const customerName =
        String(
          formData.get("customer_name") || ""
        ).trim();


      const customerPhone =
        String(
          formData.get("customer_phone") || ""
        ).trim();


      const customerEmail =
        String(
          formData.get("customer_email") || ""
        ).trim();


      const orderType =
  String(
    formData.get("order_type") || "pickup"
  );


      const notes =
        String(
          formData.get("notes") || ""
        ).trim();


      if (!customerName) {
        throw new Error(
          "Please enter your name."
        );
      }


      if (!customerPhone) {
        throw new Error(
          "Please enter your phone number."
        );
      }


      if (!cart.length) {
        throw new Error(
          "Your cart is empty."
        );
      }


      /* Calculate subtotal */

      const subtotal =
        cart.reduce(
          (total, item) =>
            total +
            (
              Number(item.price) *
              Number(item.quantity)
            ),
          0
        );


      /*
       * Currently we are not adding GST,
       * delivery charges or service charges.
       *
       * Therefore:
       *
       * total = subtotal
       */

      const total = subtotal;


      /* Generate order number */

      const orderNumber =
        generateOrderNumber();


      /* Prepare JSONB items */

      const items =
        cart.map(item => ({

          id: item.id,

          name: item.name,

          price: Number(item.price),

          quantity: Number(item.quantity),

          image_url: item.image_url || null

        }));


      /* Insert order */

      const { error } = await supabase

  .from("orders")

  .insert({

    order_number: orderNumber,

    customer_name: customerName,

    customer_phone: customerPhone,

    customer_email:
      customerEmail || null,

    order_type: orderType,

    notes: notes || null,

    subtotal: subtotal,

    total: total,

    payment_status: "pending",

    status: "pending",

    items: items

  });


      if (error) {
        throw error;
      }


      /* Clear cart */

      localStorage.removeItem(
        "brewBeanCart"
      );


      /* Show success */

      checkoutContent.classList.add(
        "hidden"
      );

      orderSuccess.classList.remove(
        "hidden"
      );


      successMessage.textContent =
        `Your order number is ${orderNumber}. ` +
        `We have received your order successfully.`;


    } catch (error) {

      console.error(
        "Order creation error:",
        error
      );


      checkoutError.textContent =
        error.message ||
        "Something went wrong while placing your order.";


      checkoutError.classList.remove(
        "hidden"
      );


      placeOrderButton.disabled = false;

      placeOrderButton.textContent =
        "Place Order";

    }

  }
);


/* =========================================================
   ORDER NUMBER
   ========================================================= */

function generateOrderNumber() {

  const now =
    new Date();


  const date =
    now.toISOString()
      .slice(0, 10)
      .replaceAll("-", "");


  const random =
    Math.floor(
      1000 +
      Math.random() * 9000
    );


  return `BB-${date}-${random}`;

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}