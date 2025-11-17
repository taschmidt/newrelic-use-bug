import { serializeError } from '@common.js/serialize-error';
import type { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import { Builder } from 'xml2js';

export function errorHandler(
    type: 'json' | 'xml' = 'json',
    { end = true } = {},
): (RequestHandler | ErrorRequestHandler)[] {
    let sender = (error: any, res: Response) => {
        res.type('json').send(error);
    };

    if (type === 'xml') {
        sender = (error, res) => {
            const xml = new Builder({ renderOpts: { pretty: false } }).buildObject({
                error: error,
            });
            res.type('xml').send(xml);
        };
    }

    const handlers: (RequestHandler | ErrorRequestHandler)[] = [];
    if (end) {
        handlers.push((_req: Request, res: Response, _next: NextFunction) => {
            res.status(404).end();
        });
    }

    handlers.push((err: Error & { url?: string }, req: Request, res: Response, _next: NextFunction) => {
        // make sure a thrown string is wrapped in an Error
        if (typeof err === 'string') err = new Error(err);

        const serializedError = serializeError(err);
        serializedError.message = serializedError.message || 'Unknown error';
        serializedError.url = err.url || req.originalUrl;

        if (!process.env.ERROR_HANDLER_SILENT) {
            console.error(serializedError);
        }

        // don't return the stack in prod
        if (req.app.get('env') !== 'development') delete serializedError.stack;

        res.status(500);

        sender(serializedError, res);
    });

    return handlers;
}


/** Handles 404's and API errors (returning JSON).
 * Usage: express.use(apiErrorHandler)
 * NOTE: goes AFTER other route handlers
 */
export const apiErrorHandler = errorHandler('json');

/**
 * Same as apiErrorHandler but returns XML;
 */
export const xmlErrorHandler = errorHandler('xml');
