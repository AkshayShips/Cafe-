import { supabase } from "./supabase.js";


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let menuItems = [];

let cart = JSON.parse(
  localStorage.getItem("brewBeanCart") || "[]"
);

let activeCategory = "All";


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const menuGrid =
  document.getElementById("menuGrid");

const menuLoading =
  document.getElementById("menuLoading");

const menuError =
  document.getElementById("menuError");

const categoryFilter =
  document.getElementById("categoryFilter");

const retryMenu =
  document.getElementById("retryMenu");

const cartButton =
  document.getElementById("cartButton");

const cartDrawer =
  document.getElementById("cartDrawer");

const cartOverlay =
  document.getElementById("cartOverlay");

const closeCart =
  document.getElementById("closeCart");

const cartItems =
  document.getElementById("cartItems");

const cartCount =
  document.getElementById("cartCount");

const cartItemCount =
  document.getElementById("cartItemCount");

const cartTotal =
  document.getElementById("cartTotal");

const checkoutButton =
  document.getElementById("checkoutButton");


/* =========================================================
   LOAD MENU FROM SUPABASE
   ========================================================= */

async function loadMenu() {

  if (!menuGrid) {
    return;
  }

  menuLoading.classList.remove("hidden");

  menuError.classList.add("hidden");

  menuGrid.innerHTML = "";

  try {

    const {
      data,
      error
    } = await supabase

      .from("menu_items")

      .select(`
        id,
        name,
        description,
        price,
        category,
        image_url,
        available
      `)

      .eq("available", true)

      .order("name");


    if (error) {
      throw error;
    }


    menuItems = data || [];


    createCategoryButtons();

    renderMenu();

  } catch (error) {

    console.error(
      "Error loading menu:",
      error
    );

    menuError.classList.remove("hidden");

  } finally {

    menuLoading.classList.add("hidden");

  }
}


/* =========================================================
   CATEGORY BUTTONS
   ========================================================= */

function createCategoryButtons() {

  if (!categoryFilter) {
    return;
  }


  const categories = [
    "All",
    ...new Set(
      menuItems.map(
        item => item.category
      )
    )
  ];


  categoryFilter.innerHTML = "";


  categories.forEach(category => {

    const button =
      document.createElement("button");

    button.type = "button";

    button.className =
      "filter-btn" +
      (
        category === activeCategory
          ? " active"
          : ""
      );

    button.textContent = category;

    button.addEventListener(
      "click",
      () => {

        activeCategory = category;

        document
          .querySelectorAll(".filter-btn")
          .forEach(btn => {
            btn.classList.remove("active");
          });

        button.classList.add("active");

        renderMenu();

      }
    );

    categoryFilter.appendChild(button);

  });
}


/* =========================================================
   RENDER MENU
   ========================================================= */

function renderMenu() {

  if (!menuGrid) {
    return;
  }


  const filteredItems =
    activeCategory === "All"

      ? menuItems

      : menuItems.filter(
          item =>
            item.category === activeCategory
        );


  menuGrid.innerHTML = "";


  if (!filteredItems.length) {

    menuGrid.innerHTML = `
      <div
        class="text-center"
        style="grid-column: 1 / -1;"
      >
        <p>
          No menu items found.
        </p>
      </div>
    `;

    return;
  }


  filteredItems.forEach(item => {

    const card =
      document.createElement("article");

    card.className = "menu-card";


    card.innerHTML = `

      <img
        class="menu-card-image"
        src="${escapeHtml(item.image_url || "images/menu-placeholder.jpg")}"
        alt="${escapeHtml(item.name)}"
        loading="lazy"
        onerror="this.src='images/menu-placeholder.jpg'"
      >


      <div class="menu-card-body">

        <span class="menu-category">
          ${escapeHtml(item.category)}
        </span>


        <div class="menu-card-top">

          <h3>
            ${escapeHtml(item.name)}
          </h3>

          <span class="menu-price">
            ₹${Number(item.price).toFixed(0)}
          </span>

        </div>


        <p class="menu-description">
          ${escapeHtml(
            item.description || ""
          )}
        </p>


        <button
          type="button"
          class="btn btn-primary"
          data-add-to-cart="${item.id}"
          style="width: 100%;"
        >
          Add to Cart
        </button>

      </div>

    `;


    menuGrid.appendChild(card);

  });


  document
    .querySelectorAll("[data-add-to-cart]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.addToCart;

          addToCart(id);

        }
      );

    });

}


/* =========================================================
   ADD TO CART
   ========================================================= */

function addToCart(itemId) {

  const item =
    menuItems.find(
      menuItem =>
        String(menuItem.id) ===
        String(itemId)
    );


  if (!item) {
    return;
  }


  const existingItem =
    cart.find(
      cartItem =>
        String(cartItem.id) ===
        String(item.id)
    );


  if (existingItem) {

    existingItem.quantity += 1;

  } else {

    cart.push({

      id: item.id,

      name: item.name,

      price: Number(item.price),

      image_url: item.image_url,

      quantity: 1

    });

  }


  saveCart();

  updateCartUI();

  openCart();

}


/* =========================================================
   REMOVE FROM CART
   ========================================================= */

function removeFromCart(itemId) {

  cart =
    cart.filter(
      item =>
        String(item.id) !==
        String(itemId)
    );


  saveCart();

  updateCartUI();

}


/* =========================================================
   CHANGE QUANTITY
   ========================================================= */

function changeQuantity(
  itemId,
  change
) {

  const item =
    cart.find(
      cartItem =>
        String(cartItem.id) ===
        String(itemId)
    );


  if (!item) {
    return;
  }


  item.quantity += change;


  if (item.quantity <= 0) {

    removeFromCart(itemId);

    return;

  }


  saveCart();

  updateCartUI();

}


/* =========================================================
   UPDATE CART UI
   ========================================================= */

function updateCartUI() {

  if (!cartItems) {
    return;
  }


  const totalQuantity =
    cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );


  const totalPrice =
    cart.reduce(
      (total, item) =>
        total +
        item.price * item.quantity,
      0
    );


  if (cartCount) {
    cartCount.textContent =
      totalQuantity;
  }


  if (cartItemCount) {

    cartItemCount.textContent =
      `${totalQuantity} ${
        totalQuantity === 1
          ? "item"
          : "items"
      }`;

  }


  if (cartTotal) {

    cartTotal.textContent =
      `₹${totalPrice.toFixed(0)}`;

  }


  if (!cart.length) {

    cartItems.innerHTML = `
      <p
        class="text-center"
        style="color: var(--muted);"
      >
        Your cart is empty.
      </p>
    `;

    return;

  }


  cartItems.innerHTML =
    cart.map(item => `

      <div
        style="
          display: flex;
          gap: 12px;
          padding: 15px 0;
          border-bottom: 1px solid var(--border);
        "
      >

        <img
          src="${escapeHtml(item.image_url || "")}"
          alt="${escapeHtml(item.name)}"
          style="
            width: 65px;
            height: 65px;
            object-fit: cover;
            border-radius: 10px;
          "
        >


        <div style="flex: 1;">

          <strong>
            ${escapeHtml(item.name)}
          </strong>


          <div
            style="
              color: var(--muted);
              font-size: 0.85rem;
              margin-top: 3px;
            "
          >
            ₹${item.price.toFixed(0)}
          </div>


          <div
            style="
              display: flex;
              align-items: center;
              gap: 10px;
              margin-top: 8px;
            "
          >

            <button
              type="button"
              data-minus="${item.id}"
              style="
                width: 28px;
                height: 28px;
                border: 1px solid var(--border);
                border-radius: 50%;
                background: white;
              "
            >
              −
            </button>


            <span>
              ${item.quantity}
            </span>


            <button
              type="button"
              data-plus="${item.id}"
              style="
                width: 28px;
                height: 28px;
                border: 1px solid var(--border);
                border-radius: 50%;
                background: white;
              "
            >
              +
            </button>


            <button
              type="button"
              data-remove="${item.id}"
              style="
                margin-left: auto;
                border: 0;
                background: transparent;
                color: #a33;
                font-size: 0.8rem;
              "
            >
              Remove
            </button>

          </div>

        </div>

      </div>

    `).join("");


  document
    .querySelectorAll("[data-minus]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          changeQuantity(
            button.dataset.minus,
            -1
          );

        }
      );

    });


  document
    .querySelectorAll("[data-plus]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          changeQuantity(
            button.dataset.plus,
            1
          );

        }
      );

    });


  document
    .querySelectorAll("[data-remove]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          removeFromCart(
            button.dataset.remove
          );

        }
      );

    });

}


/* =========================================================
   CART STORAGE
   ========================================================= */

function saveCart() {

  localStorage.setItem(
    "brewBeanCart",
    JSON.stringify(cart)
  );

}


/* =========================================================
   CART OPEN / CLOSE
   ========================================================= */

function openCart() {

  cartDrawer?.classList.add("open");

  cartOverlay?.classList.add("active");

}


function closeCartDrawer() {

  cartDrawer?.classList.remove("open");

  cartOverlay?.classList.remove("active");

}


cartButton?.addEventListener(
  "click",
  openCart
);


closeCart?.addEventListener(
  "click",
  closeCartDrawer
);


cartOverlay?.addEventListener(
  "click",
  closeCartDrawer
);


/* =========================================================
   CHECKOUT
   ========================================================= */

checkoutButton?.addEventListener(
  "click",
  () => {

    if (!cart.length) {

      alert("Your cart is empty.");

      return;

    }

    window.location.href = "checkout.html";

  }
);


/* =========================================================
   RETRY
   ========================================================= */

retryMenu?.addEventListener(
  "click",
  loadMenu
);


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

/* =========================================================
   CONTACT FORM
   ========================================================= */

const contactForm =
  document.getElementById("contactForm");

const contactStatus =
  document.getElementById("contactStatus");


async function submitContact(event) {

  event.preventDefault();

  if (!contactForm) {
    return;
  }


  const formData =
    new FormData(contactForm);


  const name =
    String(formData.get("name") || "").trim();

  const email =
    String(formData.get("email") || "").trim();

  const message =
    String(formData.get("message") || "").trim();


  if (!name || !email || !message) {

    if (contactStatus) {

      contactStatus.textContent =
        "Please fill in your name, email and message.";

      contactStatus.className =
        "contact-status error";
    }

    return;
  }


  /* Show sending status */

  if (contactStatus) {

    contactStatus.textContent =
      "Sending your message...";

    contactStatus.className =
      "contact-status";
  }


  try {

    const { error } =
      await supabase
        .from("contact_messages")
        .insert({
          name: name,
          email: email,
          message: message
        });


    if (error) {

      console.error(
        "Supabase contact error:",
        error
      );


      if (contactStatus) {

        contactStatus.textContent =
          "Unable to send your message. Please try again.";

        contactStatus.className =
          "contact-status error";
      }

      return;
    }


    /* Success */

    console.log(
      "Contact message saved successfully."
    );


    if (contactStatus) {

      contactStatus.textContent =
        "Message sent successfully! Thank you for contacting Brew & Bean.";

      contactStatus.className =
        "contact-status success";
    }


    contactForm.reset();


  } catch (error) {

    console.error(
      "Contact form error:",
      error
    );


    if (contactStatus) {

      contactStatus.textContent =
        "Something went wrong. Please try again.";

      contactStatus.className =
        "contact-status error";
    }

  }

}

contactForm?.addEventListener(
  "submit",
  submitContact
);


/* =========================================================
   INITIALIZE
   ========================================================= */

loadMenu();

updateCartUI();