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

mongodb stores each notification as a simple document. and also it is easy to scale the mongodb documents as the users grows. Mongodb has flexible schema so in future if i need to change the schema this is the best choice. and also Notification system doesn't need complex joins.
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


# Stage 3

## The Query

```js
db.notifications.find(
  { studentID: 1042, isRead: false }
).sort({ createdAt: -1 })
```

## Is this query correct?

yeah the query is correct. it finds all unread notifications for student 1042 and sorts by latest first.

## Why is it slow?

the problem is `.find()` without an index — mongodb will scan every single document in the collection with 5,000,000 documents that is very slow.

## What i would change

add index on `studentID` and `createdAt` so mongodb can directly go to that student's data.

```js
db.notifications.find(
  { studentID: 1042, isRead: false },
).sort({ createdAt: -1 })
```

```js
db.notifications.createIndex({ studentID: 1, createdAt: -1 })
```

## Computation cost

without index — mongodb scans all 5 million documents. O(n) cost. very slow.

with index — mongodb directly jumps to student 1042 documents. much faster, close to O(log n).

## Another dev says: add index on every field

this is not good advice. adding index on every field will:
- make insert and update slow because every index needs to update
- takes up more disk space
- mongodb has to maintain all those indexes even for fields we never query on

only add index on fields we actually filter or sort on. adding everywhere creates more problems than it solves.

## Query — students who got placement notification in last 7 days

```js
db.notifications.distinct("studentID", {
  notificationType: "Placement",
  createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
})
```

this gives list of unique studentIDs who got atleast one placement notification in last 7 days. used `.distinct()` so same student doesnt repeat.

---

# Stage 4

## The Problem

every time a student loads a page, it hits the db to fetch notifications. with 50,000 students doing this all the time, db is getting too many requests and slowing down for everyone.

## Solutions

### 1. Cache the notifications (Redis)

we use redis for cache to store frequently accessed notifications. for example if a student loads the page and we already have his notifications in redis cache, we serve it from cache otherwise we query the db and store it in cache for 60 seconds.

**tradeoffs:**
- good — we avoid hitting db every time.
- bad — students will see new notification once in 60 seconds. but it's not a big deal.

---

### 2. Pagination — dont load everything at once

implementing pagination instead of loading all documents at once, we load 10 to 20 documents per page and if user wants to see more we load next page. this way we avoid sending large data to client and also reduce the load on database.

```js
db.notifications.find({ studentID: 1042 })
  .sort({ createdAt: -1 })
  .skip(0)
  .limit(10)
```

**tradeoffs:**
- good — less data per request, db does less work, faster response
- bad — need to handle pagination logic in frontend too. little more work but totally worth it.


### 3. Add index on studentID

this one is basic but very impactful. without index mongodb scans all documents. with index it directly finds that student's data.

```js
db.notifications.createIndex({ studentID: 1, createdAt: -1 })
```

**tradeoffs:**
- good — queries become much faster, basically free performance improvement
- bad — index takes extra storage and slows down writes slightly. but for a read heavy system like notifications this is always worth it.

---

## What i would do

first add the index. then add pagination so we dont send all notifications at once. then add redis cache to avoid repeated db hits. this order gives max performance with least effort.

---

# Stage 5

## Proposed Implementation (Original Pseudocode)

Here is the initial design proposed for sending notifications to all students:

```python
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message) # calls Email API
        save_to_db(student_id, message) # DB insert
        push_to_app(student_id, message) # real-time push
```

### What this original code does:
It takes a list of student IDs and loops through them one by one. In every iteration, it makes an external network call to send an email, performs a database insertion, and attempts to push the notification to the app.

---

## Shortcomings in current code
1. **Very Slow:** Loop runs one-by-one. 50k emails/db writes sequentially will take hours and crash the server.
2. **No Error Handling:** If `send_email` fails midway (like for the 200 students), the whole loop stops. Remaining students get nothing.
3. **External API dependancy:** Email api is slow. Blocking db writes and app pushes for email to finish is bad.

## Should saving to DB and sending email happen together?
No. DB insert is fast, email is slow. If we do both together, any email API delay will lock the DB connections. We should write to DB first, then handle emails separately in background.

## Redesign for Speed and Reliability
We should use **Bulk DB Insert** and a **Task Queue** (like BullMQ / Redis).

1. **Bulk insert** notifications to MongoDB in a single query.
2. **Push jobs to Queue** for email and app push. Queue workers will process them in parallel and auto-retry if failed.
