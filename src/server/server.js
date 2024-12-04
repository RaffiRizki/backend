import dotenv from 'dotenv';
import Hapi from '@hapi/hapi';
import routes from './routes.js';
import loadModel from '../services/loadModel.js';
import InputError from '../exceptions/InputError.js';

dotenv.config();

const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT || 8080,
        host: process.env.HOST || '0.0.0.0',
        routes: {
            cors: {
                origin: ['*']
            }
        }
    });

    server.route(routes);

    server.ext('onPreResponse', (request, h) => {
        const response = request.response;
        
        if (response instanceof InputError) {
            const newResponse = h.response({
                status: 'fail',
                message: 'Terjadi kesalahan dalam melakukan prediksi'
            });
            newResponse.code(response.statusCode);
            return newResponse;
        }

        if (response.isBoom) {
            const newResponse = h.response({
                status: 'fail',
                message: response.message
            });
            newResponse.code(response.output.statusCode);
            return newResponse;
        }

        return h.continue;
    });

    const model = await loadModel();
    server.app.model = model;

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
    console.error(err);
    process.exit(1);
});

init();