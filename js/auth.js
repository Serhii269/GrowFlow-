async function checkAuth() {
  try {
    const res = await fetch("php/check-auth.php");
    const data = await res.json();

    if (!data.logged_in) {
      window.location.href = "register.html";
      return null;
    }

    const nameEl = document.querySelector(".user-name");
    const avatarEl = document.querySelector(".user-avatar span");
    const statusEl = document.querySelector(".user-status");

    if (nameEl) nameEl.textContent = data.name;
    if (statusEl) statusEl.textContent = "Premium";
    if (avatarEl) {
      const initials = data.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      avatarEl.textContent = initials;
    }

    return data;
  } catch (err) {
    window.location.href = "register.html";
    return null;
  }
}

setTimeout(() => {
  const pl = document.getElementById("app-preloader");
  if (pl) {
    pl.style.opacity = "0";
    pl.style.transition = "opacity 0.4s ease";
    setTimeout(() => (pl.style.display = "none"), 400);
  }
}, 800);
