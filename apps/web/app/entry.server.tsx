import { PassThrough } from 'node:stream';
import { createReadableStreamFromReadable } from '@react-router/node';
import { createElement } from 'react';
import { renderToPipeableStream, type RenderToPipeableStreamOptions } from 'react-dom/server';
import { ServerRouter, type EntryContext, type RouterContextProvider } from 'react-router';

export const streamTimeout = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: RouterContextProvider,
) {
  if (request.method.toUpperCase() === 'HEAD') {
    return new Response(null, { status: responseStatusCode, headers: responseHeaders });
  }

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const readyOption: keyof RenderToPipeableStreamOptions = 'onAllReady';
    const timeoutId = setTimeout(() => abort(), streamTimeout + 1000);
    const { pipe, abort } = renderToPipeableStream(createElement(ServerRouter, { context: routerContext, url: request.url }), {
      [readyOption]() {
        shellRendered = true;
        const body = new PassThrough({
          final(callback) {
            clearTimeout(timeoutId);
            callback();
          },
        });
        responseHeaders.set('Content-Type', 'text/html');
        pipe(body);
        resolve(new Response(createReadableStreamFromReadable(body), { headers: responseHeaders, status: responseStatusCode }));
      },
      onShellError(error: unknown) {
        reject(error);
      },
      onError(_error: unknown) {
        responseStatusCode = 500;
        if (shellRendered) console.error('WWW render failed after the shell.');
      },
    });
  });
}
