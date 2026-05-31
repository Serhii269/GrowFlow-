document.addEventListener("DOMContentLoaded", async () => {
  const user = await checkAuth();
  if (!user) return;

  document.getElementById("profile-name").textContent = user.name;
  document.getElementById("profile-email").textContent = user.email;
  document.getElementById("profile-initials").textContent = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
});

document
  .getElementById("password-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const error = document.getElementById("password-error");
    const success = document.getElementById("password-success");
    error.textContent = "";
    success.textContent = "";

    const current = document.getElementById("current-password").value;
    const newPass = document.getElementById("new-password").value;
    const confirm = document.getElementById("confirm-password").value;

    if (newPass !== confirm) {
      error.textContent = "Passwords do not match";
      return;
    }

    if (newPass.length < 6) {
      error.textContent = "Password must be at least 6 characters";
      return;
    }

    try {
      const res = await fetch("php/change-password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, newPass }),
      });
      const data = await res.json();
      if (data.error) {
        error.textContent = data.error;
      } else {
        success.textContent = "Password updated successfully";
        document.getElementById("password-form").reset();
      }
    } catch (e) {
      error.textContent = "Something went wrong";
    }
  });
