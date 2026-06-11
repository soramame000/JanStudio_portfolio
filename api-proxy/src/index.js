import { AutoRouter, cors } from 'itty-router';

// CORS設定（すべてのオリジンからのGETを許可）
const { preflight, corsify } = cors({
    origin: '*',
    allowMethods: ['GET', 'OPTIONS'],
});

const router = AutoRouter({
    before: [preflight],
    finally: [corsify],
});

// 公開して良いCMSエンドポイントの許可リスト
const ALLOWED_ENDPOINTS = ['photos', 'blogPosts', 'projects', 'siteSettings'];

// microCMS API fetch function
async function fetchCMS(endpoint, env) {
    const baseUrl = env.CMS_BASE_URL.replace(/\/+$/, '');
    const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    const url = new URL(baseUrl + path);
    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'X-MICROCMS-API-KEY': env.CMS_API_KEY,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) return null;
    return response.json();
}

// OGPインジェクション用の HTMLRewriter ハンドラー
class OGPInjector {
    constructor(ogData = {}) {
        this.ogData = ogData;
    }
    element(element) {
        if (this.ogData.title) {
            element.append(`<meta property="og:title" content="${this.ogData.title}" />`, { html: true });
            element.append(`<meta name="twitter:title" content="${this.ogData.title}" />`, { html: true });
        }
        if (this.ogData.description) {
            element.append(`<meta property="og:description" content="${this.ogData.description}" />`, { html: true });
            element.append(`<meta name="twitter:description" content="${this.ogData.description}" />`, { html: true });
        }
        if (this.ogData.image) {
            element.append(`<meta property="og:image" content="${this.ogData.image}" />`, { html: true });
            element.append(`<meta name="twitter:image" content="${this.ogData.image}" />`, { html: true });
            element.append(`<meta name="twitter:card" content="summary_large_image" />`, { html: true });
        }
        if (this.ogData.url) {
            element.append(`<meta property="og:url" content="${this.ogData.url}" />`, { html: true });
        }
    }
}

// /api/* のリクエストをmicroCMSにプロキシする
router.get('/api/*', async (request, env) => {
    if (!env.CMS_BASE_URL || !env.CMS_API_KEY) {
        return new Response(JSON.stringify({ error: 'CMS configurations are missing in the environment' }), { status: 500 });
    }

    const url = new URL(request.url);

    // 例: /api/photos?limit=10 -> https://your-service.microcms.io/api/v1/photos?limit=10
    const cmsPath = url.pathname.replace('/api/', '/');

    // 許可リスト外のエンドポイントは拒否する
    const segments = cmsPath.split('/').filter(Boolean);
    const endpointName = segments[0] || '';
    if (!ALLOWED_ENDPOINTS.includes(endpointName) || segments.length > 2) {
        return new Response(JSON.stringify({ error: 'Endpoint not allowed' }), { status: 404 });
    }

    const baseUrl = env.CMS_BASE_URL.replace(/\/+$/, '');
    const path = cmsPath.startsWith('/') ? cmsPath : '/' + cmsPath;
    const targetUrl = new URL(baseUrl + path);

    url.searchParams.forEach((value, key) => {
        targetUrl.searchParams.append(key, value);
    });

    // photos 一覧は公開ステータスのものだけを返す（下書きの漏えい防止）
    const isListRequest = segments.length === 1;
    if (endpointName === 'photos' && isListRequest) {
        const publicFilter = 'publishStatus[contains]public';
        const clientFilters = targetUrl.searchParams.get('filters');
        targetUrl.searchParams.set(
            'filters',
            clientFilters ? `(${clientFilters})[and]${publicFilter}` : publicFilter
        );
    }

    try {
        const response = await fetch(targetUrl.toString(), {
            method: 'GET',
            headers: {
                'X-MICROCMS-API-KEY': env.CMS_API_KEY,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60',
            },
        });
    } catch (error) {
        console.error("Error making request to CMS:", error.message, error.stack);
        return new Response(JSON.stringify({ error: 'Failed to fetch from CMS' }), { status: 502 });
    }
});

// HTMLリクエストに対するOGPタグの動的生成
// 注意: この機能を本番で有効にするには、このWorkerにサイト本体のassetsバインディング
// (wrangler.jsonc の "assets" 設定) を追加し、ドメインのルーティングをWorker経由にする必要がある
router.get('/*.html', async (request, env) => {
    const url = new URL(request.url);
    const path = url.pathname;
    const id = url.searchParams.get('id');

    let htmlResponse;
    try {
        if (env.ASSETS) {
            htmlResponse = await env.ASSETS.fetch(request);
        } else {
            return new Response("Not Found", { status: 404 });
        }
    } catch (e) {
        return new Response("Not Found", { status: 404 });
    }

    // idがなければそのままHTMLを返す
    if (!id || (path !== '/project.html' && path !== '/journal.html')) {
        return htmlResponse;
    }

    let ogData = {
        url: request.url
    };

    const escapeAttr = (value) => String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

    if (path === '/project.html') {
        const project = await fetchCMS(`/projects/${encodeURIComponent(id)}`, env);
        if (project) {
            ogData.title = escapeAttr(`${project.title || 'Project'} | JAN STUDIO`);
            ogData.description = escapeAttr(project.summary || 'JAN STUDIO の撮影案件詳細。');
            if (project.mainImage?.url) {
                ogData.image = project.mainImage.url + "?w=1200&h=630&fit=crop";
            }
        }
    } else if (path === '/journal.html') {
        const post = await fetchCMS(`/blogPosts/${encodeURIComponent(id)}`, env);
        if (post) {
            ogData.title = escapeAttr(`${post.title || 'Journal'} | JAN STUDIO`);
            // htmlタグを取り除く簡易処理
            ogData.description = escapeAttr(post.body ? post.body.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...' : 'JAN STUDIO ジャーナル記事');
            if (post.thumbnail?.url) {
                ogData.image = post.thumbnail.url + "?w=1200&h=630&fit=crop";
            }
        }
    }

    // HTMLRewriterを使って <head> 内に meta タグを挿入
    const rewriter = new HTMLRewriter()
        .on('head', new OGPInjector(ogData));

    return rewriter.transform(htmlResponse);
});

// API以外のリクエストはNot Found（静的ファイルはWranglerが自動的に/publicから配信する）
router.all('*', (request, env) => {
    if (env.ASSETS) {
        return env.ASSETS.fetch(request);
    }
    return new Response('Not Found', { status: 404 });
});

export default {
    fetch: router.fetch,
};
