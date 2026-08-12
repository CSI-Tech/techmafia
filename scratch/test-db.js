/* eslint-disable */
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function test() {
  const uri = process.env.MONGODB_URI;
  console.log('Connecting to URI:', uri);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connection successful!');
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    process.exit(0);
  }
}

test();
