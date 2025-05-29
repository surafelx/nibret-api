# Nibret Express API

Express.js backend for the Nibret Real Estate platform, focusing on Authentication, Properties, and CRM functionality.

## 🚀 Features

### Authentication
- User registration and login
- JWT-based authentication
- Role-based access control (ADMIN/CUSTOMER)
- Admin credentials support
- Password hashing with bcrypt

### Properties
- CRUD operations for properties
- Advanced search and filtering
- Geospatial queries for nearby properties
- Property statistics and analytics
- Image upload support
- Property status management

### CRM (Customer Relationship Management)
- Customer management
- Lead tracking and management
- Lead status updates
- Notes and follow-up system
- Lead conversion tracking

## 🛠️ Tech Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Password Hashing**: bcryptjs

## 📦 Installation

1. **Clone and navigate to the project:**
   ```bash
   cd nibret-express-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/nibret_db
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=24h
   FRONTEND_URL=http://localhost:5173
   ADMIN_USERNAME=0965789832
   ADMIN_PASSWORD=nibretadmin
   ```

4. **Start MongoDB:**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Run the application:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔗 API Endpoints

### Authentication (`/accounts`)
- `POST /accounts/registration` - Register new user
- `POST /accounts/login/` - Login user
- `GET /accounts/users/me` - Get current user
- `GET /accounts/users` - Get all users (Admin only)
- `PUT /accounts/user/` - Update current user
- `PATCH /accounts/user/:id` - Update user status (Admin only)

### Properties (`/properties`)
- `GET /properties` - Get all properties with filters
- `POST /properties` - Create new property
- `POST /properties/list` - Get properties with embedded credentials
- `GET /properties/:id` - Get single property
- `PUT /properties/:id` - Update property
- `DELETE /properties/:id` - Delete property
- `GET /properties/nearby` - Get nearby properties
- `PATCH /properties/:id/status` - Toggle property status
- `GET /properties/stats/breakdown` - Get property statistics
- `GET /properties/stats/monthly` - Get monthly property data

### Customers & CRM (`/customers`)
- `GET /customers` - Get all customers (Admin only)
- `POST /customers` - Create new customer (Admin only)
- `GET /customers/:id` - Get single customer (Admin only)
- `PUT /customers/:id` - Update customer (Admin only)
- `DELETE /customers/:id` - Delete customer (Admin only)

### Leads (`/customers/leads`)
- `GET /customers/leads` - Get all leads (Admin only)
- `POST /customers/leads` - Create new lead (Public)
- `GET /customers/leads/:status` - Get leads by status (Admin only)
- `PATCH /customers/leads/:id/status` - Update lead status (Admin only)
- `POST /customers/leads/:id/notes` - Add note to lead (Admin only)
- `DELETE /customers/leads/:id` - Delete lead (Admin only)

## 🔐 Authentication

### Admin Login
Use the following credentials for admin access:
- **Username**: `0965789832`
- **Password**: `nibretadmin`

### JWT Token Usage
Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Models

### User
- first_name, last_name, email, phone
- password (hashed)
- role (ADMIN/CUSTOMER)
- is_active status

### Property
- title, description, price
- beds, baths, sqft
- address, lat, lng
- propertyType, status
- images, features
- owner reference

### Customer
- first_name, last_name, email, phone
- preferences (property types, price range, etc.)
- notes, source, status

### Lead
- name, email, phone
- property interest
- status, priority
- notes with timestamps
- assigned agent

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Login
```bash
curl -X POST http://localhost:3000/accounts/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"0965789832","password":"nibretadmin"}'
```

### Get Properties
```bash
curl -X POST http://localhost:3000/properties/list \
  -H "Content-Type: application/json" \
  -d '{"username":"0965789832","password":"nibretadmin"}'
```

## 🔧 Development

### Project Structure
```
src/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── errorHandler.js      # Error handling
├── models/
│   ├── User.js              # User model
│   ├── Property.js          # Property model
│   ├── Customer.js          # Customer model
│   └── Lead.js              # Lead model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── properties.js        # Property routes
│   └── customers.js         # Customer/CRM routes
└── app.js                   # Main application file
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

## 🌐 Frontend Integration

This API is designed to work with the nibret-finder-ethiopia frontend. The frontend should:

1. Use `https://api.nibret.com` as the base URL
2. Include JWT tokens in Authorization headers
3. Handle the specific response formats
4. Use the embedded credentials format for compatibility

## 📝 Notes

- The API supports both traditional REST endpoints and embedded credential requests for frontend compatibility
- All passwords are hashed using bcrypt with salt rounds of 12
- MongoDB indexes are created for optimal query performance
- Rate limiting is applied to prevent abuse
- CORS is configured for frontend integration

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Set strong JWT secrets
4. Configure proper CORS origins
5. Set up SSL/TLS certificates
6. Use a process manager like PM2

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
