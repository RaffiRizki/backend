import * as tf from '@tensorflow/tfjs-node';
import { promises as fs } from 'fs';
import path from 'path';

async function loadModel() {
    try {
        const modelPath = path.resolve(process.env.MODEL_PATH);  // Resolves the model path from environment variable
        const modelDir = path.dirname(modelPath);  // Extracts the directory from the model path
        
        console.log('Attempting to load model from:', modelPath);
        
        // Check if the model.json file exists
        try {
            await fs.access(modelPath);
            console.log('model.json found');
        } catch (error) {
            throw new Error(`model.json not found at ${modelPath}`);
        }

        const shardPattern = /group1-shard\dof4\.bin/;
        const dirContents = await fs.readdir(modelDir);  // Read contents of the directory
        const shardFiles = dirContents.filter(file => shardPattern.test(file));  // Filter shard files by pattern
        
        console.log('Found shard files:', shardFiles);
        
        // Check if no shard files are found
        if (shardFiles.length === 0) {
            throw new Error('No shard files found in model directory');
        }

        // Read and parse the model JSON file
        const modelJson = JSON.parse(await fs.readFile(modelPath, 'utf8'));
        console.log('Model format:', modelJson.format);
        
        // Ensure that the model format is correct
        if (modelJson.format !== 'graph-model') {
            throw new Error('Invalid model format. Expected "graph-model"');
        }

        // Load the TensorFlow model
        const handler = tf.io.fileSystem(modelPath);
        const model = await tf.loadGraphModel(handler);

        console.log('Model loaded successfully');
        console.log('Model inputs:', model.inputs.map(i => i.shape));
        console.log('Model outputs:', model.outputs.map(o => o.shape));

        return model;
    } catch (error) {
        console.error('Error loading model:', {
            message: error.message,
            modelPath: process.env.MODEL_PATH,
            stack: error.stack
        });
        throw error;
    }
}

export default loadModel;  // Changed to export default as it's a single function
