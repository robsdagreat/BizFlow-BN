# Manual Verification Steps

1.  **Start Server & Monitor Logs**:
    In one terminal, run:
    ```bash
    npm run start:dev
    ```

2.  **Register a User** (New Terminal):
    ```bash
    curl -X POST http://localhost:3000/auth/register \
      -H "Content-Type: application/json" \
      -d '{"email": "manual_verify@example.com", "password": "password123", "fullName": "Manual User", "phone": "1234567890"}'
    ```

3.  **Get Verification Link**:
    Check the terminal running the server. You should see a log like:
    `[DEV ONLY] Verification Link: http://localhost:3000/auth/verify-email?token=...`
    
    Copy that link (or just the token).

4.  **Verify Email**:
    Open the link in your browser OR run:
    ```bash
    curl "http://localhost:3000/auth/verify-email?token=PASTE_TOKEN_HERE"
    ```

5.  **Login**:
    ```bash
    curl -X POST http://localhost:3000/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email": "manual_verify@example.com", "password": "password123"}'
    ```
    Copy the `access_token`.

6.  **Create Business**:
    ```bash
    curl -X POST http://localhost:3000/businesses \
      -H "Authorization: Bearer PASTE_ACCESS_TOKEN_HERE" \
      -H "Content-Type: application/json" \
      -d '{"name": "Verified Biz", "description": "Works!", "category": "Tech", "city": "NYC"}'
    ```
