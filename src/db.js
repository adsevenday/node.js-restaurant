import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/";
const DB_NAME = process.env.NODE_ENV === 'test' ? 'foodexpress-test' : 'foodexpress';

// 1. Setup Mongoose Connection
mongoose.connect(MONGODB_URI, {
    dbName: DB_NAME,
    serverSelectionTimeoutMS: 5000, 
})
.then(() => console.log(`Connection à MongoDB établi (${DB_NAME}) !`))
.catch((err) => console.error("Erreur de connexion à MongoDB :", err.message));

// 2. Define User Schema and Model
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false }, // Do not return password by default
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

// Pre-save hook to hash password
UserSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = function(candidatePassword) {
    // Note: this.password is available here because we explicitly retrieve it in the login route (.select('+password'))
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', UserSchema);

// 3. Define Restaurant Schema and Model
const RestaurantSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    opening_hours: { type: String, required: true },
}, { timestamps: true });

export const Restaurant = mongoose.model('Restaurant', RestaurantSchema);

// 4. Define Menu Schema and Model
const MenuSchema = new mongoose.Schema({
    restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
}, { timestamps: true });

export const Menu = mongoose.model('Menu', MenuSchema);
