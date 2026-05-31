document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("php/check-auth.php");
    const data = await res.json();

    if (data.logged_in) {
      const getStarted = document.querySelector("nav ul li:last-child a");
      if (getStarted) {
        getStarted.textContent = data.name;
        getStarted.href = "dashboard.html";
      }
    }
  } catch (e) {}
});
