# i-Tours API - Frontend Integration Guide

## Base URL
```
http://localhost:3000
```

---

## Authentication

### How Authentication Works

1. User signs up or signs in
2. On successful sign in, backend returns a JWT `accessToken`
3. Store this token securely (localStorage or sessionStorage)
4. Include the token in all subsequent API requests in the `Authorization` header

### Token Usage

For protected endpoints, include the token in the request header:
```
Authorization: Bearer <your_access_token>
```

Example:
```javascript
fetch('http://localhost:3000/users', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'Content-Type': 'application/json'
  }
})
```

### Token Expiration
- Tokens expire after **24 hours**
- When expired, redirect user to sign in again

---

## API Endpoints

### User Endpoints

#### 1. Sign Up (Register)
```
POST /users/signup
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword123",
  "preferences": {}
}
```

**Success Response (201):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "preferences": {}
}
```

**Error Response (409 - Conflict):**
```json
{
  "statusCode": 409,
  "message": "This email address is already registered. Please use a different email or login to your existing account.",
  "error": "Conflict"
}
```

---

#### 2. Sign In (Login)
```
POST /users/signin
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword123"
}
```

**Success Response (201):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "preferences": {}
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

*User not found (401):*
```json
{
  "statusCode": 401,
  "message": "User not found. Please check your email or create a new account.",
  "error": "Unauthorized"
}
```

*Wrong password (401):*
```json
{
  "statusCode": 401,
  "message": "Incorrect password. Please try again or reset your password.",
  "error": "Unauthorized"
}
```

---

#### 3. Get All Users
```
GET /users
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "preferences": {}
  }
]
```

---

#### 4. Get User by ID
```
GET /users/:id
```

**Success Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "preferences": {}
}
```

**Error Response (404):**
```json
{
  "statusCode": 404,
  "message": "User not found. The account may have been deleted or does not exist.",
  "error": "Not Found"
}
```

---

### Trip Plan Endpoints

#### 1. Create Trip Plan
```
POST /trip-plans
```

**Request Body:**
```json
{
  "name": "My Awesome Trip",
  "startDate": "2025-12-20",
  "endDate": "2025-12-30",
  "duration": 10,
  "isArchived": false
}
```

**Error Response (409):**
```json
{
  "statusCode": 409,
  "message": "A trip plan with this name already exists. Please choose a different name for your trip.",
  "error": "Conflict"
}
```

#### 2. Get All Trip Plans
```
GET /trip-plans
```

#### 3. Get Trip Plan by ID
```
GET /trip-plans/:id
```

**Error Response (404):**
```json
{
  "statusCode": 404,
  "message": "Trip plan not found. It may have been deleted or never existed.",
  "error": "Not Found"
}
```

---

### Destination Endpoints

#### 1. Create Destination
```
POST /destinations
```

**Request Body:**
```json
{
  "name": "Paris",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "description": "The capital of France",
  "type": "City"
}
```

**Error Response (409):**
```json
{
  "statusCode": 409,
  "message": "This destination has already been added. You can view it in the destinations list.",
  "error": "Conflict"
}
```

#### 2. Get All Destinations
```
GET /destinations
```

#### 3. Get Destination by ID
```
GET /destinations/:id
```

**Error Response (404):**
```json
{
  "statusCode": 404,
  "message": "Destination not found. Please check the destination list and try again.",
  "error": "Not Found"
}
```

---

### Alert Endpoints

#### 1. Create Alert
```
POST /alerts
```

**Request Body:**
```json
{
  "type": "Weather",
  "message": "Heavy rain expected",
  "severity": "High",
  "timestamp": "2025-12-11T12:00:00Z"
}
```

#### 2. Get All Alerts
```
GET /alerts
```

#### 3. Get Alert by ID
```
GET /alerts/:id
```

**Error Response (404):**
```json
{
  "statusCode": 404,
  "message": "Alert not found. It may have expired or been removed from the system.",
  "error": "Not Found"
}
```

---

### Hotel Endpoints

#### 1. Create Hotel
```
POST /hotels
```

**Request Body:**
```json
{
  "name": "Grand Hotel",
  "roomRent": 250.50,
  "rating": 4.5,
  "contactDetails": "123-456-7890"
}
```

**Error Response (409):**
```json
{
  "statusCode": 409,
  "message": "This hotel is already listed in our system. Please check the hotels list.",
  "error": "Conflict"
}
```

#### 2. Get All Hotels
```
GET /hotels
```

#### 3. Get Hotel by ID
```
GET /hotels/:id
```

**Error Response (404):**
```json
{
  "statusCode": 404,
  "message": "Hotel not found. It may no longer be available or has been removed.",
  "error": "Not Found"
}
```

---

## Frontend Implementation Example (React)

### Auth Context Example
```javascript
// AuthContext.js
import { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const signin = async (email, password) => {
    const response = await fetch('http://localhost:3000/users/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message);
    }
    
    setUser(data.user);
    setToken(data.accessToken);
    localStorage.setItem('token', data.accessToken);
    return data;
  };

  const signout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, signin, signout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### API Service Example
```javascript
// api.js
const BASE_URL = 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const api = {
  get: async (endpoint) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },
  
  post: async (endpoint, data) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  }
};
```

---

## Error Handling

All error responses follow this format:
```json
{
  "statusCode": 400,
  "message": "Human readable error message",
  "error": "Error Type"
}
```

### Common Status Codes:
- `200` - Success
- `201` - Created successfully
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials or token)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

---

## Questions?

Contact the backend team for any API-related questions.
