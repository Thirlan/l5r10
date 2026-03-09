# L5R Tactical RPG - API Endpoints

Complete documentation of available API endpoints for the L5R Tactical RPG server.

## Base URL

- **Local Development:** `http://localhost:8787`
- **Production:** Update after deployment

## Health Check Endpoints

### GET `/api/ping`
Basic connectivity test.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-09T12:00:00.000Z",
  "message": "L5R Tactical RPG API is running"
}
```

### GET `/api/health`
Detailed health and version information.

**Response:**
```json
{
  "healthy": true,
  "version": "0.1.0",
  "timestamp": "2024-03-09T12:00:00.000Z"
}
```

---

## User Endpoints

### POST `/api/users`
Create a new user account.

**Request:**
```json
{
  "id": "user-uuid",
  "email": "player@example.com",
  "username": "player_name"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "userId": "user-uuid"
}
```

### GET `/api/users/:id`
Get user details by ID.

**Response (200):**
```json
{
  "id": "user-uuid",
  "email": "player@example.com",
  "username": "player_name"
}
```

### GET `/api/users/email/:email`
Get user details by email address.

**Response (200):**
```json
{
  "id": "user-uuid",
  "email": "player@example.com",
  "username": "player_name"
}
```

---

## Campaign Endpoints

### POST `/api/campaigns`
Create a new campaign.

**Request:**
```json
{
  "id": "campaign-uuid",
  "name": "The Scorpion Rises",
  "gmId": "gm-user-id",
  "description": "A tale of political intrigue in the courts of Rokugan"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Campaign created successfully",
  "campaignId": "campaign-uuid"
}
```

### GET `/api/campaigns/:id`
Get campaign details by ID.

**Response (200):**
```json
{
  "id": "campaign-uuid",
  "name": "The Scorpion Rises",
  "gm_id": "gm-user-id",
  "description": "A tale of political intrigue in the courts of Rokugan",
  "status": "active",
  "created_at": "2024-03-09T12:00:00.000Z",
  "updated_at": "2024-03-09T12:00:00.000Z"
}
```

### GET `/api/campaigns/gm/:gmId`
Get all campaigns run by a specific Game Master.

**Response (200):**
```json
{
  "campaigns": [
    {
      "id": "campaign-uuid",
      "name": "The Scorpion Rises",
      "gm_id": "gm-user-id",
      "description": "...",
      "status": "active",
      "created_at": "2024-03-09T12:00:00.000Z",
      "updated_at": "2024-03-09T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

## Character Endpoints

### POST `/api/characters`
Create a new player character.

**Request:**
```json
{
  "id": "character-uuid",
  "name": "Matsu Akiko",
  "playerId": "player-user-id",
  "campaignId": "campaign-uuid",
  "clanId": "lion",
  "schoolId": "matsu-berserker",
  "attributes": {
    "air": 2,
    "earth": 3,
    "fire": 4,
    "water": 2,
    "void": 2
  },
  "skills": {
    "Kenjutsu": 3,
    "Battle": 2,
    "Horsemanship": 2
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Character created successfully",
  "characterId": "character-uuid"
}
```

### GET `/api/characters/player/:playerId`
Get all characters owned by a player.

**Response (200):**
```json
{
  "characters": [
    {
      "id": "character-uuid",
      "name": "Matsu Akiko",
      "player_id": "player-user-id",
      "campaign_id": "campaign-uuid",
      "clan_id": "lion",
      "school_id": "matsu-berserker",
      "honor": 0,
      "status": "active",
      "attributes": "{\"air\": 2, \"earth\": 3, ...}",
      "skills": "{\"Kenjutsu\": 3, ...}",
      "created_at": "2024-03-09T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

### GET `/api/characters/campaign/:campaignId`
Get all characters participating in a campaign.

**Response (200):**
```json
{
  "characters": [
    {
      "id": "character-uuid",
      "name": "Matsu Akiko",
      "player_id": "player-user-id",
      "campaign_id": "campaign-uuid",
      ...
    }
  ],
  "count": 5
}
```

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "error": "Missing required fields: id, email, username"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create user",
  "details": "..."
}
```

---

## CORS Support

All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

Send an `OPTIONS` request before making requests from a browser.

---

## Testing Endpoints

### Create a User
```bash
curl -X POST http://localhost:8787/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "id": "user1",
    "email": "player1@example.com",
    "username": "player1"
  }'
```

### Get a User
```bash
curl http://localhost:8787/api/users/user1
```

### Create a Campaign
```bash
curl -X POST http://localhost:8787/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "id": "campaign1",
    "name": "First Campaign",
    "gmId": "gm1",
    "description": "Test campaign"
  }'
```

### Create a Character
```bash
curl -X POST http://localhost:8787/api/characters \
  -H "Content-Type: application/json" \
  -d '{
    "id": "char1",
    "name": "Test Character",
    "playerId": "user1",
    "campaignId": "campaign1",
    "clanId": "lion",
    "schoolId": "bushi",
    "attributes": {"air": 2, "earth": 3, "fire": 2, "water": 2, "void": 2},
    "skills": {"Kenjutsu": 2, "Battle": 1}
  }'
```

---

## Coming Soon

- Battle/encounter endpoints
- Combat log endpoints
- Character advancement endpoints
- Campaign membership management
- Authentication and authorization
- Update/Delete operations
