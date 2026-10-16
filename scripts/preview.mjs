import { preview } from 'astro';

/** Bind port 0 so the OS allocates a free port without a find-then-bind race. */
export async function startPreview() {
  const port = Number(process.env.PORT ?? 0);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT must be an integer between 0 and 65535');
  }
  const server = await preview({
    logLevel: 'silent',
    server: { host: '127.0.0.1', port },
    vite: { preview: { strictPort: true } },
  });
  const base = `http://127.0.0.1:${server.port}/economia-financiera/`;
  console.log(`Preview: ${base} (${process.cwd()})`);
  return { base, stop: () => server.stop() };
}
