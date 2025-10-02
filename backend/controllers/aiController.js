require('dotenv').config();
const fetch = require('node-fetch');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const datasetController = require('./datasetController');
const User = require('../models/User');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Word documents (.docx, .doc), and image files (.jpg, .jpeg, .png, .gif, .bmp, .tiff) are allowed'), false);
    }
  }
});

// Extract text from different file types
const extractTextFromFile = async (file) => {
  const { buffer, mimetype, originalname } = file;
  
  try {
    switch (mimetype) {
      case 'application/pdf':
        const pdfData = await pdfParse(buffer);
        return {
          text: pdfData.text,
          type: 'PDF',
          pages: pdfData.numpages
        };
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        const docResult = await mammoth.extractRawText({ buffer });
        return {
          text: docResult.value,
          type: 'Word Document',
          warnings: docResult.messages
        };
        
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
      case 'image/gif':
      case 'image/bmp':
      case 'image/tiff':
        // Convert image to a format Tesseract can handle better
        let processedBuffer = buffer;
        
        try {
          // Use sharp to preprocess the image for better OCR
          processedBuffer = await sharp(buffer)
            .resize(null, 1000, { 
              withoutEnlargement: true,
              fit: 'inside'
            })
            .greyscale()
            .normalize()
            .sharpen()
            .png()
            .toBuffer();
        } catch (sharpError) {
          console.log('Sharp preprocessing failed, using original buffer:', sharpError.message);
          processedBuffer = buffer;
        }
        
        const ocrResult = await Tesseract.recognize(processedBuffer, 'eng+hin', {
          logger: m => console.log('OCR Progress:', m)
        });
        
        return {
          text: ocrResult.data.text,
          type: 'Image (OCR)',
          confidence: ocrResult.data.confidence,
          language: 'English + Hindi'
        };
        
      default:
        throw new Error(`Unsupported file type: ${mimetype}`);
    }
  } catch (error) {
    throw new Error(`Failed to extract text from ${originalname}: ${error.message}`);
  }
};

// Universal file processing handler
const handleFileRequest = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    console.log(`Processing file: ${req.file.originalname} (${req.file.mimetype})`);

    // Extract text from the uploaded file
    const extractionResult = await extractTextFromFile(req.file);
    const extractedText = extractionResult.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: `Could not extract text from ${req.file.originalname} or the file appears to be empty`
      });
    }

    // Prepare message for AI with file content
    const { customPrompt } = req.body;
    const fileTypeInfo = `File Type: ${extractionResult.type}`;
    const additionalInfo = extractionResult.pages ? `Pages: ${extractionResult.pages}` : 
                          extractionResult.confidence ? `OCR Confidence: ${Math.round(extractionResult.confidence)}%` : '';
    
    const finalPrompt = customPrompt 
      ? `${customPrompt}\n\n${fileTypeInfo}${additionalInfo ? ` (${additionalInfo})` : ''}\nFile Content:\n${extractedText}`
      : `Please summarize and analyze the following ${extractionResult.type.toLowerCase()} content:\n\n${fileTypeInfo}${additionalInfo ? ` (${additionalInfo})` : ''}\nContent:\n${extractedText}`;

    // Process through AI
    let response;
    let retryCount = 0;
    const maxRetries = 3;

    // Try Gemini API first
    while (retryCount < maxRetries) {
      try {
        response = await fetch(`${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: finalPrompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
            }
          }),
        });

        if (response.ok || (response.status !== 503 && response.status !== 500)) {
          break;
        }

        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      } catch (error) {
        console.error(`Gemini API attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }

    if (response && response.ok) {
      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        return res.status(200).json({
          success: true,
          response: aiResponse,
          source: 'gemini',
          fileName: req.file.originalname,
          fileType: extractionResult.type,
          extractedTextLength: extractedText.length,
          additionalInfo: extractionResult,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Fallback response if AI fails
    return res.status(200).json({
      success: true,
      response: `I've successfully extracted ${extractedText.length} characters from your ${extractionResult.type.toLowerCase()} "${req.file.originalname}". However, our AI service is temporarily unavailable. Here's the extracted content:\n\n${extractedText.substring(0, 1000)}${extractedText.length > 1000 ? '...' : ''}`,
      source: 'fallback',
      fileName: req.file.originalname,
      fileType: extractionResult.type,
      extractedTextLength: extractedText.length,
      additionalInfo: extractionResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('File processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing file',
      error: error.message
    });
  }
};

// Legacy PDF processing handler (for backward compatibility)
const handlePDFRequest = handleFileRequest;

// AI API handler with custom dataset priority
const handleAIRequest = async (req, res) => {
  try {
    const { message, isAnonymous = false } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // ✅ Daily message limit check (only for logged-in users)
    if (!isAnonymous && req.user) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const today = new Date().toISOString().split("T")[0];
      const lastDate = user.lastMessageDate
        ? user.lastMessageDate.toISOString().split("T")[0]
        : null;

      // Reset if new day
      if (today !== lastDate) {
        user.dailyMessageCount = 0;
        user.lastMessageDate = new Date();
      }

      // Block if already sent 10 messages
      if (user.dailyMessageCount >= 10) {
        return res.status(403).json({
          success: false,
          message: "Daily message limit reached. Please try again tomorrow."
        });
      }

      // Increment and save
      user.dailyMessageCount += 1;
      user.lastMessageDate = new Date();
      await user.save();
    }

    console.log(`🔍 Processing message: "${message}"`);

    // ✅ now continue with your existing AI flow
    // STEP 1: Try custom dataset first
    const datasetMatch = await datasetController.findResponse(message);
    if (datasetMatch && datasetMatch.confidence > 0.6) {
      return res.status(200).json({
        success: true,
        response: datasetMatch.response,
        source: 'custom-dataset',
        category: datasetMatch.category,
        confidence: datasetMatch.confidence,
        matchType: datasetMatch.matchType,
        detectedLanguage: datasetMatch.detectedLanguage,
        timestamp: new Date().toISOString()
      });
    }


    console.log('📝 No high-confidence dataset match found, trying Gemini API...');
    
    // Detect language for better Gemini API prompting
    const userLanguage = datasetController.detectLanguage(message);
    console.log(`🌐 Detected language: ${userLanguage}`);

    // STEP 2: Try Gemini API if no dataset match
    let response;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // Create language-aware prompt for Gemini
        const languageInstructions = {
          hindi: "Please respond in Hindi (Devanagari script or Roman Hindi). Be helpful and friendly.",
          urdu: "Please respond in Urdu (Roman Urdu is fine). Be helpful and respectful.",
          punjabi: "Please respond in Punjabi (Roman Punjabi is fine). Be helpful and warm.",
          bengali: "Please respond in Bengali (Roman Bengali is fine). Be helpful and respectful.",
          tamil: "Please respond in Tamil (Roman Tamil is fine). Be helpful and respectful.",
          telugu: "Please respond in Telugu (Roman Telugu is fine). Be helpful and respectful.",
          gujarati: "Please respond in Gujarati (Roman Gujarati is fine). Be helpful and respectful.",
          marathi: "Please respond in Marathi (Roman Marathi is fine). Be helpful and respectful.",
          kannada: "Please respond in Kannada (Roman Kannada is fine). Be helpful and respectful.",
          malayalam: "Please respond in Malayalam (Roman Malayalam is fine). Be helpful and respectful.",
          english: "Please respond in English. Be helpful and friendly."
        };

        const languageInstruction = languageInstructions[userLanguage] || languageInstructions.english;
        const enhancedPrompt = `${languageInstruction}\n\nUser question: ${message}`;

        response = await fetch(`${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: enhancedPrompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            }
          }),
        });

        // If success or non-retryable error, break
        if (response.ok || (response.status !== 503 && response.status !== 500)) {
          break;
        }

        retryCount++;
        if (retryCount < maxRetries) {
          // Wait before retry (exponential backoff)
          const waitTime = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
          console.log(`Retrying Gemini API in ${waitTime/1000} seconds... (Attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      } catch (geminiError) {
        console.error('Gemini API error:', geminiError);
        break;
      }
    }

    // Check if Gemini API was successful
    if (response && response.ok) {
      const responseData = await response.json();
      const responseContent = responseData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

      console.log('✅ Gemini API response received');
      return res.status(200).json({
        success: true,
        response: responseContent,
        source: 'gemini',
        detectedLanguage: userLanguage,
        timestamp: new Date().toISOString()
      });
    }

    // Handle Gemini API errors
    if (response && !response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        console.log('⚠️ Gemini API quota exceeded, trying backup options...');
      } else {
        console.log(`⚠️ Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
    }

    // STEP 3: Try backup API if Gemini fails
    console.log('Gemini API failed, trying backup API...');
    
    try {
      const backupResponse = await fetch(process.env.BACKUP_API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (backupResponse.ok) {
        const backupData = await backupResponse.json();
        
        // Find matching response from backup API
        const userContentLower = message.toLowerCase().trim();
        let responseContent = backupData[userContentLower];

        console.log("Debug",backupResponse)
        
        // If no exact match, try partial matches
        if (!responseContent) {
          const keys = Object.keys(backupData);
          const partialMatch = keys.find(key => 
            userContentLower.includes(key.toLowerCase()) || 
            key.toLowerCase().includes(userContentLower)
          );
          console.log(partialMatch)
          if (partialMatch) {
            responseContent = backupData[partialMatch];
          } else {
            responseContent = "Sorry, our main AI is temporarily down, but I'm still here! Try asking something else.";
          }
        }

        console.log('✅ Backup API response found');
        return res.status(200).json({
          success: true,
          response: `🔄 ${responseContent}`,
          source: 'backup',
          detectedLanguage: userLanguage,
          timestamp: new Date().toISOString()
        });
      }
    } catch (backupError) {
      console.error('Backup API also failed:', backupError);
    }

    // STEP 4: Use low-confidence dataset match as last resort
    if (datasetMatch && datasetMatch.confidence > 0.3) { // Lower threshold when APIs fail
      console.log(`🔄 Using low-confidence dataset match as fallback (confidence: ${datasetMatch.confidence.toFixed(2)}, language: ${datasetMatch.detectedLanguage})`);
      
      const notes = {
        hindi: "\n\n(Note: Ye partial match hai mere knowledge base se. Main AI services temporarily unavailable hain, isliye ye response de raha hun.)",
        urdu: "\n\n(Note: Ye partial match hai mere knowledge base se. Main AI services temporarily unavailable hain, isliye ye response de raha hun.)",
        punjabi: "\n\n(Note: Eh partial match hai mere knowledge base ton. Main AI services temporarily unavailable ne, isliye eh response de raha han.)",
        bengali: "\n\n(Note: Eta amar knowledge base theke partial match. Main AI services temporarily unavailable, tai eta response dichi.)",
        tamil: "\n\n(Note: Idhu en knowledge base la irundhu partial match. Main AI services temporarily unavailable, adhanaala idha response kudukiren.)",
        english: "\n\n(Note: This is a partial match from my knowledge base. Main AI services are temporarily unavailable, so I'm providing this response.)"
      };
      
      const note = notes[datasetMatch.detectedLanguage] || notes.english;
      
      return res.status(200).json({
        success: true,
        response: `${datasetMatch.response}${note}`,
        source: 'custom-dataset-fallback',
        category: datasetMatch.category,
        confidence: datasetMatch.confidence,
        matchType: datasetMatch.matchType,
        detectedLanguage: datasetMatch.detectedLanguage,
        timestamp: new Date().toISOString()
      });
    }

    // STEP 5: Final fallback with language detection
    console.log('❌ All response methods failed, using final fallback');
    const fallbackResponse = await datasetController.getFallbackResponse(userLanguage);
    
    return res.status(200).json({
      success: true,
      response: fallbackResponse,
      source: 'final-fallback',
      detectedLanguage: userLanguage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


module.exports = {
  handleAIRequest,
  handlePDFRequest,
  handleFileRequest,
  upload
};
