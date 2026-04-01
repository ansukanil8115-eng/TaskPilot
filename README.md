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

(Add screenshots here: login, dashboard, task management, chat system)

---

## Conclusion

TaskPilot improves team productivity by combining task management and communication into a single platform.
