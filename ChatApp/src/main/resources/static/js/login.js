 function togglePass(fieldId) {
        const input = document.getElementById(fieldId);
        const icon = input.nextElementSibling;

        if (input.type === "password") {
          input.type = "text";
          icon.classList.remove("fa-eye");
          icon.classList.add("fa-eye-slash");
        } else {
          input.type = "password";
          icon.classList.remove("fa-eye-slash");
          icon.classList.add("fa-eye");
        }
      }

      document
        .getElementById("loginForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();

          const email = document.getElementById("email").value.trim();
          const password = document.getElementById("password").value;
          const btn = document.querySelector(".btn-primary");
          const msgBox = document.getElementById("msgBox");

          msgBox.style.display = "none";
          msgBox.className = "alert";
          btn.disabled = true;
          btn.innerText = "Logging in...";

          try {
            const response = await fetch(
              "http://localhost:8081/chatapp/validateuser",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
              }
            );

            if (response.ok) {
              const data = await response.json();

              localStorage.setItem("token", data.token);
              localStorage.setItem("email", data.user.email); 
              localStorage.setItem("username", data.user.name);

              msgBox.className = "alert success";
              msgBox.innerText = "Login successful! Redirecting...";
              msgBox.style.display = "block";

              setTimeout(() => {
                window.location.href = "/chat.html";
              }, 1000);
            } else {
              const errorData = await response.json();
              throw new Error(errorData.message || "Invalid credentials");
            }
          } catch (error) {
            console.error("Login Error:", error);
            msgBox.className = "alert error";
            msgBox.innerText = error.message;
            msgBox.style.display = "block";
          } finally {
            btn.disabled = false;
            if (btn.innerText !== "Login successful! Redirecting...")
              btn.innerText = "Log In";
          }
        });