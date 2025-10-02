const mongoose = require('mongoose');
require('dotenv').config();

const Dataset = require('../models/Dataset');

const multilingualData = {
  // Hindi responses
  hindi: {
    "hello": "Namaste! Main aapka AI assistant hun. Aaj main aapki kaise madad kar sakta hun?",
    "hi": "Namaste! Kya haal hai? Kuch kaam hai?",
    "good morning": "Suprabhat! Aaj ka din shubh ho. Kya madad chahiye?",
    "good evening": "Shubh sandhya! Aaj ka din kaisa raha?",
    "how are you": "Main bilkul theek hun, dhanyawad! Aap kaise hain? Kya madad kar sakta hun?",
    "what is your name": "Main aapka AI assistant hun. Aap mujhe jo naam dena chahte hain, de sakte hain!",
    "thank you": "Aapka swagat hai! Khushi hui madad karke. Kuch aur chahiye?",
    "bye": "Alvida! Jab bhi zarurat ho, aa jaiyega. Khush rahiye!",
    "help": "Bilkul! Main yahan hun aapki madad ke liye. Kya sawal hai?",
    "kya haal hai": "Sab badhiya hai! Aap batayiye, kya kaam hai?",
    "kaise ho": "Main ekdum mast hun! Aap kaise hain?",
    "dhanyawad": "Koi baat nahi! Hamesha khushi se madad karta hun.",
    "madad chahiye": "Haan bilkul! Batayiye kya madad chahiye?",
    "tum kaun ho": "Main aapka AI assistant hun. Har sawal ka jawab dene ki koshish karta hun.",
    "kya kar sakte ho": "Main bahut kuch kar sakta hun - sawalon ke jawab, jankari dena, analysis, aur bhi bahut kuch!"
  },

  // Urdu responses
  urdu: {
    "assalam alaikum": "Walaikum assalam! Main aapka AI assistant hun. Aaj kya khidmat kar sakta hun?",
    "adab": "Adab arz hai! Kya haal hai? Kuch kaam hai?",
    "shukria": "Koi baat nahi! Khushi hui madad karke. Aur kuch chahiye?",
    "alvida": "Khuda hafiz! Jab bhi zarurat ho, aa jaiyega.",
    "aap kaise hain": "Main bilkul theek hun, shukriya! Aap kaise hain?",
    "madad": "Bilkul! Main yahan hun aapki khidmat ke liye. Kya sawal hai?",
    "kya naam hai": "Main aapka AI assistant hun. Jo naam pasand ho, rakh sakte hain!",
    "subah bakhair": "Subah bakhair! Aaj ka din mubarak ho. Kya madad kar sakta hun?"
  },

  // Punjabi responses
  punjabi: {
    "sat sri akal": "Sat Sri Akal ji! Main tuhada AI assistant han. Aj ki madad kar sakda han?",
    "kiddan": "Sab changa! Tusi dasao, ki kaam hai?",
    "dhanyawad": "Koi gal nahi! Khushi hoyi madad karke. Hor kuch chahida?",
    "alvida": "Rab rakha! Jado marzi aa jana. Khush raho!",
    "tusi kaun ho": "Main tuhada AI assistant han. Har sawal da jawab dene di koshish karda han.",
    "madad chahidi": "Haan bilkul! Dasao ki madad chahidi?"
  },

  // Bengali responses
  bengali: {
    "namaskar": "Namaskar! Ami apnar AI assistant. Aj ami apnake ki sahajyo korte pari?",
    "kemon achen": "Ami bhalo achi, dhonnobad! Apni kemon achen?",
    "dhonnobad": "Apnar swagotom! Khushi hoyechi sahajyo korte pere. Ar kichu lagbe?",
    "bida": "Bida! Jokhon dorkar hobe, esho. Bhalo thakben!",
    "apni ke": "Ami apnar AI assistant. Jekono prosner uttor deoar chesta kori.",
    "sahajyo": "Oboshyoi! Ami ekhane achi apnar sahajyer jonno. Ki proshno?"
  },

  // Tamil responses
  tamil: {
    "vanakkam": "Vanakkam! Naan ungal AI assistant. Inru naan ungalukku eppadi uthavi seiya mudiyum?",
    "eppadi irukkireenga": "Naan nalla irukken, nandri! Neenga eppadi irukkireenga?",
    "nandri": "Paravailla! Uthavi seidhadhil sandhosham. Vera edhaavathu venum?",
    "poitu varen": "Seri, poitu vaanga! Eppo venum aanaalum vaanga. Nalla irunga!",
    "neenga yaaru": "Naan ungal AI assistant. Ella kelvikum badhil solla try panren.",
    "uthavi venum": "Kandippa! Naan inga irukken ungal uthavikkaaga. Enna kelvi?"
  },

  // Telugu responses
  telugu: {
    "namaste": "Namaste! Nenu mee AI assistant. Ee roju nenu meeku ela sahayam cheyagalanu?",
    "ela unnaru": "Nenu bagunnanu, dhanyawadalu! Meeru ela unnaru?",
    "dhanyawadalu": "Parledu! Sahayam chesina santosham. Inkemaina kavali?",
    "vellipotha": "Sare, vellandi! Eppudu kavali aina randi. Bagundandi!",
    "meeru evaru": "Nenu mee AI assistant. Anni prashnalaku jawabulu cheppataniki try chestanu.",
    "sahayam kavali": "Avunu! Nenu ikkada unna mee sahayam kosam. Emi prashna?"
  },

  // Gujarati responses
  gujarati: {
    "namaste": "Namaste! Hu tamara AI assistant chu. Aaje hu tamne kevi madad kari shaku?",
    "kem cho": "Hu majama chu, aabhar! Tame kem cho?",
    "aabhar": "Koi vaat nathi! Madad karva ma khushi thay. Hor kainch joiye?",
    "aavjo": "Aavjo! Jyare jarur hoy tyare aavjo. Khush raho!",
    "tame kaun cho": "Hu tamara AI assistant chu. Har prashna no jawab aapva ni koshish karu chu.",
    "madad joiye": "Haa bilkul! Hu ahiya chu tamari madad mate. Shu prashna che?"
  },

  // Marathi responses
  marathi: {
    "namaskar": "Namaskar! Mi tumcha AI assistant aahe. Aaj mi tumhala kashi madad karu shakto?",
    "kase aahat": "Mi bara aahe, dhanyawad! Tumhi kase aahat?",
    "dhanyawad": "Kahi harkat nahi! Madad karnyat khushi zali. Ajun kahi pahije?",
    "nirop": "Nirop! Jeva garja asela teva ya. Khush raha!",
    "tumhi kon aahat": "Mi tumcha AI assistant aahe. Har prashnacha uttar denyacha prayatna karto.",
    "madad pahije": "Nakkach! Mi ithech aahe tumchya madatisathi. Kaay prashna aahe?"
  },

  // Kannada responses
  kannada: {
    "namaskara": "Namaskara! Naanu nimma AI assistant. Ivaga naanu nimge hege sahaya maadabahudhu?",
    "hegiddira": "Naanu chennagiddene, dhanyawadagalu! Neevu hegiddira?",
    "dhanyawadagalu": "Parvaagilla! Sahaya maadidakke santhosha aayithu. Innu yenu beku?",
    "hogthini": "Sari, hogi! Yavaga beku aadru banni. Chennagi iri!",
    "neevu yaaru": "Naanu nimma AI assistant. Ella prashnegalige uttara kodoke prayatnisthene.",
    "sahaya beku": "Houdu! Naanu illi iddene nimma sahayakke. Enu prashne?"
  },

  // Malayalam responses
  malayalam: {
    "namaskaram": "Namaskaram! Njan ningalude AI assistant aanu. Innu njan ningale engane sahayikkam?",
    "engane undu": "Njan nannayi undu, nanni! Ningal engane undu?",
    "nanni": "Onnum illa! Sahayichathu kondulla santosham. Vere enthenkilum venam?",
    "poyikolam": "Seri, poyikollu! Eppol venam enkilum varavu. Nannayi irikkanam!",
    "ningal aaraanu": "Njan ningalude AI assistant aanu. Ella chodyangalkum utharam parayaan sramikkum.",
    "sahayam venam": "Athe! Njan ivide undu ningalude sahayathinu. Enthu chodyam?"
  },

  // English responses (enhanced)
  english: {
    "hello": "Hello! I'm your AI assistant. How can I help you today?",
    "hi": "Hi there! What can I do for you?",
    "good morning": "Good morning! Ready to start the day together?",
    "good evening": "Good evening! How can I assist you tonight?",
    "how are you": "I'm doing great, thank you for asking! How are you doing?",
    "what is your name": "I'm your AI assistant. You can call me whatever you'd like!",
    "thank you": "You're very welcome! Happy to help anytime.",
    "bye": "Goodbye! Feel free to come back whenever you need assistance.",
    "help": "I'm here to help! What would you like to know?",
    "who are you": "I'm your AI assistant, designed to help with various tasks and questions."
  },

  // Technical terms in multiple languages
  technical_multilingual: {
    "javascript kya hai": "JavaScript ek programming language hai jo web development ke liye use hoti hai. Ye websites ko interactive banata hai.",
    "python kya hai": "Python ek high-level programming language hai jo simple syntax ke liye famous hai. Data science aur AI mein bahut use hoti hai.",
    "react kya hai": "React ek JavaScript library hai jo user interfaces banane ke liye use hoti hai. Facebook ne banaya hai.",
    "database kya hai": "Database ek organized collection hai data ka, jo computer mein store hota hai.",
    "api kya hai": "API matlab Application Programming Interface - ye different software components ko communicate karne mein madad karta hai."
  },

  // Common phrases in multiple languages
  common_multilingual: {
    "main samjha nahi": "Koi baat nahi! Kya aap apna sawal dusre tarike se puch sakte hain?",
    "mujhe help chahiye": "Bilkul! Main yahan hun aapki madad ke liye. Kya problem hai?",
    "ye kya hai": "Ye ek interesting sawal hai! Kya aap thoda aur detail mein bata sakte hain?",
    "kaise karte hain": "Main aapko step by step batata hun. Pehle ye batayiye ki exactly kya karna hai?",
    "samay kya hai": "Maaf kijiye, mere paas real-time clock nahi hai. Aap apne device pe time check kar sakte hain.",
    "mausam kaisa hai": "Mujhe current weather ki jankari nahi hai. Weather app ya website check kariye accurate forecast ke liye."
  }
};

const addMultilingualData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/accord-ai');
    console.log('✅ Connected to MongoDB');

    let totalImported = 0;
    let totalErrors = 0;

    for (const [category, responses] of Object.entries(multilingualData)) {
      console.log(`\n📂 Adding ${category} responses...`);
      
      for (const [key, response] of Object.entries(responses)) {
        try {
          const dataset = new Dataset({
            category: category.toLowerCase(),
            key: key.toLowerCase(),
            response: response,
            metadata: {
              confidence: 1.0,
              priority: 0,
              tags: ['multilingual', category]
            }
          });

          await dataset.save();
          totalImported++;
          console.log(`  ✅ ${key}`);
        } catch (error) {
          if (error.code === 11000) {
            console.log(`  ⚠️ ${key} (already exists)`);
          } else {
            totalErrors++;
            console.log(`  ❌ ${key}: ${error.message}`);
          }
        }
      }
    }

    console.log(`\n🎉 Multilingual data added!`);
    console.log(`✅ Successfully imported: ${totalImported} responses`);
    console.log(`❌ Errors: ${totalErrors} responses`);

    // Show final stats
    const stats = await Dataset.getStats();
    console.log(`\n📈 Total in database: ${stats.totalResponses} responses`);
    console.log(`📊 Total categories: ${stats.totalCategories}`);

  } catch (error) {
    console.error('❌ Error adding multilingual data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

// Run if called directly
if (require.main === module) {
  addMultilingualData();
}

module.exports = { addMultilingualData };