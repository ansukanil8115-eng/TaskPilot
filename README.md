# TaskPilot – Project Management System

## Overview

TaskPilot is a full-stack project management web application that helps teams manage tasks, assign roles, and communicate efficiently. It supports role-based access for Admin, Manager, and Intern.

---

## Technologies Used

* Python, Django, Django REST Framework
* PostgreSQL
* React.js / HTML, CSS, JavaScript
* JWT Authentication

---

## Features

* Role-based authentication (Admin, Manager, Intern)
* Task creation, assignment, and tracking
* Chat system with message history
* Download chat history as PDF
* Dark/Light mode toggle
* Context awareness (last 5 messages)

---

## Setup Instructions

### 1. Clone Repository

git clone https://github.com/ansukanil8115-eng/TaskPilot.git
cd TaskPilot

---

### 2. Backend Setup

cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate

python manage.py runserver

---

### 3. Frontend Setup

cd frontend

npm install

npm run dev

---

## Hugging Face Model Setup

This project does not use any Hugging Face models. The chat functionality is implemented using standard backend logic and database storage.

---

## Screenshots

##login
<img width="1920" height="1080" alt="Screenshot 2026-04-01 224833" src="https://github.com/user-attachments/assets/37f71c86-bd8a-4feb-b73c-95adbd077828" />

##signup
<img width="1920" height="1080" alt="Screenshot 2026-04-01 224900" src="https://github.com/user-attachments/assets/affc5d52-69e1-4b38-9525-3e1a58853188" />

##intern dashboard
<img width="1920" height="1080" alt="Screenshot 2026-04-01 224937" src="https://github.com/user-attachments/assets/86d61721-2b68-4008-8e28-628209d6697e" />

##chatbot
<img width="1920" height="1080" alt="Screenshot 2026-04-01 225046" src="https://github.com/user-attachments/assets/d4f3057a-5fea-4332-bf4a-f185cdb5d0c5" />

##manager dashboard
<img width="1920" height="1080" alt="Screenshot 2026-04-01 225206" src="https://github.com/user-attachments/assets/fe42aad0-d6b2-4c54-bd5d-526614bcf522" />

admin dashboard
<img width="1920" height="1080" alt="Screenshot 2026-04-01 225243" src="https://github.com/user-attachments/assets/d6c6c0cd-5d2f-4392-aeb6-9e9721067bfc" />




---

## Conclusion

TaskPilot improves team productivity by combining task management and communication into a single platform.
