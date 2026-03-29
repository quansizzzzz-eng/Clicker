
(function () {
  const currentPage = window.location.pathname.split("/").pop() || "main_page.html";

  const pageOrder = [
    "main_page.html",
    "page_1.html",
    "page_2.html",
    "page_3.html",
    "page_4.html",
    "last_page.html",
  ];

// Функція для навігації між сторінками за допомогою клавіш ← →
  function setupKeyboardNavigation() {
    const index = pageOrder.indexOf(currentPage);
    if (index === -1) return;

    document.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable)
      ) {
        return;
      }

      const step = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = index + step;

      if (nextIndex >= 0 && nextIndex < pageOrder.length) {
        window.location.href = pageOrder[nextIndex];
      }
    });
  }

// Функція ініціалізації квізу для підбору напою на основі вподобань користувача
  function setupQuiz() {
    const quizRoot = document.getElementById("drink-quiz");
    if (!quizRoot) return;

    const sweetInput = document.getElementById("pref-sweet");
    const freshInput = document.getElementById("pref-fresh");
    const funInput = document.getElementById("pref-fun");
    const mixButton = document.getElementById("mix-button");
    const resultBox = document.getElementById("mix-result");
    const resultTitle = document.getElementById("result-title");
    const resultText = document.getElementById("result-text");
    const resultLink = document.getElementById("result-link");
    const lastMix = document.getElementById("last-mix");

    if (
      !sweetInput ||
      !freshInput ||
      !funInput ||
      !mixButton ||
      !resultBox ||
      !resultTitle ||
      !resultText ||
      !resultLink
    ) {
      return;
    }

    
    const drinks = [
      {
        id: "orange",
        title: "Fresh & Natural",
        page: "page_1.html",
        traits: { sweet: 3, fresh: 4, fun: 2 },
        description:
          "Bright and refreshing orange drink with natural sweetness for an energetic day.",
      },
      {
        id: "berry",
        title: "100% Loved",
        page: "page_2.html",
        traits: { sweet: 4, fresh: 2, fun: 3 },
        description:
          "Rich berry blend with a deep, juicy taste for fans of bold flavours.",
      },
      {
        id: "green",
        title: "4 Days 4 Ways",
        page: "page_3.html",
        traits: { sweet: 2, fresh: 5, fun: 4 },
        description:
          "Lively green drink inspired by kiwi and apple for maximum freshness.",
      },
      {
        id: "strawberry",
        title: "Award Winning Tastes",
        page: "page_4.html",
        traits: { sweet: 5, fresh: 3, fun: 4 },
        description:
          "Smooth strawberry drink with classic berry sweetness and aroma.",
      },
    ];

// Функція обчислює найбільш підходящий напій,
// порівнюючи введені користувачем параметри з характеристиками напоїв
    function calculateBestDrink(preferences) {
      let best = null;
      let bestScore = Infinity;
      let reactionEmoji = "✨";

      for (const drink of drinks) {
        let distance = 0;
        for (const key in preferences) {
          const ideal = drink.traits[key] || 0;
          const actual = preferences[key];
          const diff = ideal - actual;
          distance += diff * diff;
        }
        if (distance < bestScore) {
          bestScore = distance;
          best = { drink, score: distance };
        }
      }

      if (bestScore <= 1) {
        reactionEmoji = "🔥";
      } else if (bestScore <= 4) {
        reactionEmoji = "😊";
      } else {
        reactionEmoji = "💡";
      }

      return { ...best, reactionEmoji };
    }

    function showLastMix(saved) {
      if (!lastMix) return;

      try {
        if (!saved) {
          const raw = localStorage.getItem("liveDrinkLastMix");
          if (!raw) {
            lastMix.textContent = "";
            return;
          }
          saved = JSON.parse(raw);
        }
      } catch (e) {
        return;
      }

      if (!saved || !saved.drinkId || !saved.preferences) return;
      const drink = drinks.find((d) => d.id === saved.drinkId);
      if (!drink) return;

      const prefs = saved.preferences;
      lastMix.textContent =
        "Last time you chose \"" +
        drink.title +
        "\" (sweet " +
        prefs.sweet +
        ", fresh " +
        prefs.fresh +
        ", adventurous " +
        prefs.fun +
        ").";
    }

// Функція обробляє натискання кнопки "Mix",
// отримує значення з полів, знаходить результат і відображає його   
    function handleMixClick() {
      const preferences = {
        sweet: Number(sweetInput.value),
        fresh: Number(freshInput.value),
        fun: Number(funInput.value),
      };

      const result = calculateBestDrink(preferences);
      if (!result) return;

      const drink = result.drink;

      resultTitle.textContent = drink.title;
      resultText.textContent = result.reactionEmoji + " " + drink.description;
      resultLink.href = drink.page;
      resultLink.textContent = "Go to \"" + drink.title + "\" drink";
      resultBox.style.display = "block";

      // after short pause automatically open the drink page
      setTimeout(function () {
        window.location.href = drink.page;
      }, 1500);

      const saved = {
        drinkId: drink.id,
        preferences,
      };  

      try {
        localStorage.setItem("liveDrinkLastMix", JSON.stringify(saved));
      } catch (e) {
        // ignore storage errors
      }

      showLastMix(saved);
    }

    mixButton.addEventListener("click", handleMixClick);
    showLastMix();
  }

// Функція налаштовує процес оформлення замовлення:
// відкриття модального вікна, валідацію форми та збереження даних  
  function setupOrderFlow() {
    const orderButtons = document.querySelectorAll("[data-order-drink]");
    const orderModal = document.getElementById("order-modal");
    const orderOverlay = document.getElementById("order-overlay");
    const orderTitle = document.getElementById("order-drink-title");
    const orderDrinkInput = document.getElementById("order-drink-id");
    const orderClose = document.getElementById("order-close");
    const orderForm = document.getElementById("order-form");
    const orderSummary = document.getElementById("order-summary");

    if (
      !orderModal ||
      !orderOverlay ||
      !orderTitle ||
      !orderDrinkInput ||
      !orderClose ||
      !orderForm ||
      !orderSummary
    ) {
      return;
    }

// Функція відкриває модальне вікно замовлення
// та підставляє дані обраного напою    
    function openOrder(drinkId, drinkName) {
      orderDrinkInput.value = drinkId;
      orderTitle.textContent = drinkName || "Live Drink";
      orderSummary.textContent = "";
      orderModal.classList.add("open");
      orderOverlay.classList.add("open");
      document.body.style.overflow = "hidden";
    }

// Функція закриває модальне вікно замовлення    
    function closeOrder() {
      orderModal.classList.remove("open");
      orderOverlay.classList.remove("open");
      document.body.style.overflow = "";
    }

    orderButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const drinkId = btn.getAttribute("data-order-drink");
        const drinkName = btn.getAttribute("data-order-name");
        openOrder(drinkId, drinkName);
      });
    });

    orderOverlay.addEventListener("click", closeOrder);
    orderClose.addEventListener("click", closeOrder);

    orderForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const name = document.getElementById("order-name");
      const email = document.getElementById("order-email");
      const qty = document.getElementById("order-qty");

      if (!name || !email || !qty) return;

      const emailVal = email.value.trim();
      const nameVal = name.value.trim();
      const qtyVal = Number(qty.value) || 1;

      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!pattern.test(emailVal) || !nameVal) {
        orderSummary.textContent =
          "Please enter your name and a valid email.";
        orderSummary.style.color = "#ff4b4b";
        return;
      }

      const order = {
        drinkId: orderDrinkInput.value,
        drinkName: orderTitle.textContent,
        name: nameVal,
        email: emailVal,
        quantity: qtyVal,
        createdAt: new Date().toISOString(),
      };

      try {
        const raw = localStorage.getItem("liveDrinkOrders");
        const list = raw ? JSON.parse(raw) : [];
        list.push(order);
        localStorage.setItem("liveDrinkOrders", JSON.stringify(list));
      } catch (e) {
      }

      orderSummary.textContent =
        "Order created! We will contact " +
        order.email +
        " to confirm your " +
        order.quantity +
        "x " +
        order.drinkName +
        ".";
      orderSummary.style.color = "#3bb54a";

      name.value = "";
      qty.value = "1";
    });
  }

// Функція ініціалізує форму введення email,
// перевіряє коректність і зберігає у localStorage  
  function setupEmailForm() {
    const emailInput = document.getElementById("email-input");
    const emailMessage = document.getElementById("email-message");

    if (!emailInput || !emailMessage) return;

    try {
      const saved = localStorage.getItem("liveDrinkEmail");
      if (saved) {
        emailMessage.textContent = "Welcome back, we remember: " + saved;
        emailMessage.style.color = "#555555";
      }
    } catch (e) {
    }
    
    function handleEmailSubmit() {
      const value = emailInput.value.trim();
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!pattern.test(value)) {
        emailMessage.textContent = "Please enter a valid email address.";
        emailMessage.style.color = "#ff4b4b";
        emailInput.style.borderColor = "#ff4b4b";
        setTimeout(function () {
          emailInput.style.borderColor = "";
        }, 800);
        return;
      }

      emailMessage.textContent =
        "Thank you! We will write to " + value + ".";
      emailMessage.style.color = "#3bb54a";

      try {
        localStorage.setItem("liveDrinkEmail", value);
      } catch (e) {
      }

      emailInput.value = "";
    }

    window.handleEmailSubmit = handleEmailSubmit;
  }

// Функція відображає останні замовлення користувача,
// збережені у localStorage  
  function setupRecentOrders() {
    const listEl = document.getElementById("recent-orders-list");
    const emptyEl = document.getElementById("recent-orders-empty");

    if (!listEl || !emptyEl) return;

    let orders = [];
    try {
      const raw = localStorage.getItem("liveDrinkOrders");
      if (raw) {
        orders = JSON.parse(raw);
      }
    } catch (e) {
      orders = [];
    }

    listEl.innerHTML = "";

    if (!orders || !orders.length) {
      emptyEl.style.display = "block";
      return;
    }

    const last = orders.slice(-3).reverse();
    last.forEach(function (order) {
      const li = document.createElement("li");
      const date = order.createdAt
        ? new Date(order.createdAt)
        : new Date();
      const dateStr = date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
      });

      li.textContent =
        dateStr +
        " – " +
        (order.quantity || 1) +
        "x " +
        (order.drinkName || "Live Drink") +
        " for " +
        (order.name || "guest");
      listEl.appendChild(li);
    });

    emptyEl.style.display = "none";
  }

  setupKeyboardNavigation();
  setupQuiz();
  setupOrderFlow();
  setupEmailForm();
  setupRecentOrders();
})();

