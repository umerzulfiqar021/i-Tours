# i-Tours Project Structure & NestJS Guide

This document explains the purpose of each key file in your `i-Tours` project and how NestJS works under the hood. It is designed to help you understand the flow of your application.

## 1. Overview of NestJS Architecture

NestJS uses a modular architecture. The main building blocks you will see repeatedly are:
- **Modules (`*.module.ts`)**: Used to organize code. Every application has at least one root module (`AppModule`).
- **Controllers (`*.controller.ts`)**: Handle incoming HTTP requests and send responses back to the client.
- **Services (`*.service.ts`)**: Handle business logic (e.g., calculations, database interactions).
- **Entities (`*.entity.ts`)**: Define the structure of your database tables.
- **DTOs (`*.dto.ts`)**: Data Transfer Objects. They define the shape of data being sent over the network.

---

## 2. Core Files Explanation

### `src/main.ts`
**What it is:** The entry point of your application.
**How it works:**
- It uses `NestFactory.create(AppModule)` to create an instance of your NestJS application.
- It sets up global settings, like `ValidationPipe` (which ensures data sent to your API is correct).
- Finally, it starts the HTTP server listening on port 3000 (or the port in your environment variables).
**Analogy:** This is the key ignition that starts the engine of your car.

### `src/app.module.ts`
**What it is:** The root module of the application.
**How it works:**
- It bundles everything together.
- It imports all other feature modules (like `UserModule`, `TripPlanModule`, `AlertModule`) so the application knows they exist.
- It sets up the database connection using `TypeOrmModule` and `ConfigModule`.
**Analogy:** This is the motherboard connecting all the components (CPU, RAM, Hard Drive) so they can work together.

### `src/app.controller.ts`
**What it is:** A basic controller for the root route (`/`).
**How it works:**
- It has a method `@Get() getHello()` which maps to a GET request to `http://localhost:3000/`.
- It doesn't do the logic itself; it calls `this.appService.getHello()`.
**Code Snippet:**
```typescript
@Get() 
getHello(): string {
  return this.appService.getHello(); 
}
```

### `src/app.service.ts`
**What it is:** A basic service containing business logic for the AppController.
**How it works:**
- It contains the `getHello()` function that returns the string "Hello World!".
- It is "injected" into the `AppController` so the controller can use it.

---

## 3. Feature Modules (Example: User Module)

Your project is divided into "features" inside `src/modules/`. Let's look at the **User** feature to understand the pattern.

### `src/modules/user/user.module.ts`
**What it is:** The module file that isolates the User feature.
**How it works:**
- It groups the `UserController` and `UserService` together.
- It imports `TypeOrmModule.forFeature([User])` to allow this module to query the User table in the database.
- It configures `JwtModule` for handling authentication.

### `src/modules/user/user.controller.ts`
**What it is:** The interface for User-related API endpoints.
**How it works:**
- Use `@Controller('users')` to group routes under `/users`.
- Defines endpoints like:
  - `@Post('signup')`: Handles user registration.
  - `@Post('signin')`: Handles user login.
- It receives data from the user (via `CreateUserDto`) and passes it to `UserService`.

### `src/modules/user/user.service.ts`
**What it is:** The generic "worker" for user operations.
**How it works:**
- It interacts with the database. For example, `initiateSignup` checks if a user exists and then sends an OTP.
- It uses `this.userRepository` to find, save, or update users in the database.
- It performs logic like password hashing or OTP generation.

### `src/modules/user/dto/create-user.dto.ts`
**What it is:** A Data Transfer Object.
**How it works:**
- It's a simple class that defines what data is expected when creating a user (e.g., `email`, `password`, `firstName`).
- It uses decorators (like `@IsEmail()`, `@IsString()`) to validate the input automatically.

---

## 4. Database Files

### `src/config/database.config.ts`
**What it is:** Configuration for connecting to the database.
**How it works:**
- It reads environment variables (like `DB_HOST`, `DB_PASSWORD`) to set up the connection securely without hardcoding passwords.

### `src/database/entities/User.entity.ts`
**What it is:** Represents the `User` table in your database.
**How it works:**
- `@Entity()` tells TypeORM this class is a database table.
- `@Column()` defines columns like `email`, `password`, `firstName`.
- `@OneToMany` defines relationships, such as one user having many Trip Plans.

---

## 5. Summary of Request Flow

When a user tries to sign up, here is the journey the data takes:

1.  **Request:** User sends a POST request to `http://localhost:3000/users/signup` with their data.
2.  **Validation:** NestJS checks the data against `CreateUserDto` rules.
3.  **Controller:** `UserController` receives the request at the `signup` method.
4.  **Service:** The controller calls `userService.initiateSignup()`.
5.  **Database:** The service checks the database (via `User.entity.ts`) to see if the user already exists.
6.  **Response:** The service returns a success message, which the Controller sends back to the user.
