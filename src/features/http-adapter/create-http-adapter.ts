import type { WorkbenchAdapter } from '@/entities/adapter';
import type { WorkbenchNode } from '@/entities/node';

export interface HttpAdapterOptions {
  /** Endpoint returning the file-tree JSON as `WorkbenchNode[]`. */
  treeUrl: string;
  /** Endpoint returning a file's contents; `{id}` is replaced with the node id. */
  fileUrl: string;
  /** Extra request headers, e.g. `Authorization`. */
  headers?: Record<string, string>;
}

/**
 * Connect a REST API that serves the file tree as JSON and file contents as
 * text — a starting point for remote sources like GitLab or an in-house store.
 *
 * `writeFile` is unsupported by default: persistence conventions (PUT vs PATCH,
 * body shape, conflict handling) differ per service, so fixing one here would
 * constrain more than it helps. Wrap the adapter and override `writeFile` where
 * you need it.
 */
export const createHttpAdapter = (
  options: HttpAdapterOptions,
): WorkbenchAdapter => {
  const { treeUrl, fileUrl, headers } = options;

  // GET `url`, throwing `<method> failed: <status>` on a non-ok response so the
  // caller sees which request failed and with what status code.
  const get = async (url: string, method: string): Promise<Response> => {
    const res = await fetch(url, { headers });

    if (!res.ok) {
      throw new Error(`${method} failed: ${res.status}`);
    }

    return res;
  };

  return {
    getTree: async () => {
      const res = await get(treeUrl, 'getTree');
      return (await res.json()) as WorkbenchNode[];
    },
    loadChildren: async node => {
      const url = `${treeUrl}?parentId=${encodeURIComponent(node.id)}`;
      const res = await get(url, 'loadChildren');
      return (await res.json()) as WorkbenchNode[];
    },
    readFile: async node => {
      const url = fileUrl.replace('{id}', encodeURIComponent(node.id));
      const res = await get(url, 'readFile');
      return res.text();
    },
    // Left unsupported on purpose — see the doc comment above.
    writeFile: () =>
      Promise.reject(
        new Error('HttpAdapter does not support writeFile by default.'),
      ),
  };
};
