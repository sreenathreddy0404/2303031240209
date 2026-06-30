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
      "created_at": "2024-06-30"
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

---

# Stage 2

## Database Choice – MongoDB (NoSQL)

I'm going to use mongodb for this system.

Mongodb stores each notification as a simple document. and also it is easy to scale the mongodb documents as the users grows. Mongodb has flexible schema so in future if i need to change the schema this is the best choice. and also Notification system doesn't need complex joins.
by considering all of this mongodb is the best choice.
---

## DB Schema (Document Structure)

In MongoDB, we have a `notifications` collection. Each document looks like this:

```json
{
  "_id": "ObjectId()",
  "user_id": "user_123",
  "title": "New message",
  "message": "You have a new message from Arjun.",
  "type": "message",
  "is_read": false,
  "created_at": "2024-06-30"
}
```

---

## Problems as Data Volume Grows

1. **Slow queries** — finding all notifications of a user will be slow without proper indexes.
2. **Collection too large** — By storing all the notifications including very old notifications in the same collection will make the collection too large and it will take up lot of storage.
3. **High read load** — if many users fetch notifications at the same time, the DB gets Overloaded.
---

## How to Solve Them

1. **Add indexes** — index on `user_id` and `created_at` to keep queries fast.
2. **TTL index** — MongoDB has a built-in TTL (Time To Live) feature to auto-delete old notifications after e.g. 90 days.
3. **Cache unread count** — store the unread count in Redis so we don't query MongoDB on every page load.

---

## MongoDB Queries

### Get all notifications for a user
```js
db.notifications.find(
  { user_id: "user_123" }
).sort({ created_at: -1 })
```

### Mark a notification as read
```js
db.notifications.updateOne(
  { _id: ObjectId("notif_id"), user_id: "user_123" },
  { $set: { is_read: true } }
)
```

### Mark all notifications as read
```js
db.notifications.updateMany(
  { user_id: "user_123", is_read: false },
  { $set: { is_read: true } }
)
```

### Delete a notification
```js
db.notifications.deleteOne(
  { _id: ObjectId("notif_id"), user_id: "user_123" }
)
```

### Get unread count
```js
db.notifications.countDocuments(
  { user_id: "user_123", is_read: false }
)
```

### Index to speed up queries
```js
db.notifications.createIndex({ user_id: 1, created_at: -1 })
```

### TTL index to auto-delete old notifications after 90 days
```js
db.notifications.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 7776000 }
)
```
