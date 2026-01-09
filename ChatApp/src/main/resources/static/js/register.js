      function togglePass(fieldId) {
        const input = document.getElementById(fieldId);
        input.type = input.type === "password" ? "text" : "password";
      }

      document
        .getElementById("registerForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const firstName = document.getElementById("firstName").value.trim();
          const lastName = document.getElementById("lastName").value.trim();
          const email = document.getElementById("email").value.trim();
          const password = document.getElementById("password").value;
          const confirmPass = document.getElementById("confirmPassword").value;
          const fullName = firstName + " " + lastName;

          const msgBox = document.getElementById("msgBox");
          msgBox.style.display = "none";

          if (password !== confirmPass) {
            showError("Passwords do not match!");
            return;
          }

          const btn = document.querySelector(".btn-primary");
          btn.disabled = true;
          btn.innerText = "Creating Account...";

          try {
            const response = await fetch(
              "http://localhost:8081/chatapp/adduser",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: fullName, email, password }),
              }
            );

            if (response.ok) {
              const newUser = await response.json();

              msgBox.className = "alert success";
              msgBox.innerText = "Account Created! Entering Chat...";
              msgBox.style.display = "block";

              localStorage.setItem("username", newUser.name);
              localStorage.setItem("email", newUser.email);
              setTimeout(() => {
                window.location.href = "/chat.html";
              }, 1000);
            }
            else {
              const data = await response.json();
              throw new Error(data.message || "Registration failed");
            }
          } catch (error) {
            showError(error.message);
          } finally {
            btn.disabled = false;
            if (btn.innerText !== "Creating Account...")
              btn.innerText = "Sign Up";
          }
        });

      function showError(msg) {
        const box = document.getElementById("msgBox");
        box.className = "alert error";
        box.innerText = msg;
        box.style.display = "block";
      }