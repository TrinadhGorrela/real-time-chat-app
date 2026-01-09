# Real-Time Chat Application 

Full-stack real-time messaging app built during B.Tech project.

##  Features
- Real-time one-to-one chat (WebSocket/STOMP)
- JWT Authentication & Authorization
- Message persistence (MySQL)
- WhatsApp-style UI (HTML/CSS/JS)
- Notification sounds & status (sent/delivered)

##  Tech Stack
Spring Boot | WebSocket | JWT | MySQL | Maven | HTML/CSS/JS


##  Quick Start
```bash
mvn spring-boot:run

Home: http://localhost:8081/

Register: http://localhost:8081/register

Login: http://localhost:8081/login

Chat: http://localhost:8081/chat

ChatApp/
├── src/main/java/com/chatapp/
│   ├── config/
│   ├── controller/
│   ├── entity/
│   ├── repository/
│   ├── security/
│   ├── service/
│   └── ChatApplication.java
├── src/main/resources/
│   ├── application.properties
│   └── static/
│       ├── audio/
│       ├── css/
│       ├── image/
│       ├── js/
│       ├── admin.html
│       ├── chat.html
│       ├── index.html
│       ├── login.html
│       └── register.html


## API Endpoints

| Method | Endpoint  | Description | Authentication |
| ------ | --------- | ----------- | -------------- |
| POST   | /register | Create user | None           |
| POST   | /login    | JWT token   | None           |
| GET    | /chat     | WebSocket   | JWT            |