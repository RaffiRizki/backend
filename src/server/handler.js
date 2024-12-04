import predict from '../services/inferenceService.js';
import { storeData, getData, getHistories } from '../services/storeData.js';
import crypto from 'crypto';
import InputError from '../exceptions/InputError.js';  // Pastikan InputError diimpor dengan benar

// Handler untuk menerima prediksi
async function postPredictHandler(request, h) {
    try {
        const { image } = request.payload;
        const { model } = request.server.app;

        // Validasi input
        if (!image) {
            throw new InputError('Image is required');
        }
        if (!image.hapi.headers['content-type'].match(/^image\/(jpg|jpeg|png)$/)) {
            throw new InputError('File must be jpg/jpeg/png');
        }

        // Convert stream menjadi buffer
        const buffer = await new Promise((resolve, reject) => {
            const chunks = [];
            image.on('data', (chunk) => chunks.push(chunk));
            image.on('end', () => resolve(Buffer.concat(chunks)));
            image.on('error', reject);
        });

        // Dapatkan prediksi dan confidence score
        const { confidenceScore, label } = await predict(model, buffer);

        // Generate data
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const suggestion = label === 'Cancer' ? 'Segera hubungi dokter' : 'None';
        
        const data = {
            id,
            result: label,
            suggestion,
            confidenceScore,
            createdAt
        };

        // Simpan data
        await storeData(id, data);

        // Return response
        const response = h.response({
            status: 'success',
            message: confidenceScore > 0.5 
                ? 'Model is predicted successfully'
                : 'Please use a clearer picture for better prediction',
            data
        });
        response.code(201);  // Status 201 untuk pembuatan resource
        return response;

    } catch (error) {
        if (error instanceof InputError) {
            const response = h.response({
                status: 'fail',
                message: error.message
            });
            response.code(400); // Bad request
            return response;
        }
        // Tangani kesalahan lain (internal server error)
        const response = h.response({
            status: 'error',
            message: 'Internal server error'
        });
        response.code(500); // Server error
        return response;
    }
}

// Handler untuk mengambil histori berdasarkan ID
async function historiesPredictHandler(request, h) {
    const { id } = request.params;
    const data = await getData(id);
    
    if (!data) {
        const response = h.response({
            status: 'fail',
            message: 'Prediction not found'
        });
        response.code(404); // Not found
        return response;
    }

    const response = h.response({
        status: 'success',
        data
    });
    response.code(200); // OK
    return response;
}

// Handler untuk mengambil semua histori prediksi
async function getAllHistoriesHandler(request, h) {
    try {
        const histories = await getHistories();
        return h.response({
            status: 'success',
            data: histories
        }).code(200); // OK
    } catch (error) {
        const response = h.response({
            status: 'fail',
            message: 'Failed to retrieve histories'
        });
        response.code(500); // Server error
        return response;
    }
}

export { postPredictHandler, historiesPredictHandler, getAllHistoriesHandler };
