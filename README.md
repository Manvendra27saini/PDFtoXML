# PDF-to-XML Converter

## Project Description

The PDF-to-XML Converter is a sophisticated web application that allows users to convert PDF documents into structured XML format while preserving document structure and formatting. It features a user-friendly interface for uploading PDF files, converting them to XML with structure preservation, and managing conversion history.

### Key Features

- User authentication system with registration and login
- Drag-and-drop PDF file upload functionality
- Structure-preserving PDF-to-XML conversion
- Real-time conversion progress tracking
- Multi-page document preview
- XML result viewing, copying, and downloading
- Comprehensive conversion history management
- User profile settings

## Technologies Used

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI components
- TanStack React Query
- React Hook Form with Zod validation

### Backend
- Node.js
- Express.js
- MongoDB database
- Mongoose ODM
- Passport.js for authentication
- Multer for file uploads
- pdf-parse for PDF processing

### Development Tools
- ESBuild
- TypeScript
- MongoDB Atlas (for cloud database)

## Installation & Local Setup

### Prerequisites
- Node.js (v18.x or higher)
- MongoDB (local or MongoDB Atlas account)

### Steps to Run Locally

1. Clone the repository
```sh
git clone <repository-url>
cd pdf-to-xml-converter
```

2. Install dependencies
```sh
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=mongodb://localhost:27017/pdfconverter
# Or for MongoDB Atlas
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/pdfconverter
SESSION_SECRET=your_session_secret_here
```

4. Initialize the database
```sh
npm run init-db
```

5. Start the development server
```sh
npm run dev
```

6. Access the application
The application will be available at `http://localhost:5000`

## Usage Guide

### Converting a PDF to XML

1. **Register/Login**: Create an account or log in with your credentials
2. **Upload PDF**: From the home page, drag and drop a PDF file or click to select one
3. **View Conversion**: Once uploaded, the PDF will be automatically converted and displayed
4. **Interact with Results**: 
   - View the converted XML structure
   - Copy the XML to clipboard
   - Download the XML file
   - Navigate through multi-page documents using the page selector

### Managing Conversion History

1. **View Recent Conversions**: Recent conversions appear on the home page
2. **Access Full History**: Click "View in table format" to see complete conversion history
3. **Actions**:
   - Download any previous conversion
   - View converted XML in a new tab
   - Delete unwanted conversions (with confirmation)

### User Profile Management

1. **Access Settings**: Click on your username in the navigation bar and select "Settings"
2. **Update Profile**: Change your username, email, or password
3. **Logout**: End your session by clicking "Logout" in the user menu

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login with credentials
- `POST /api/logout` - Logout the current user
- `GET /api/user` - Get current user information

### Conversions
- `POST /api/conversions` - Upload and convert a PDF file
- `GET /api/conversions` - Get all conversions for the current user
- `GET /api/conversions/:id` - Get a specific conversion
- `GET /api/conversions/:id/download` - Download the XML file
- `DELETE /api/conversions/:id` - Delete a conversion

## Folder Structure

```
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Application entry point
├── server/                # Backend Express server
│   ├── auth.ts            # Authentication logic
│   ├── converter.ts       # PDF conversion logic
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data storage interface
│   ├── models/            # MongoDB schema models
│   └── index.ts           # Server entry point
├── shared/                # Shared code between client and server
│   └── types.ts           # Type definitions
└── package.json           # Project dependencies and scripts
```

## Troubleshooting & Common Issues

### Connection Issues
- **Database Connection Error**: Ensure MongoDB is running or your MongoDB Atlas connection string is correct
- **CORS Errors**: The application is configured to run on localhost:5000; ensure no other services use this port

### Conversion Issues
- **Large PDF Files**: Files over 50MB may take longer to process
- **PDF Conversion Failure**: Some highly complex PDFs or scanned documents might not convert properly
- **Session Timeout**: If you're inactive for too long, you might be logged out automatically

### Browser Compatibility
- This application works best in modern browsers (Chrome, Firefox, Safari, Edge)
- Ensure JavaScript is enabled in your browser

## Contributing

Contributions are welcome! If you'd like to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.