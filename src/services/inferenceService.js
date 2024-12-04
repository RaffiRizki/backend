import * as tf from '@tensorflow/tfjs-node';
import InputError from '../exceptions/InputError.js';

async function predictClassification(model, image) {
    let tensor = null;
    let prediction = null;
    
    try {
        // Decode and preprocess image
        tensor = tf.node
            .decodeJpeg(image)
            .resizeNearestNeighbor([224, 224]) // Resize image to match model input
            .expandDims() // Add batch dimension
            .toFloat() // Convert to float32 tensor
            .div(255.0);  // Normalize pixel values to [0,1]
        
        // Make prediction
        prediction = await model.predict(tensor);
        
        // Get prediction data as a Float32Array
        const probabilities = await prediction.dataSync();
        console.log('Raw prediction probabilities:', probabilities);
        
        // Ensure we're getting valid probabilities
        if (!probabilities || probabilities.length === 0) {
            throw new Error('Model returned invalid predictions');
        }

        const classes = ['Cancer', 'Non-cancer'];
        // Use the first output value for binary classification
        const threshold = 0.5;
        const predictedValue = probabilities[0];
        const predictedClassIndex = predictedValue > threshold ? 0 : 1;

        return { 
            label: classes[predictedClassIndex],
            confidence: Math.round((predictedValue > threshold ? predictedValue : 1 - predictedValue) * 100) / 100
        };
    } catch (error) {
        console.error('Prediction error details:', {
            error: error.message,
            tensorShape: tensor ? tensor.shape : null,
            predictionShape: prediction ? prediction.shape : null
        });
        throw new InputError(`Terjadi kesalahan saat memproses gambar: ${error.message}`);
    } finally {
        // Cleanup tensors to prevent memory leaks
        if (tensor) tensor.dispose();
        if (prediction) prediction.dispose();
    }
}

export default predictClassification;
