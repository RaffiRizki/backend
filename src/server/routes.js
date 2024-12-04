import { postPredictHandler, getAllHistoriesHandler } from './handler.js';

const routes = [
    {
        method: 'POST',
        path: '/predict',
        handler: postPredictHandler,
        options: {
            payload: {
                allow: 'multipart/form-data',
                multipart: true,
                maxBytes: 1000000
            }
        }
    },
    {
        method: 'GET',
        path: '/predict/histories',
        handler: getAllHistoriesHandler // Periksa apakah fungsi ini benar
    }
];

// Menggunakan export default untuk mengekspor routes
export default routes;
