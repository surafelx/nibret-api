# Nibret Express API Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd nibret-express-api
npm install
```

### 2. Set up MongoDB

#### Option A: Local MongoDB
```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Or start manually
mongod --config /usr/local/etc/mongod.conf
```

#### Option B: Docker MongoDB
```bash
# Run MongoDB in Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Update .env file with Docker connection
MONGODB_URI=mongodb://admin:password@localhost:27017/nibret_db?authSource=admin
```

#### Option C: MongoDB Atlas (Cloud)
1. Create account at https://cloud.mongodb.com
2. Create a cluster
3. Get connection string
4. Update `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nibret_db
```

### 3. Environment Setup
```bash
# Copy environment file
cp .env.example .env

# Edit .env file with your settings
nano .env
```

### 4. Seed Database (Optional)
```bash
# Add sample data
npm run seed
```

### 5. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🧪 Testing Authentication

### Test with curl:
```bash
# Health check
curl http://localhost:3000/health

# Admin login
curl -X POST http://localhost:3000/accounts/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"0965789832","password":"nibretadmin"}'

# User registration
curl -X POST http://localhost:3000/accounts/registration \
  -H "Content-Type: application/json" \
  -d '{
    "first_name":"John",
    "last_name":"Doe", 
    "email":"john@example.com",
    "phone":"0911234567",
    "password":"password123"
  }'
```

### Test with Node.js script:
```bash
# Install node-fetch for testing
npm install node-fetch

# Run test script
node test-auth.js
```

## 🔧 Frontend Integration

### 1. Update Frontend API Base URL
The frontend is already configured to use `http://localhost:3000`

### 2. Test Authentication Flow
1. Start Express backend: `npm run dev`
2. Start frontend: `cd ../nibret-home-finder-ethiopia && npm run dev`
3. Visit http://localhost:5173
4. Try to search or click properties (should show auth modal)
5. Login with: `0965789832` / `nibretadmin`
6. Verify full access is granted

## 📊 API Endpoints

### Authentication
- `POST /accounts/registration` - Register new user
- `POST /accounts/login/` - Login user
- `GET /accounts/users/me` - Get current user (protected)
- `GET /accounts/users` - Get all users (admin only)

### Properties
- `GET /properties` - Get all properties
- `POST /properties/list` - Get properties (with credentials)
- `POST /properties` - Create property (protected)
- `GET /properties/:id` - Get single property

### CRM
- `GET /customers` - Get customers (admin only)
- `POST /customers/leads` - Create lead (public)
- `GET /customers/leads` - Get leads (admin only)

## 🔐 Default Credentials

### Admin Account
- **Username**: `0965789832`
- **Password**: `nibretadmin`

### Test User (after registration)
- **Email**: Any valid email
- **Password**: Minimum 6 characters

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log

# Test connection
mongo --eval "db.adminCommand('ismaster')"
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### CORS Issues
The server is configured to accept requests from `http://localhost:5173` (Vite dev server)

### JWT Token Issues
- Tokens expire after 24 hours by default
- Check browser localStorage for stored tokens
- Clear localStorage to reset authentication state

## 📝 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/nibret_db

# JWT
JWT_SECRET=nibret-super-secret-jwt-key-2024
JWT_EXPIRES_IN=24h

# Frontend
FRONTEND_URL=http://localhost:5173

# Admin
ADMIN_USERNAME=0965789832
ADMIN_PASSWORD=nibretadmin
```

## 🚀 Production Deployment

### 1. Environment Setup
- Set `NODE_ENV=production`
- Use strong JWT secret
- Use production MongoDB instance
- Set proper CORS origins

### 2. Process Management
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start src/app.js --name nibret-api

# Monitor
pm2 monit

# Logs
pm2 logs nibret-api
```

### 3. Nginx Configuration
```nginx
server {
    listen 80;
    server_name api.nibret.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## ✅ Success Indicators

- ✅ Server starts without errors
- ✅ MongoDB connection established
- ✅ Health endpoint returns 200
- ✅ Admin login returns JWT token
- ✅ Protected endpoints require authentication
- ✅ Frontend can authenticate users
- ✅ User data persists in database

## 📞 Support

If you encounter issues:
1. Check the logs: `npm run dev` shows detailed error messages
2. Verify MongoDB is running and accessible
3. Check environment variables are set correctly
4. Test API endpoints with curl or Postman
5. Check browser console for frontend errors
