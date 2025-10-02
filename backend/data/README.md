# Custom Dataset System (Database-Based)

Your AI chat application now uses a MongoDB-based custom dataset system that prioritizes your own responses over external AI APIs.

## How It Works

1. **Custom Dataset First**: When a user sends a message, the system first checks your MongoDB dataset for matching responses
2. **AI Fallback**: If no good match is found (confidence < 70%), it falls back to Gemini API
3. **Backup API**: If Gemini fails, it tries your backup API
4. **Final Fallback**: If all else fails, it uses your custom fallback responses

## Response Priority Order

1. **Custom Dataset** (confidence > 70%) - Your own responses from MongoDB
2. **Gemini API** - External AI service
3. **Backup API** - Your backup service
4. **Custom Dataset** (confidence < 70%) - Lower confidence matches from your dataset
5. **Final Fallback** - Generic fallback message from database

## Database Structure

The dataset is now stored in MongoDB with this schema:

```javascript
{
  category: String,        // e.g., "greetings", "technical"
  key: String,            // trigger phrase (lowercase)
  response: String,       // response text
  isActive: Boolean,      // soft delete flag
  createdBy: ObjectId,    // user who created it
  usage: {
    count: Number,        // how many times used
    lastUsed: Date       // last usage timestamp
  },
  metadata: {
    confidence: Number,   // 0-1 confidence score
    tags: [String],      // optional tags
    priority: Number     // response priority
  }
}
```

## Managing Your Dataset

### 1. Web Interface (Recommended)
- Sign in to your app
- Click the database icon in the header
- Use the Dataset Manager to:
  - View statistics
  - Test messages
  - Add new responses
  - Browse categories

### 2. Database Migration
Migrate existing JSON data to MongoDB:

```bash
cd backend/scripts

# Migrate existing JSON file to database
node migrate-to-database.js

# Add sample data to database
node migrate-to-database.js --sample
```

### 3. Programmatic Import
Use the provided scripts:

```bash
cd backend/scripts

# Import from CSV to database
node csv-import.js your-data.csv

# Create example CSV and import to database
node csv-import.js --example
```

## CSV Import Format

Create a CSV file with columns: `category,key,response`

```csv
category,key,response
greetings,hello,Hello! How can I help you today?
technical,what is javascript,JavaScript is a programming language...
business,what is roi,ROI stands for Return on Investment...
```

## API Endpoints

### Public Endpoints
- `GET /api/dataset/stats` - Get dataset statistics
- `GET /api/dataset/categories` - List all categories
- `GET /api/dataset/category/:name` - Get responses in a category
- `POST /api/dataset/test` - Test a message against the dataset

### Protected Endpoints (require authentication)
- `POST /api/dataset/add` - Add new response to database
- `PUT /api/dataset/update` - Update existing response in database
- `DELETE /api/dataset/delete` - Soft delete response in database
- `POST /api/dataset/import` - Bulk import responses to database
- `GET /api/dataset/search?q=term` - Search responses in database

## Best Practices

### 1. Organize by Categories
Group related responses together:
- `greetings` - Hello, hi, good morning, etc.
- `technical` - Programming, technology questions
- `business` - Business-related queries
- `general` - General knowledge

### 2. Use Lowercase Keys
All trigger phrases are converted to lowercase for matching:
```json
{
  "greetings": {
    "hello": "Hello! How can I help?",
    "good morning": "Good morning! Ready to start the day?"
  }
}
```

### 3. Include Variations
Add multiple ways users might ask the same thing:
```json
{
  "technical": {
    "what is react": "React is a JavaScript library...",
    "tell me about react": "React is a JavaScript library...",
    "explain react": "React is a JavaScript library..."
  }
}
```

### 4. Test Your Responses
Use the web interface or API to test how well your responses match user queries.

## Matching Algorithm

The system uses a similarity algorithm that:
1. Checks for exact matches first
2. Calculates word overlap for partial matches
3. Returns confidence scores (0-1)
4. Only uses matches with confidence > 0.6

## Database Benefits

- **Scalability**: MongoDB can handle millions of responses
- **Performance**: Indexed searches for fast matching
- **Analytics**: Track usage statistics for each response
- **Soft Deletes**: Responses are deactivated, not permanently deleted
- **User Tracking**: Know who created each response
- **Concurrent Access**: Multiple users can manage dataset simultaneously

## Monitoring

Check your server logs to see which response source is being used:
- `✅ Found dataset match` - Your custom dataset from MongoDB was used
- `✅ Gemini API response received` - External AI was used
- `✅ Backup API response found` - Backup service was used

## Expanding Your Dataset

Start with common queries your users ask and gradually expand:

1. **Monitor Logs**: See what questions users ask frequently
2. **Add Responses**: Create custom responses via web interface or API
3. **Test and Refine**: Use the test feature to ensure good matching
4. **Analyze Usage**: Check which responses are used most frequently
5. **Categorize**: Keep responses organized in logical categories

## Database Setup

Make sure your MongoDB connection is configured in `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/accord-ai
```

Your database-based custom dataset will make your AI more consistent, faster, scalable, and tailored to your specific use case!