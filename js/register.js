function switchTab(tab) {
  document
    .getElementById("form-register")
    .classList.toggle("hidden", tab !== "register");
  document
    .getElementById("form-login")
    .classList.toggle("hidden", tab !== "login");
  document
    .getElementById("tab-register")
    .classList.toggle("active", tab === "register");
  document
    .getElementById("tab-login")
    .classList.toggle("active", tab === "login");
}

document
  .getElementById("tab-register")
  .addEventListener("click", () => switchTab("register"));
document
  .getElementById("tab-login")
  .addEventListener("click", () => switchTab("login"));
document.getElementById("go-login").addEventListener("click", (e) => {
  e.preventDefault();
  switchTab("login");
});
document.getElementById("go-register").addEventListener("click", (e) => {
  e.preventDefault();
  switchTab("register");
});

document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("submit-btn");
    const error = document.getElementById("form-error");
    error.textContent = "";
    btn.textContent = "Creating account...";
    btn.disabled = true;

    try {
      const res = await fetch("php/register.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: document.getElementById("reg-name").value,
          email: document.getElementById("reg-email").value,
          password: document.getElementById("reg-password").value,
        }),
      });

      const data = await res.json();

      if (data.error) {
        error.textContent = data.error;
        btn.textContent = "Create Account";
        btn.disabled = false;
      } else {
        window.location.href = "dashboard.html";
      }
    } catch (err) {
      error.textContent = "Something went wrong. Try again.";
      btn.textContent = "Create Account";
      btn.disabled = false;
    }
  });

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("login-btn");
  const error = document.getElementById("login-error");
  error.textContent = "";
  btn.textContent = "Logging in...";
  btn.disabled = true;

  try {
    const res = await fetch("php/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value,
      }),
    });

    const data = await res.json();

    if (data.error) {
      error.textContent = data.error;
      btn.textContent = "Log in";
      btn.disabled = false;
    } else {
      window.location.href = "dashboard.html";
    }
  } catch (err) {
    error.textContent = "Something went wrong. Try again.";
    btn.textContent = "Log in";
    btn.disabled = false;
  }
});
