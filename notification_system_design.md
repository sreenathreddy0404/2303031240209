# Stage 1

## Notification System – REST API Design

### Core Actions the Platform Should Support

- Get all notifications for a logged-in user
- Mark a notification as read
- Mark all notifications as read
- Delete a notification
- Get unread notification count

---

### API Endpoints

#### 1. Get All Notifications

**GET** `/api/notifications`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "New message",
      "message": "You have a new message from Arjun.",
      "type": "message",
      "is_read": false,
    },
    ...
  ],
  "total": 5,
  "unread_count": 2
}
```

---

#### 2. Mark a Notification as Read

**PATCH** `/api/notifications/:id/read`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read.",
}
```

---

#### 3. Mark All Notifications as Read

**PATCH** `/api/notifications/read-all`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read."
}
```

---

#### 4. Delete a Notification

**DELETE** `/api/notifications/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted."
}
```

---

#### 5. Get Unread Count

**GET** `/api/notifications/unread-count`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "unread_count": 2
}
```
---

### Notification JSON Schema (Common Fields)

| Field        | Type    | Description                          |
|--------------|---------|--------------------------------------|
| id           | string  | Unique ID of the notification        |
| title        | string  | Short heading                        |
| message      | string  | Full notification text               |
| type         | string  | Category (e.g., message, order, alert) |
| is_read      | boolean | Whether the user has read it         |
