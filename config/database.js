import mongoose from 'mongoose';

const config = () => {
  mongoose.connect(process.env.MongoDB_URL);

  mongoose.connection
    .on('open', () => {
      console.log('🍻 Cheers! Database connected.');
    })
    .on('error', (error) => {
      console.log(`🚨 Connection Error: ${error}`);
    });
};

export default config;
